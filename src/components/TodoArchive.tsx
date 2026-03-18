import { ChevronLeft, Check, Trash2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { useDataSync } from '../hooks/useDataSync';
import UserMenu from './UserMenu';

interface TodoArchiveProps {
    user: User;
    onSignOut: () => void;
    onBack: () => void;
}

export default function TodoArchive({ user, onSignOut, onBack }: TodoArchiveProps) {
    const { memo, setMemo } = useDataSync(user.id);
    const completedTodos = memo.todos.filter(t => t.completed);

    const deleteTodo = (id: string) => {
        setMemo(prev => ({
            ...prev,
            todos: prev.todos.filter(t => t.id !== id)
        }));
    };

    const uncheckTodo = (id: string) => {
        setMemo(prev => ({
            ...prev,
            todos: prev.todos.map(t => t.id === id ? { ...t, completed: false } : t)
        }));
    };

    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

    return (
        <div className="min-h-screen font-[Inter,system-ui,sans-serif] text-slate-900 pb-24 sm:pb-20">
            {/* Background completely mirrors Dashboard.tsx */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-[#f8fafc]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000001a_1px,transparent_1px),linear-gradient(to_bottom,#0000001a_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_10%,rgba(249,115,22,0.2)_40%,rgba(248,250,252,1)_100%)]" />
            </div>

            <main className="max-w-[1200px] mx-auto px-4 pt-6 sm:px-8 sm:pt-12">
                <header className="mb-6 sm:mb-12 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <button onClick={onBack}
                                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/70 hover:bg-white border border-slate-200 shadow-sm transition-all"
                                title="返回主页">
                                <ChevronLeft size={20} className="text-slate-600" />
                            </button>
                            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-800">Archive</h1>
                        </div>
                        <p className="text-slate-500 font-medium mt-1 sm:mt-2 text-sm sm:text-base ml-13">{dateStr}</p>
                    </div>
                    <UserMenu user={user} onSignOut={onSignOut} />
                </header>

                <div className="max-w-3xl">
                    <section className="bg-white/70 backdrop-blur-xl border border-white shadow-xl rounded-2xl sm:rounded-3xl p-6 sm:p-10">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="w-2 h-6 bg-slate-900 rounded-full" />已完成待办
                            </h2>
                            <span className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                共 {completedTodos.length} 项
                            </span>
                        </div>

                        {completedTodos.length === 0 ? (
                            <div className="py-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
                                    <Check size={28} className="text-slate-300" />
                                </div>
                                <p className="text-slate-400 font-medium text-sm">干净得像张白纸，继续保持！</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {completedTodos.map(todo => (
                                    <div key={todo.id} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-slate-100 transition-all bg-slate-50/50">
                                        <button onClick={() => uncheckTodo(todo.id)}
                                            title="取消完成"
                                            className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0 transition-all hover:border-amber-400 focus:outline-none">
                                            <Check size={12} className="text-slate-300 group-hover:hidden" />
                                            <span className="hidden group-hover:block w-2.5 h-2.5 rounded-full bg-amber-400" />
                                        </button>
                                        <span className="text-sm flex-1 text-slate-500 strike-through line-through">{todo.text}</span>
                                        <button onClick={() => deleteTodo(todo.id)}
                                            title="彻底删除"
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all focus:outline-none">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
