import { createContext, useContext, useState, useEffect } from 'react';
import profilesData from '../data/profiles.json';

const AuthContext = createContext(null);

function normalizeAuthUser(rawUser) {
    if (!rawUser || typeof rawUser !== 'object') return null;

    const draft = {
        ...rawUser,
        user_id: rawUser.user_id ?? rawUser.id ?? '',
        username: rawUser.username ?? rawUser.name ?? '',
        email: rawUser.email ?? '',
        profile_img: rawUser.profile_img ?? rawUser.avatar ?? '',
    };

    const profiles = profilesData.profiles || [];

    const byUserId = draft.user_id
        ? profiles.find((p) => String(p.user_id) === String(draft.user_id))
        : null;
    const byEmail = draft.email
        ? profiles.find((p) => p.email === draft.email)
        : null;

    // Fallback when localStorage contains stale or partial auth object.
    const fromProfiles = byUserId || byEmail || null;

    if (!fromProfiles) {
        return draft;
    }

    return {
        ...fromProfiles,
        ...draft,
        user_id: fromProfiles.user_id,
    };
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem('authUser');
            return raw ? normalizeAuthUser(JSON.parse(raw)) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        // Normalize current in-memory state once in case Fast Refresh preserved stale values.
        setUser((prev) => normalizeAuthUser(prev));
    }, []);

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
            setUser(normalizeAuthUser({ ...match }));
            return true;
        }
        return false;
    }

    function logout() {
        setUser(null);
    }

    function updateProfile(changes) {
        setUser((prev) => normalizeAuthUser({ ...prev, ...changes, user_id: prev?.user_id ?? changes?.user_id }));
    }

    const value = { user, login, logout, updateProfile };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}
