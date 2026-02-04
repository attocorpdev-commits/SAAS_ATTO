import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('AuthProvider: Initializing...');

        // Check active sessions and sets the user
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                console.log('AuthProvider: Session check complete', session ? 'User logged in' : 'No user');
                setUser(session?.user ?? null);
                setLoading(false);
            })
            .catch((error) => {
                console.error('AuthProvider: Session check failed', error);
                setLoading(false);
            });

        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('AuthProvider: Auth state changed', _event);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    console.log('AuthProvider: Rendering, loading:', loading, 'user:', user ? 'present' : 'null');

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
