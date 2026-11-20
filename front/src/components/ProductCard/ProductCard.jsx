import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import './ProductCard.css';
import { useCart } from '../../context/CartContext.jsx';
import { useLikes } from '../../context/LikesContext.jsx';

export default function ProductCard({ product }) {
    const { addItem } = useCart();
    const { isLiked, toggleLike: toggleLikedProduct } = useLikes();
    const liked = isLiked(product.id ?? product.product_id);
    const [showAddedMessage, setShowAddedMessage] = useState(false);

    useEffect(() => {
        if (!showAddedMessage) return;
        const timeoutId = window.setTimeout(() => {
            setShowAddedMessage(false);
        }, 1500);
        return () => window.clearTimeout(timeoutId);
    }, [showAddedMessage]);

    const toggleLike = (event) => {
        event.stopPropagation();
        toggleLikedProduct(product.id ?? product.product_id);
    };
    const structuredTags = [
        product.category ? { label: product.category, type: 'category' } : null,
        product.licence_name ? { label: product.licence_name, type: 'licence' } : null,
        product.character_name ? { label: product.character_name, type: 'character' } : null,
        product.product_type ? { label: product.product_type, type: 'type' } : null,
        product.tags ? { label: product.tags.join(', '), type: 'tags' } : null,
        product.product_tags ? { label: product.product_tags.join(', '), type: 'tags' } : null,
    ].filter(Boolean);
    const seen = new Set();
    const tags = structuredTags.filter(t => {
        const key = String(t.label || '').toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    const title = product.title || product.product_title || 'TITRE';
    const username = product.username || product.product_username || product.owner_username || 'USERNAME';
    const price = product.price ?? product.product_price ?? 0;
    const rawImage = product.img || product.image || product.product_img || null;

    const imagePool = [
        '/img/img_1.jpg',
        '/img/img_2.jpg',
        '/img/img_3.jpg',
        '/img/img_4.jpg',
        '/img/img_5.jpg',
        '/img/img_6.jpg',
        '/img/img_7.jpg',
        '/img/img_8.jpg',
        '/img/img_9.jpg',
        '/img/img_10.jpg',
        '/img/img_11.jpg',
    ];

    const pickFromPool = (key) => {
        const k = String(key ?? '0');
        let hash = 0;
        for (let i = 0; i < k.length; i++) hash = (hash + k.charCodeAt(i)) >>> 0;
        return imagePool[hash % imagePool.length];
    };

    const image = (typeof rawImage === 'string' && rawImage.startsWith('/img/'))
        ? rawImage
        : pickFromPool(product.id || title);
    const ownerId = product.owner_user_id ?? product.product_user_id ?? product.user_id ?? '';
    const handleAddToCart = () => {
        addItem(product);
        setShowAddedMessage(false);
        window.requestAnimationFrame(() => setShowAddedMessage(true));
    };

    return (
        <div className="product-card">
            <div className="product-user">
                    <RouterLink to={`/user/${ownerId}`} className="avatar-link">
                        <div className="avatar">U</div>
                    </RouterLink>
                    <div className="username">
                        <RouterLink to={`/user/${ownerId}`}>{username}</RouterLink>
                    </div>
                </div>
            <div className="product-image">
                <RouterLink to={`/product/${product.id ?? product.product_id ?? ''}`}>
                    <img
                        src={image}
                        alt={title}
                    />
                </RouterLink>
                <button
                    type="button"
                    className={`fav-btn${liked ? ' active' : ''}`}
                    aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    aria-pressed={liked}
                    onClick={toggleLike}
                    title={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                    {liked ? '♥' : '♡'}
                </button>
            </div>
            <div className="product-title">
                <RouterLink to={`/product/${product.id ?? product.product_id ?? ''}`}>{title}</RouterLink>
            </div>
            <div className="product-tags">
                {tags.map((tag) => (
                    <span key={`${tag.type}:${tag.label}`} className={`product-tag ${tag.type}`}>
                        {tag.label}
                    </span>
                ))}
            </div>
            <div className="product-desc">{product.description || product.product_description}</div>
            <div className="product-manufacturer">{product.manufacturer ? `Fabricant: ${product.manufacturer}` : 'Fabricant: N/C'}</div>
            <div className="product-bottom">
                <div className="product-price">{Number(price).toFixed(2)}€</div>
                <div className="product-add-wrap">
                    {showAddedMessage ? <span className="product-added-toast">ajoute au panier</span> : null}
                    <button
                        className="product-add"
                        onClick={handleAddToCart}
                    >
                        AJOUTER
                    </button>
                </div>
            </div>
        </div>
    );
}
