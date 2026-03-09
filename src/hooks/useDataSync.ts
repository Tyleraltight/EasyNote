import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Flag, MemoData } from '../types';
import { getWeekId, getMonthId } from '../types';

const FLAGS_KEY = 'annual-flags';
const MEMO_KEY = 'todo-flag-memo';

// ── Local cache helpers ──

function readLocalFlags(): Flag[] {
    try {
        const raw = localStorage.getItem(FLAGS_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
}

function readLocalMemo(): MemoData {
    try {
        const raw = localStorage.getItem(MEMO_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { mode: 'note', text: '', todos: [] };
}

function writeLocalFlags(flags: Flag[]) {
    try { localStorage.setItem(FLAGS_KEY, JSON.stringify(flags)); } catch { /* ignore */ }
}

function writeLocalMemo(memo: MemoData) {
    try { localStorage.setItem(MEMO_KEY, JSON.stringify(memo)); } catch { /* ignore */ }
}

// ── Supabase row → Flag conversion ──

interface FlagRow {
    id: string;
    name: string;
    current: number;
    total: number;
    unit: string;
    color: string;
    cycle: string;
    history: string[];
    reminder: unknown;
    sort_order: number;
}

function rowToFlag(row: FlagRow): Flag {
    return {
        id: row.id,
        name: row.name,
        current: row.current,
        total: row.total,
        unit: row.unit,
        color: row.color,
        cycle: (row.cycle || 'none') as Flag['cycle'],
        history: row.history || [],
        reminder: row.reminder as Flag['reminder'],
    };
}

// ── The Hook ──

export function useDataSync(userId: string | null) {
    const [flags, setFlags] = useState<Flag[]>([]);
    const [memo, setMemo] = useState<MemoData>({ mode: 'note', text: '', todos: [] });
    const [loaded, setLoaded] = useState(false);

    // Refs to track latest values for debounced writes
    const flagsRef = useRef(flags);
    const memoRef = useRef(memo);
    flagsRef.current = flags;
    memoRef.current = memo;

    // Skip syncing during initial load
    const initialLoadDone = useRef(false);

    // ── Cycle reset helper: resets flags whose cycle period has changed ──
    function applyCycleReset(flagsData: Flag[], lastWeek: string, lastMonth: string): { flags: Flag[]; weekChanged: boolean; monthChanged: boolean } {
        const currentWeek = getWeekId();
        const currentMonth = getMonthId();
        const weekChanged = !!lastWeek && lastWeek !== currentWeek;
        const monthChanged = !!lastMonth && lastMonth !== currentMonth;

        if (!weekChanged && !monthChanged) return { flags: flagsData, weekChanged: false, monthChanged: false };

        const resetFlags = flagsData.map(f => {
            const cycle = f.cycle || 'none';
            if (cycle === 'weekly' && weekChanged) return { ...f, current: 0 };
            if (cycle === 'monthly' && monthChanged) return { ...f, current: 0 };
            return f;
        });
        return { flags: resetFlags, weekChanged, monthChanged };
    }

    // ── Initial data load ──
    useEffect(() => {
        initialLoadDone.current = false;

        if (!userId) {
            // Not logged in: use localStorage only
            const localFlags = readLocalFlags();
            const lastWeek = localStorage.getItem('easynote-last-week') || '';
            const lastMonth = localStorage.getItem('easynote-last-month') || '';
            const { flags: resetFlags } = applyCycleReset(localFlags, lastWeek, lastMonth);
            localStorage.setItem('easynote-last-week', getWeekId());
            localStorage.setItem('easynote-last-month', getMonthId());
            setFlags(resetFlags);
            setMemo(readLocalMemo());
            setLoaded(true);
            initialLoadDone.current = true;
            return;
        }

        // Logged in: fetch from Supabase, migrate local data if needed
        (async () => {
            try {
                const [{ data: flagRows }, { data: memoRow }] = await Promise.all([
                    supabase.from('flags').select('*').eq('user_id', userId).order('sort_order'),
                    supabase.from('memos').select('*').eq('user_id', userId).single(),
                ]);

                const remoteFlagsExist = flagRows && flagRows.length > 0;
                const remoteMemoExists = memoRow && (memoRow.text || memoRow.todos?.length > 0);

                // Check for local data to migrate
                const localFlags = readLocalFlags();
                const localMemo = readLocalMemo();
                const localFlagsExist = localFlags.length > 0;
                const localMemoExists = localMemo.text || localMemo.todos.length > 0;

                let loadedFlags: Flag[] = [];

                // Migration: push local data to Supabase if remote is empty but local has data
                if (!remoteFlagsExist && localFlagsExist) {
                    const rows = localFlags.map((f, i) => ({
                        id: f.id,
                        user_id: userId,
                        name: f.name,
                        current: f.current,
                        total: f.total,
                        unit: f.unit,
                        color: f.color,
                        cycle: f.cycle || 'none',
                        history: f.history,
                        reminder: f.reminder,
                        sort_order: i,
                    }));
                    await supabase.from('flags').upsert(rows);
                    loadedFlags = localFlags;
                } else if (remoteFlagsExist) {
                    loadedFlags = (flagRows as FlagRow[]).map(rowToFlag);
                    writeLocalFlags(loadedFlags);
                }

                // Cycle reset using Supabase-stored last_week/last_month
                const lastWeek = memoRow?.last_week || '';
                const lastMonth = memoRow?.last_month || '';
                const { flags: resetFlags, weekChanged, monthChanged } = applyCycleReset(loadedFlags, lastWeek, lastMonth);

                if (weekChanged || monthChanged) {
                    // Write reset flags back to Supabase
                    const resetRows = resetFlags.map((f, i) => ({
                        id: f.id, user_id: userId, name: f.name, current: f.current,
                        total: f.total, unit: f.unit, color: f.color, cycle: f.cycle || 'none',
                        history: f.history, reminder: f.reminder, sort_order: i,
                        updated_at: new Date().toISOString(),
                    }));
                    if (resetRows.length > 0) {
                        supabase.from('flags').upsert(resetRows).then(({ error }) => {
                            if (error) console.warn('Cycle reset sync error:', error);
                        });
                    }
                }

                // Always update last_week/last_month to current values
                const currentWeek = getWeekId();
                const currentMonth = getMonthId();
                if (lastWeek !== currentWeek || lastMonth !== currentMonth) {
                    supabase.from('memos').upsert({
                        user_id: userId,
                        last_week: currentWeek,
                        last_month: currentMonth,
                        ...(remoteMemoExists ? {} : { mode: 'note', text: '', todos: [] }),
                    }).then(({ error }) => {
                        if (error) console.warn('Cycle ID sync error:', error);
                    });
                }

                setFlags(resetFlags);

                if (!remoteMemoExists && localMemoExists) {
                    await supabase.from('memos').upsert({
                        user_id: userId,
                        mode: localMemo.mode,
                        text: localMemo.text,
                        todos: localMemo.todos,
                        last_week: currentWeek,
                        last_month: currentMonth,
                    });
                    setMemo(localMemo);
                } else if (remoteMemoExists) {
                    const parsed: MemoData = {
                        mode: memoRow.mode,
                        text: memoRow.text,
                        todos: memoRow.todos || [],
                    };
                    setMemo(parsed);
                    writeLocalMemo(parsed);
                } else {
                    setMemo({ mode: 'note', text: '', todos: [] });
                }
            } catch (err) {
                console.warn('Supabase load failed, falling back to localStorage:', err);
                setFlags(readLocalFlags());
                setMemo(readLocalMemo());
            }

            setLoaded(true);
            initialLoadDone.current = true;
        })();
    }, [userId]);

    // ── Sync flags to Supabase on change ──
    useEffect(() => {
        if (!loaded || !initialLoadDone.current) return;

        // Always write to localStorage as cache
        writeLocalFlags(flags);

        if (!userId) return;

        // Upsert all flags to Supabase
        const rows = flags.map((f, i) => ({
            id: f.id,
            user_id: userId,
            name: f.name,
            current: f.current,
            total: f.total,
            unit: f.unit,
            color: f.color,
            cycle: f.cycle || 'none',
            history: f.history,
            reminder: f.reminder,
            sort_order: i,
            updated_at: new Date().toISOString(),
        }));

        if (rows.length > 0) {
            supabase.from('flags').upsert(rows).then(({ error }) => {
                if (error) console.warn('Flags sync error:', error);
            });
        }

        // Delete flags that were removed: fetch current IDs from server and diff
        supabase.from('flags').select('id').eq('user_id', userId).then(({ data }) => {
            if (!data) return;
            const currentIds = new Set(flags.map(f => f.id));
            const toDelete = data.filter(row => !currentIds.has(row.id)).map(row => row.id);
            if (toDelete.length > 0) {
                supabase.from('flags').delete().in('id', toDelete).then(({ error }) => {
                    if (error) console.warn('Flags delete sync error:', error);
                });
            }
        });
    }, [flags, loaded, userId]);

    // ── Sync memo to Supabase on change (debounced) ──
    const memoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!loaded || !initialLoadDone.current) return;

        // Always write to localStorage as cache
        writeLocalMemo(memo);

        if (!userId) return;

        // Debounce Supabase write by 500ms
        if (memoTimerRef.current) clearTimeout(memoTimerRef.current);
        memoTimerRef.current = setTimeout(() => {
            supabase.from('memos').upsert({
                user_id: userId,
                mode: memo.mode,
                text: memo.text,
                todos: memo.todos,
                updated_at: new Date().toISOString(),
            }).then(({ error }) => {
                if (error) console.warn('Memo sync error:', error);
            });
        }, 500);

        return () => {
            if (memoTimerRef.current) clearTimeout(memoTimerRef.current);
        };
    }, [memo, loaded, userId]);

    // ── Wrapped setters ──
    const updateFlags = useCallback((updater: Flag[] | ((prev: Flag[]) => Flag[])) => {
        setFlags(updater);
    }, []);

    const updateMemo = useCallback((updater: MemoData | ((prev: MemoData) => MemoData)) => {
        setMemo(updater);
    }, []);

    return { flags, memo, setFlags: updateFlags, setMemo: updateMemo, loaded };
}
