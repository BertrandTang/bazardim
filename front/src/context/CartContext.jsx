import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem('cart');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try { localStorage.setItem('cart', JSON.stringify(items)); } catch { }
    }, [items]);

    const addItem = (product, qty = 1) => {
        setItems(prev => {
            const idx = prev.findIndex(item => item.id === product.id);
            if (idx >= 0) {
                const copy = [...prev];
                const current = copy[idx].quantity || 1;
                const next = current + qty;
                if (next <= 0) {
                    return copy.filter((_, i) => i !== idx);
                }
                copy[idx] = { ...copy[idx], quantity: next };
                return copy;
            }
            if (qty <= 0) return prev;
            return [...prev, { ...product, quantity: qty }];
        });
    };

    const changeQuantity = (id, delta) => {
        setItems(prev => {
            const idx = prev.findIndex(item => item.id === id);
            if (idx < 0) return prev;
            const copy = [...prev];
            const current = copy[idx].quantity || 1;
            const next = current + delta;
            if (next <= 0) {
                return copy.filter((_, i) => i !== idx);
            }
            copy[idx] = { ...copy[idx], quantity: next };
            return copy;
        });
    };

    const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
    const clear = () => setItems([]);

    const count = useMemo(() => items.reduce((n, it) => n + (it.quantity || 1), 0), [items]);
    const total = useMemo(() => items.reduce((sum, it) => sum + Number(it.price || 0) * (it.quantity || 1), 0), [items]);

    const value = { items, addItem, changeQuantity, removeItem, clear, count, total };
    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within a CartProvider');
    return ctx;
}
