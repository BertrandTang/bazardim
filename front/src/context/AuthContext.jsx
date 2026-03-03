import { createContext, useContext, useState, useEffect } from 'react';
import profilesData from '../data/profiles.json';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem('authUser');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        try {
            if (user) localStorage.setItem('authUser', JSON.stringify(user));
            else localStorage.removeItem('authUser');
        } catch {}
    }, [user]);

    function login(email, password) {
        const match = profilesData.profiles.find(
            (p) => p.email === email && p.mdp === password
        );
        if (match) {
            setUser({ ...match });
            return true;
        }
        return false;
    }

    function logout() {
        setUser(null);
    }

    function updateProfile(changes) {
        setUser((prev) => ({ ...prev, ...changes }));
    }

    const value = { user, login, logout, updateProfile };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}
