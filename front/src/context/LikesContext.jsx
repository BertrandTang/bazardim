import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const LikesContext = createContext(null);

export function LikesProvider({ children }) {
    const { user } = useAuth();

    const [likesByUser, setLikesByUser] = useState(() => {
        try {
            const raw = localStorage.getItem('likesByUser');
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('likesByUser', JSON.stringify(likesByUser));
        } catch {
        }
    }, [likesByUser]);

    const userKey = String(user?.user_id ?? 'guest');

    const likedIds = useMemo(
        () => (Array.isArray(likesByUser[userKey]) ? likesByUser[userKey] : []).map((id) => String(id)),
        [likesByUser, userKey]
    );

    const isLiked = (id) => likedIds.includes(String(id));

    const toggleLike = (productOrId) => {
        const id = String(productOrId?.id ?? productOrId ?? '');
        if (!id) return;

        setLikesByUser((prev) => {
            const current = Array.isArray(prev[userKey]) ? prev[userKey].map((value) => String(value)) : [];
            const exists = current.includes(id);
            const nextUserLikes = exists
                ? current.filter((value) => value !== id)
                : [...current, id];

            return {
                ...prev,
                [userKey]: nextUserLikes,
            };
        });
    };

    const value = { likedIds, isLiked, toggleLike };

    return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
}

export function useLikes() {
    const ctx = useContext(LikesContext);
    if (!ctx) throw new Error('useLikes must be used within a LikesProvider');
    return ctx;
}
