import { useState, useRef, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface UserMenuProps {
    user: User;
    onSignOut: () => void;
}

export default function UserMenu({ user, onSignOut }: UserMenuProps) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow-sm hover:ring-slate-200 transition-all"
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-50">
                        <p className="text-sm font-bold text-slate-700 truncate">{displayName}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button
                        onClick={() => { setOpen(false); onSignOut(); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50 hover:text-rose-500 transition-all"
                    >
                        <LogOut size={16} />
                        退出登录
                    </button>
                </div>
            )}
        </div>
    );
}
