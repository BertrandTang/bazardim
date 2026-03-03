import { Link as RouterLink } from 'react-router-dom';
import './ProductCard.css';

export default function ProductCardOwner({ product, onEdit, onDelete }) {
    const title = product.title || product.product_title || 'TITRE';
    const username = product.username || product.product_username || product.owner_username || 'USERNAME';
    const price = product.price ?? product.product_price ?? 0;
    const rawImage = product.img || product.image || product.product_img || null;
    const image = (typeof rawImage === 'string' && rawImage.startsWith('/img/')) ? rawImage : '/img/img_1.jpg';
    return (
        <div className="product-card">
            <div className="product-user">
                <RouterLink to={`/user/${product.owner_user_id ?? product.user_id ?? ''}`} className="avatar-link">
                    <div className="avatar">U</div>
                </RouterLink>
                <div className="username">
                    <RouterLink to={`/user/${product.owner_user_id ?? product.user_id ?? ''}`}>{username}</RouterLink>
                </div>
            </div>
            <div className="product-image">
                <RouterLink to={`/product/${product.id ?? product.product_id ?? ''}`}>
                    <img src={image} alt={title} />
                </RouterLink>
            </div>
            <div className="product-title">
                <RouterLink to={`/product/${product.id ?? product.product_id ?? ''}`}>{title}</RouterLink>
            </div>
            <div className="product-desc">{product.description || product.product_description}</div>
            <div className="product-manufacturer">{product.manufacturer ? `Fabricant: ${product.manufacturer}` : 'Fabricant: N/C'}</div>
            <div className="product-bottom">
                <div className="product-price">{Number(price).toFixed(2)}€</div>
                <div className="product-actions">
                    <button className="product-edit" onClick={() => onEdit(product)}>Modifier</button>
                    <button className="product-delete" onClick={() => onDelete(product)}>Supprimer</button>
                </div>
            </div>
        </div>
    );
}
