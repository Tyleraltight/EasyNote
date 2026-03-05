import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, X, StickyNote, ListTodo, Trash2, Bell, ChevronLeft, ChevronRight, Zap, RotateCcw } from 'lucide-react';
import type { Flag, MemoItem } from './types';
import { COLORS, getColorTheme, todayKey } from './types';
import { loadFlagsAsync, loadMemoAsync, saveFlags, saveMemo, silentBackup } from './storage';

export default function Dashboard() {
    const [flags, setFlags] = useState<Flag[]>([]);
    const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
    const [newFlag, setNewFlag] = useState({ name: '', total: 10, unit: '次', color: COLORS[0].value });

    const [memoMode, setMemoMode] = useState<'note' | 'todo'>('note');
    const [noteContent, setNoteContent] = useState('');
    const [todos, setTodos] = useState<MemoItem[]>([]);
    const [newTodo, setNewTodo] = useState('');
    const [pressedId, setPressedId] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false); // Prevents empty-state overwrites
    const [toast, setToast] = useState<string | null>(null);

    // Drag & drop state
    const [dragId, setDragId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    // Show toast helper
    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }, []);

    // Review month state: default to current month
    const [reviewMonth, setReviewMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });

    // Safe Hydration: async load with localStorage → IndexedDB fallback
    useEffect(() => {
        (async () => {
            const [flagsData, memoData] = await Promise.all([
                loadFlagsAsync(),
                loadMemoAsync(),
            ]);
            setFlags(flagsData);
            setMemoMode(memoData.mode);
            setNoteContent(memoData.text);
            setTodos(memoData.todos);
            setLoaded(true);
        })();
    }, []);

    // Persist flags (only after initial load, prevents empty overwrite)
    useEffect(() => {
        if (!loaded) return;
        const err = saveFlags(flags);
        if (err) showToast(err.message);
    }, [flags, loaded, showToast]);

    // Persist memo (only after initial load)
    useEffect(() => {
        if (!loaded) return;
        const err = saveMemo({ mode: memoMode, text: noteContent, todos });
        if (err) showToast(err.message);
    }, [memoMode, noteContent, todos, loaded, showToast]);

    // Flag actions
    const handleIncrement = (id: string) => {
        // Trigger press animation
        setPressedId(id);
        setTimeout(() => setPressedId(null), 200);
        setFlags(prev => prev.map(f => {
            if (f.id === id && f.current < f.total) {
                const updated = { ...f, current: f.current + 1, history: [...f.history, todayKey()] };
                // Auto-backup when flag reaches 100%
                if (updated.current >= updated.total) {
                    setTimeout(() => silentBackup(), 500);
                }
                return updated;
            }
            return f;
        }));
    };

    // Auto-pick the next unused color from COLORS pool
    const getNextColor = () => {
        const usedColors = new Set(flags.map(f => f.color));
        const available = COLORS.find(c => !usedColors.has(c.value));
        // If all colors used, cycle based on count
        return available ? available.value : COLORS[flags.length % COLORS.length].value;
    };

    const handleAddFlag = () => {
        if (!newFlag.name.trim() || newFlag.total <= 0) return;
        const flag: Flag = {
            id: crypto.randomUUID(),
            name: newFlag.name.trim(),
            current: 0,
            total: newFlag.total,
            unit: newFlag.unit || '次',
            color: getNextColor(),
            history: [],
            reminder: null,
        };
        setFlags([...flags, flag]);
        setNewFlag({ name: '', total: 10, unit: '次', color: COLORS[0].value });
        setIsFlagModalOpen(false);
    };

    const handleDeleteFlag = (id: string) => {
        setFlags(flags.filter(f => f.id !== id));
    };

    // Reset a completed flag back to zero
    const handleResetFlag = (id: string) => {
        setFlags(prev => prev.map(f =>
            f.id === id ? { ...f, current: 0, history: [] } : f
        ));
    };

    // Drag & drop handlers
    const handleDragStart = (id: string) => {
        setDragId(id);
    };
    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        if (id !== dragId) setDragOverId(id);
    };
    const handleDrop = (targetId: string) => {
        if (!dragId || dragId === targetId) return;
        setFlags(prev => {
            const newFlags = [...prev];
            const dragIdx = newFlags.findIndex(f => f.id === dragId);
            const targetIdx = newFlags.findIndex(f => f.id === targetId);
            const [removed] = newFlags.splice(dragIdx, 1);
            newFlags.splice(targetIdx, 0, removed);
            return newFlags;
        });
        setDragId(null);
        setDragOverId(null);
    };
    const handleDragEnd = () => {
        setDragId(null);
        setDragOverId(null);
    };

    // Convert a note line containing a number into a Flag
    const convertNoteToFlag = (line: string) => {
        const numMatch = line.match(/(\d+)/);
        if (!numMatch) return;
        const total = parseInt(numMatch[1]);
        // Use the line text (minus the number) as the flag name, fallback to full line
        const name = line.replace(/\d+/g, '').replace(/\s+/g, ' ').trim() || line.trim();
        const flag: Flag = {
            id: crypto.randomUUID(),
            name,
            current: 0,
            total,
            unit: '次',
            color: getNextColor(),
            history: [],
            reminder: null,
        };
        setFlags(prev => [...prev, flag]);
        // Remove the converted line from notes
        const lines = noteContent.split('\n');
        const newLines = lines.filter(l => l !== line);
        setNoteContent(newLines.join('\n'));
    };

    // Todo actions
    const addTodo = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTodo.trim()) {
            setTodos([...todos, { id: Date.now().toString(), text: newTodo.trim(), completed: false }]);
            setNewTodo('');
        }
    };

    // Monthly calendar helper
    const getMonthDays = (year: number, month: number) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startWeekday = firstDay.getDay(); // 0=Sun
        const totalDays = lastDay.getDate();
        const days: (string | null)[] = [];
        // Fill leading blanks
        for (let i = 0; i < startWeekday; i++) days.push(null);
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push(dateStr);
        }
        return days;
    };
    const monthDays = getMonthDays(reviewMonth.year, reviewMonth.month);
    const monthLabel = new Date(reviewMonth.year, reviewMonth.month).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
    const todayStr = todayKey();

    const goToPrevMonth = () => {
        setReviewMonth(prev => {
            const m = prev.month - 1;
            return m < 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: m };
        });
    };
    const goToNextMonth = () => {
        setReviewMonth(prev => {
            const m = prev.month + 1;
            return m > 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: m };
        });
    };
    const goToCurrentMonth = () => {
        const now = new Date();
        setReviewMonth({ year: now.getFullYear(), month: now.getMonth() });
    };

    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

    return (
        <div className="min-h-screen font-[Inter,system-ui,sans-serif] text-slate-900 pb-20">
            {/* Background */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-[#f8fafc]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000001a_1px,transparent_1px),linear-gradient(to_bottom,#0000001a_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_10%,rgba(249,115,22,0.2)_40%,rgba(248,250,252,1)_100%)]" />
            </div>

            <main className="max-w-[1200px] mx-auto px-8 pt-12">
                <header className="mb-12">
                    <h1 className="text-4xl font-black tracking-tight text-slate-800">EasyNote</h1>
                    <p className="text-slate-500 font-medium mt-2">{dateStr}</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 items-start">
                    {/* Left: Memo Sidebar */}
                    <aside className="sticky top-12 space-y-6">
                        <div className="bg-white/70 backdrop-blur-xl border border-white shadow-xl rounded-3xl p-6 min-h-[500px] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button onClick={() => setMemoMode('note')}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${memoMode === 'note' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                                        <StickyNote size={16} /> 想法
                                    </button>
                                    <button onClick={() => setMemoMode('todo')}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${memoMode === 'todo' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                                        <ListTodo size={16} /> 待办
                                    </button>
                                </div>
                            </div>
                            {memoMode === 'note' ? (
                                <div className="flex-1 flex flex-col relative">
                                    <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)}
                                        placeholder="随时记录你的灵感..."
                                        className="w-full flex-1 bg-transparent border-none focus:ring-0 focus:outline-none resize-none text-slate-700 leading-relaxed placeholder:text-slate-300 pr-10" />
                                    {/* Line-level convert buttons for lines with numbers */}
                                    {noteContent && (
                                        <div className="absolute right-0 top-0 flex flex-col pointer-events-none" style={{ lineHeight: '1.625rem' }}>
                                            {noteContent.split('\n').map((line, i) => (
                                                <div key={i} className="h-[1.625rem] flex items-center justify-end">
                                                    {/\d+/.test(line) && (
                                                        <button
                                                            onClick={() => convertNoteToFlag(line)}
                                                            title="转为 Flag"
                                                            className="pointer-events-auto w-6 h-6 rounded-lg bg-amber-50 hover:bg-amber-100 flex items-center justify-center transition-all hover:scale-110">
                                                            <Zap size={13} className="text-amber-500" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    <input type="text" value={newTodo} onChange={e => setNewTodo(e.target.value)} onKeyDown={addTodo}
                                        placeholder="添加任务，回车确认"
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 mb-4 text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all" />
                                    <div className="space-y-2 overflow-y-auto max-h-[400px]">
                                        {todos.map(todo => (
                                            <div key={todo.id} className="group flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-all">
                                                <button onClick={() => setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t))}
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${todo.completed ? 'bg-blue-500 border-blue-500' : 'border-slate-300 hover:border-blue-400'}`}>
                                                    {todo.completed && <Check size={12} className="text-white" />}
                                                </button>
                                                <span className={`text-sm flex-1 ${todo.completed ? 'text-slate-300 line-through' : 'text-slate-600'}`}>{todo.text}</span>
                                                <button onClick={() => setTodos(todos.filter(t => t.id !== todo.id))}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Right: Flags */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="w-2 h-6 bg-slate-900 rounded-full" />年度 Flag
                            </h2>
                            <button onClick={() => setIsFlagModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-lg">
                                <Plus size={18} /> 新增目标
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {flags.map(flag => {
                                const isDone = flag.current >= flag.total;
                                return (
                                    <div key={flag.id}
                                        draggable
                                        onDragStart={() => handleDragStart(flag.id)}
                                        onDragOver={(e) => handleDragOver(e, flag.id)}
                                        onDrop={() => handleDrop(flag.id)}
                                        onDragEnd={handleDragEnd}
                                        className={`group relative p-6 rounded-[2rem] border transition-all duration-300 cursor-grab active:cursor-grabbing
                                            ${dragId === flag.id ? 'opacity-50' : ''}
                                            ${dragOverId === flag.id ? 'ring-2 ring-slate-300' : ''}
                                            ${isDone ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                                        <button onClick={() => handleDeleteFlag(flag.id)}
                                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-50 hover:!opacity-100 text-slate-400 hover:text-rose-500 transition-all">
                                            <X size={16} />
                                        </button>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 h-8 rounded-full ${isDone ? 'bg-amber-500' : 'bg-slate-200 group-hover:bg-slate-400'} transition-all`} />
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-800">{flag.name}</h3>
                                                    <p className="text-xs font-bold text-slate-400 mt-0.5">{flag.current} / {flag.total} {flag.unit}</p>
                                                </div>
                                            </div>
                                            {isDone ? (
                                                <button onClick={() => handleResetFlag(flag.id)}
                                                    title="重置"
                                                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-amber-500 text-white hover:bg-amber-600">
                                                    <RotateCcw size={22} />
                                                </button>
                                            ) : (
                                                <button onClick={() => handleIncrement(flag.id)}
                                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${pressedId === flag.id ? 'btn-press-active' : ''} bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white`}>
                                                    <Plus size={24} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-300 ease-out rounded-full ${isDone ? 'bg-amber-500' : 'bg-slate-900'}`}
                                                style={{ width: `${Math.min((flag.current / flag.total) * 100, 100)}%` }} />
                                        </div>
                                    </div>
                                );
                            })}

                        </div>

                        {/* Progress Review - Monthly Block Calendar */}
                        {flags.length > 0 && (
                            <div className="pt-8 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Bell size={20} /> 进度回顾
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button onClick={goToPrevMonth}
                                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all">
                                            <ChevronLeft size={16} className="text-slate-600" />
                                        </button>
                                        <button onClick={goToCurrentMonth}
                                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-600 transition-all min-w-[120px] text-center">
                                            {monthLabel}
                                        </button>
                                        <button onClick={goToNextMonth}
                                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all">
                                            <ChevronRight size={16} className="text-slate-600" />
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                                    {/* Weekday headers */}
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                                            <div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
                                        ))}
                                    </div>
                                    {/* Day cells */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {monthDays.map((day, i) => {
                                            if (!day) return <div key={`blank-${i}`} />;
                                            const dayNum = parseInt(day.split('-')[2]);
                                            const isToday = day === todayStr;
                                            // Collect which flags were active on this day
                                            const activeFlags = flags.filter(f => f.history.includes(day));
                                            const hasActivity = activeFlags.length > 0;
                                            // Check if any flag was fully completed on this day
                                            const completedFlags = flags.filter(f => {
                                                const dayCount = f.history.filter(h => h === day).length;
                                                return dayCount >= f.total;
                                            });
                                            const hasCompleted = completedFlags.length > 0;
                                            const glowTheme = hasCompleted ? getColorTheme(completedFlags[0].color) : null;
                                            const glowStyle = hasCompleted && glowTheme
                                                ? { '--glow-color': `rgba(${glowTheme.shadow}, 0.5)` } as React.CSSProperties
                                                : undefined;
                                            return (
                                                <div key={day}
                                                    style={glowStyle}
                                                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all cursor-default group
                                                        ${hasCompleted ? 'day-completed-glow' : ''}
                                                        ${isToday ? 'bg-slate-900 text-white shadow-md' : hasActivity ? 'bg-slate-50 hover:bg-slate-100' : 'hover:bg-slate-50'}`}>
                                                    <span className={`text-sm font-semibold ${isToday ? 'text-white' : 'text-slate-700'}`}>{dayNum}</span>
                                                    {hasActivity && (
                                                        <div className="flex gap-0.5 mt-0.5">
                                                            {activeFlags.slice(0, 3).map(f => {
                                                                const theme = getColorTheme(f.color);
                                                                return <div key={f.id} className={`w-1.5 h-1.5 rounded-full ${theme.bg}`} />;
                                                            })}
                                                        </div>
                                                    )}
                                                    {/* Tooltip on hover */}
                                                    {hasActivity && (
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                                            {activeFlags.map(f => f.name).join(', ')}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Legend */}
                                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
                                        {flags.map(flag => {
                                            const theme = getColorTheme(flag.color);
                                            const monthCount = flag.history.filter(h => {
                                                const [y, m] = h.split('-').map(Number);
                                                return y === reviewMonth.year && m - 1 === reviewMonth.month;
                                            }).length;
                                            return (
                                                <div key={flag.id} className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${theme.bg}`} />
                                                    <span className="text-xs font-medium text-slate-500">{flag.name}</span>
                                                    <span className="text-xs font-bold text-slate-400">{monthCount}次</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Add Flag Modal */}
            {isFlagModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setIsFlagModalOpen(false)}>
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-6">新增 Flag</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-500 mb-1 block">目标名称</label>
                                <input type="text" value={newFlag.name} onChange={e => setNewFlag({ ...newFlag, name: e.target.value })}
                                    placeholder="例如：跑步" className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-slate-500 mb-1 block">目标次数</label>
                                    <input type="number" value={newFlag.total} onChange={e => setNewFlag({ ...newFlag, total: Number(e.target.value) })}
                                        min={1} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-500 mb-1 block">单位</label>
                                    <input type="text" value={newFlag.unit} onChange={e => setNewFlag({ ...newFlag, unit: e.target.value })}
                                        placeholder="次" className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                            </div>

                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setIsFlagModalOpen(false)}
                                className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all">取消</button>
                            <button onClick={handleAddFlag}
                                className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">创建</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast notification */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-rose-600 text-white text-sm font-bold rounded-2xl shadow-2xl animate-[fadeIn_0.2s_ease-out]">
                    {toast}
                </div>
            )}
        </div>
    );
}
