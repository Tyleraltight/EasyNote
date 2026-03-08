import type { Flag, MemoData } from './types';

const FLAGS_KEY = 'annual-flags';
const MEMO_KEY = 'todo-flag-memo';
const DB_NAME = 'noteeee-db';
const DB_STORE = 'data';
const DB_VERSION = 1;

// ── IndexedDB helpers ──

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
    if (dbInstance) return Promise.resolve(dbInstance);
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(DB_STORE)) {
                db.createObjectStore(DB_STORE);
            }
        };
        req.onsuccess = () => {
            dbInstance = req.result;
            resolve(req.result);
        };
        req.onerror = () => reject(req.error);
    });
}

async function idbGet<T>(key: string): Promise<T | null> {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(DB_STORE, 'readonly');
            const store = tx.objectStore(DB_STORE);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result ?? null);
            req.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
}

async function idbSet(key: string, value: unknown): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(DB_STORE, 'readwrite');
            const store = tx.objectStore(DB_STORE);
            store.put(value, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    } catch {
        // Silently fail for IndexedDB writes
    }
}

// ── Storage error type ──

export type StorageError = { type: 'quota'; message: string } | null;

// ── Save functions (dual-write: localStorage + IndexedDB) ──

export function saveFlags(flags: Flag[]): StorageError {
    const json = JSON.stringify(flags);
    try {
        localStorage.setItem(FLAGS_KEY, json);
    } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            return { type: 'quota', message: '存储空间已满，请导出备份后清理数据' };
        }
    }
    // Async IndexedDB write (fire-and-forget)
    idbSet(FLAGS_KEY, flags);
    return null;
}

export function saveMemo(data: MemoData): StorageError {
    const json = JSON.stringify(data);
    try {
        localStorage.setItem(MEMO_KEY, json);
    } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            return { type: 'quota', message: '存储空间已满，请导出备份后清理数据' };
        }
    }
    idbSet(MEMO_KEY, data);
    return null;
}

// ── Load functions (Safe Hydration: localStorage → IndexedDB fallback) ──

export async function loadFlagsAsync(): Promise<Flag[]> {
    // Priority 1: localStorage
    try {
        const raw = localStorage.getItem(FLAGS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) { console.warn('localStorage read error:', e); }

    // Priority 2: IndexedDB
    const idbData = await idbGet<Flag[]>(FLAGS_KEY);
    if (idbData && Array.isArray(idbData) && idbData.length > 0) {
        // Restore to localStorage for next fast load
        try { localStorage.setItem(FLAGS_KEY, JSON.stringify(idbData)); } catch { /* ignore */ }
        return idbData;
    }

    return [];
}

export async function loadMemoAsync(): Promise<MemoData> {
    const empty: MemoData = { mode: 'note', text: '', todos: [] };

    // Priority 1: localStorage
    try {
        const raw = localStorage.getItem(MEMO_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && (parsed.text || parsed.todos?.length > 0)) return parsed;
        }
    } catch (e) { console.warn('localStorage read error:', e); }

    // Priority 2: IndexedDB
    const idbData = await idbGet<MemoData>(MEMO_KEY);
    if (idbData && (idbData.text || idbData.todos?.length > 0)) {
        try { localStorage.setItem(MEMO_KEY, JSON.stringify(idbData)); } catch { /* ignore */ }
        return idbData;
    }

    return empty;
}

// Synchronous loaders kept for backward compatibility (import function uses these)
export function loadFlags(): Flag[] {
    try {
        const raw = localStorage.getItem(FLAGS_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) { console.warn(e); }
    return [];
}

export function loadMemo(): MemoData {
    try {
        const raw = localStorage.getItem(MEMO_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) { console.warn(e); }
    return { mode: 'note', text: '', todos: [] };
}

// ── Export / Import ──

export function exportAllData() {
    const data = {
        flags: loadFlags(),
        memo: loadMemo(),
        exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noteeee-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Silent backup (auto-triggered, same as export but no-op if recently backed up)
let lastAutoBackupTime = 0;
export function silentBackup() {
    const now = Date.now();
    // Prevent duplicate backups within 30 seconds
    if (now - lastAutoBackupTime < 30000) return;
    lastAutoBackupTime = now;
    exportAllData();
}

export function importAllData(file: File): Promise<{ flags: Flag[]; memo: MemoData } | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (data.flags) {
                    localStorage.setItem(FLAGS_KEY, JSON.stringify(data.flags));
                    idbSet(FLAGS_KEY, data.flags);
                }
                if (data.memo) {
                    localStorage.setItem(MEMO_KEY, JSON.stringify(data.memo));
                    idbSet(MEMO_KEY, data.memo);
                }
                resolve({ flags: data.flags || [], memo: data.memo || { mode: 'note', text: '', todos: [] } });
            } catch {
                resolve(null);
            }
        };
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
    });
}
