import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        }).catch((err) => {
            console.warn('Failed to get session:', err);
            setLoading(false);
        });

        // Fallback: if getSession hangs for more than 3s, stop loading
        const timeout = setTimeout(() => setLoading(false), 3000);

        // Listen to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event: string, session: Session | null) => {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const signInWithGitHub = useCallback(async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) console.error('GitHub Login error:', error.message);
    }, []);

    const signInWithGoogle = useCallback(async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
        if (error) console.error('Google Login error:', error.message);
    }, []);

    const signOut = useCallback(async () => {
        // Clear all user data from localStorage to prevent data leaking to next user
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key === 'annual-flags' ||
                key === 'todo-flag-memo' ||
                key.startsWith('annual-flags:') ||
                key.startsWith('todo-flag-memo:') ||
                key.startsWith('easynote-')
            )) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        await supabase.auth.signOut();
    }, []);

    return { user, loading, signInWithGitHub, signInWithGoogle, signOut };
}
