import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Current version — bump this to show the card again on next deploy
const LOG_VERSION = '1.3.0';
const STORAGE_KEY = `easynote-update-seen-${LOG_VERSION}`;

// --- Utility ---
const cn = (...classes: (string | false | null | undefined)[]) =>
    classes.filter(Boolean).join(' ');

// --- Highlight Component ---
function Highlight({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={cn('font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md mx-0.5', className)}>
            {children}
        </span>
    );
}

// --- Card Stack ---
function CardStack({ items }: { items: Array<{ id: number; name: string; designation: string; content: React.ReactNode }> }) {
    return (
        <div className="relative h-72 w-80 md:w-[400px]">
            {items.map((card, index) => (
                <motion.div
                    key={card.id}
                    className="absolute h-full w-full rounded-3xl p-8 shadow-2xl shadow-black/[0.08] border border-neutral-100 bg-white flex flex-col justify-between"
                    initial={false}
                    animate={{
                        top: index * -10,
                        scale: 1 - index * 0.05,
                        zIndex: items.length - index,
                    }}
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">
                                Update Log
                            </span>
                        </div>
                        <div className="text-neutral-700 leading-relaxed text-sm space-y-3 font-sans">
                            {card.content}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-50 flex justify-between items-end">
                        <div>
                            <p className="text-neutral-900 font-bold text-base">{card.name}</p>
                            <p className="text-neutral-400 text-xs font-medium">{card.designation}</p>
                        </div>
                        <div className="text-[10px] text-neutral-300 font-mono">
                            V{LOG_VERSION}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

// --- Main Overlay ---
export default function UpdateLogCard() {
    const [visible, setVisible] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        // Show only if user hasn't seen this version yet
        const seen = localStorage.getItem(STORAGE_KEY);
        if (!seen) {
            setVisible(true);
        }
    }, []);

    const dismiss = () => {
        setVisible(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    };

    const cards = [
        {
            id: 0,
            name: t('updateLog.systemUpdate'),
            designation: 'Tyler',
            content: (
                <div className="space-y-3">
                    <p>{t('updateLog.log0.item1_1')}<Highlight>{t('updateLog.log0.item1_highlight')}</Highlight>{t('updateLog.log0.item1_2')}</p>
                    <p>{t('updateLog.log0.item2_1')}<Highlight>{t('updateLog.log0.item2_highlight')}</Highlight>{t('updateLog.log0.item2_2')}</p>
                    <p>{t('updateLog.log0.item3')}</p>
                </div>
            ),
        },
        {
            id: 1,
            name: t('updateLog.systemUpdate'),
            designation: 'Tyler',
            content: (
                <div className="space-y-3">
                    <p>{t('updateLog.log1.item1_1')}<Highlight>{t('updateLog.log1.item1_highlight')}</Highlight>{t('updateLog.log1.item1_2')}</p>
                    <p>{t('updateLog.log1.item2_1')}<Highlight>{t('updateLog.log1.item2_highlight')}</Highlight></p>
                    <p>{t('updateLog.log1.item3')}</p>
                </div>
            ),
        },
        {
            id: 2,
            name: t('updateLog.systemUpdate'),
            designation: 'Tyler',
            content: (
                <div className="space-y-3">
                    <p>{t('updateLog.log2.item1_1')}<Highlight>{t('updateLog.log2.item2_highlight')}</Highlight>{t('updateLog.log2.item1_2')}</p>
                    <p>{t('updateLog.log2.item2_1')}<Highlight>{t('updateLog.log2.item2_highlight')}</Highlight>{t('updateLog.log2.item2_2')}</p>
                    <p>{t('updateLog.log2.item3')}</p>
                </div>
            ),
        },
    ];

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={dismiss}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

                    {/* Card container — prevent click-through */}
                    <motion.div
                        className="relative z-10"
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                        onClick={e => e.stopPropagation()}
                    >
                        <CardStack items={cards} />
                    </motion.div>

                    {/* Background watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <span className="text-neutral-900 font-black text-8xl opacity-[0.03] italic">
                            LOG
                        </span>
                    </div>

                    {/* Dismiss hint */}
                    <motion.p
                        className="relative z-10 mt-8 text-xs text-white/60 font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        {t('updateLog.dismissHint')}
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
