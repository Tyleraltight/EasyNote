import { ChevronLeft, Flame, TrendingUp, Calendar } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { useDataSync } from '../hooks/useDataSync';
import { getColorTheme } from '../types';
import UserMenu from './UserMenu';

interface FlagSummaryProps {
    user: User;
    onSignOut: () => void;
    onBack: () => void;
}

// Calculate consecutive active days (streak) for a flag
function calcStreak(history: string[]): number {
    if (history.length === 0) return 0;
    const unique = [...new Set(history)].sort().reverse();
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < unique.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        const expectedStr = expected.toISOString().split('T')[0];
        if (unique[i] === expectedStr) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

export default function FlagSummary({ user, onSignOut, onBack }: FlagSummaryProps) {
    const { flags } = useDataSync(user.id);

    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

    // Total stats across all flags
    const totalCheckins = flags.reduce((sum, f) => sum + f.history.length, 0);
    const activeDays = new Set(flags.flatMap(f => f.history)).size;

    return (
        <div className="min-h-screen font-[Inter,system-ui,sans-serif] text-slate-900 pb-24 sm:pb-20">
            {/* Background - mirrors Dashboard */}
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
                            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-800">月度 Summary</h1>
                        </div>
                        <p className="text-slate-500 font-medium mt-1 sm:mt-2 text-sm sm:text-base ml-13">{dateStr}</p>
                    </div>
                    <UserMenu user={user} onSignOut={onSignOut} />
                </header>

                {/* Overview stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                    <div className="bg-white/70 backdrop-blur-xl border border-white shadow-sm rounded-2xl p-4 sm:p-6 text-center">
                        <p className="text-3xl sm:text-4xl font-black text-slate-800">{totalCheckins}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">总打卡次数</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-xl border border-white shadow-sm rounded-2xl p-4 sm:p-6 text-center">
                        <p className="text-3xl sm:text-4xl font-black text-slate-800">{activeDays}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">活跃天数</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-xl border border-white shadow-sm rounded-2xl p-4 sm:p-6 text-center col-span-2 sm:col-span-1">
                        <p className="text-3xl sm:text-4xl font-black text-slate-800">{flags.length}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">进行中目标</p>
                    </div>
                </div>

                {/* Per-flag breakdown */}
                <div className="space-y-4">
                    {flags.map(flag => {
                        const theme = getColorTheme(flag.color);
                        const streak = calcStreak(flag.history);
                        const pct = Math.min((flag.current / flag.total) * 100, 100);

                        return (
                            <div key={flag.id} className="bg-white/70 backdrop-blur-xl border border-white shadow-sm rounded-2xl sm:rounded-3xl p-5 sm:p-8">
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-1.5 h-8 rounded-full ${theme.bg}`} />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-slate-800">{flag.name}</h3>
                                        <p className="text-xs font-bold text-slate-400">{flag.current} / {flag.total} {flag.unit}</p>
                                    </div>
                                    {streak > 0 && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600">
                                            <Flame size={14} />
                                            <span className="text-xs font-bold">连续 {streak} 天</span>
                                        </div>
                                    )}
                                </div>

                                {/* Progress bar */}
                                <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden mb-5">
                                    <div className={`h-full transition-all duration-500 ease-out rounded-full ${pct >= 100 ? 'bg-amber-500' : theme.bg}`}
                                        style={{ width: `${pct}%` }} />
                                </div>

                                {/* Inline stats */}
                                <div className="flex gap-6">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <TrendingUp size={14} />
                                        <span className="text-xs font-medium">共 {flag.history.length} 次打卡</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Calendar size={14} />
                                        <span className="text-xs font-medium">{new Set(flag.history).size} 天有记录</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {flags.length === 0 && (
                        <div className="bg-white/70 backdrop-blur-xl border border-white shadow-sm rounded-2xl p-12 text-center">
                            <p className="text-slate-400 font-medium text-sm">暂无 Flag 数据</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
