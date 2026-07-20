import { useState, useRef, useEffect } from 'react';
import { LogOut, Globe } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';

interface UserMenuProps {
    user: User;
    onSignOut: () => void;
}

export default function UserMenu({ user, onSignOut }: UserMenuProps) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { t, i18n } = useTranslation();

    // Close menu on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const avatarUrl = user.user_metadata?.avatar_url;
    const displayName = user.user_metadata?.user_name || user.email || 'User';

    const toggleLanguage = () => {
        const nextLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
        i18n.changeLanguage(nextLang);
    };

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow-sm hover:ring-slate-200 transition-all cursor-pointer"
            >
                {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                        {displayName[0].toUpperCase()}
                    </div>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-50">
                        <p className="text-sm font-bold text-slate-700 truncate">{displayName}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>

                    <button
                        onClick={toggleLanguage}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                        <span className="flex items-center gap-2">
                            <Globe size={16} className="text-slate-400" />
                            {i18n.language.startsWith('zh') ? 'English' : '简体中文'}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                            {i18n.language.startsWith('zh') ? 'EN' : '中文'}
                        </span>
                    </button>

                    <div className="my-1 border-t border-slate-50" />

                    <button
                        onClick={() => { setOpen(false); onSignOut(); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50 hover:text-rose-500 transition-all cursor-pointer"
                    >
                        <LogOut size={16} />
                        {t('userMenu.signOut')}
                    </button>
                </div>
            )}
        </div>
    );
}
