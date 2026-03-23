import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Flag } from '../types';
import { getColorTheme, getWeekId } from '../types';
import { Trophy } from 'lucide-react';

const WEEKLY_POPUP_KEY = 'easynote-weekly-popup-seen';

// Congratulatory messages pool
const CONGRATS_MESSAGES = [
    '辛苦啦，上周也好好努力了呢~',
    '太棒啦！又是充实的一周 ✨',
    '加油呀，新的一周继续冲！',
    '上周的你超厉害的 🎉',
    '休息好了吗？新一周也要开心哦~',
    '悄悄变强中… 上周做得好好！',
];

// Get all dates of the previous week (Mon-Sun)
function getLastWeekDates(): string[] {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    // How many days back to last Monday
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToLastMonday - 7);

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(lastMonday);
        d.setDate(lastMonday.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
}

interface WeeklySummaryPopupProps {
    flags: Flag[];
    onDismiss: () => void;
}

export default function WeeklySummaryPopup({ flags, onDismiss }: WeeklySummaryPopupProps) {
    const lastWeekDates = getLastWeekDates();
    const weekRange = `${lastWeekDates[0].slice(5)} ~ ${lastWeekDates[6].slice(5)}`;

    // Calculate per-flag stats for last week
    const flagStats = flags.map(flag => {
        const count = flag.history.filter(h => lastWeekDates.includes(h)).length;
        const theme = getColorTheme(flag.color);
        return { ...flag, weekCount: count, theme };
    }).filter(f => f.weekCount > 0);

    const totalCheckins = flagStats.reduce((sum, f) => sum + f.weekCount, 0);
    const activeDays = new Set(
        flags.flatMap(f => f.history.filter(h => lastWeekDates.includes(h)))
    ).size;

    // Random congrats message (stable per render)
    const [message] = useState(() =>
        CONGRATS_MESSAGES[Math.floor(Math.random() * CONGRATS_MESSAGES.length)]
    );

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[90] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={onDismiss}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

                {/* Card */}
                <motion.div
                    className="relative z-10 bg-white rounded-3xl p-6 sm:p-8 w-[calc(100%-2rem)] max-w-md shadow-2xl"
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.97 }}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                            <Trophy size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">上周回顾</h2>
                            <p className="text-xs font-medium text-slate-400">{weekRange}</p>
                        </div>
                    </div>

                    {/* Congrats message */}
                    <p className="text-sm text-slate-500 mt-3 mb-5 leading-relaxed">{message}</p>

                    {/* Stats overview */}
                    {totalCheckins > 0 ? (
                        <>
                            <div className="grid grid-cols-2 gap-3 mb-5">
                                <div className="bg-slate-50 rounded-2xl p-4 text-center">
                                    <p className="text-2xl font-black text-slate-800">{totalCheckins}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">次打卡</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4 text-center">
                                    <p className="text-2xl font-black text-slate-800">{activeDays}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">天活跃</p>
                                </div>
                            </div>

                            {/* Per-flag breakdown */}
                            <div className="space-y-2.5 mb-6">
                                {flagStats.map(f => (
                                    <div key={f.id} className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${f.theme.bg}`} />
                                        <span className="text-sm font-medium text-slate-600 flex-1">{f.name}</span>
                                        <span className="text-sm font-bold text-slate-800">{f.weekCount} 次</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="py-6 text-center mb-4">
                            <p className="text-sm text-slate-400">上周暂无打卡记录</p>
                            <p className="text-xs text-slate-300 mt-1">这周开始行动吧！</p>
                        </div>
                    )}

                    {/* Dismiss button */}
                    <button
                        onClick={onDismiss}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                    >
                        开启新一周
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// Hook to check whether the weekly popup should be shown
export function useWeeklyPopup(): [boolean, () => void] {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const currentWeek = getWeekId();
        const lastSeen = localStorage.getItem(WEEKLY_POPUP_KEY);
        if (lastSeen !== currentWeek) {
            setShow(true);
        }
    }, []);

    const dismiss = () => {
        setShow(false);
        localStorage.setItem(WEEKLY_POPUP_KEY, getWeekId());
    };

    return [show, dismiss];
}
