import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import productsData from '../data/figures.json';
import '../components/ProductCard/ProductCard.css';

function mapProduct(product, index) {
    return {
        ...product,
        id: product.id,
        title: product.product_title,
        description: product.product_description,
        price: product.product_price,
        tags: product.product_tags,
        username: product.product_username,
        image: imagePool[index % imagePool.length],
    };
}

export default function Product() {
    const { id } = useParams();
    const products = useMemo(() => (productsData.products || []).map(mapProduct), []);
    const product = products.find((p) => String(p.id) === String(id));

    if (!product) {
        return (
            <Box sx={{ p: 4 }}>
                <h2>Produit introuvable</h2>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 24, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: 920, display: 'flex', gap: 4 }}>
                <Box sx={{ flex: '0 0 480px' }}>
                    <img className="product-detail-image" src={product.image} alt={product.title} />
                </Box>
                <Box sx={{ flex: '1 1 auto' }}>
                    <h1 style={{ marginTop: 0 }}>{product.title || 'TITRE'}</h1>
                    <div style={{ margin: '12px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(product.tags || []).map((t, i) => (
                            <span key={`${t}-${i}`} style={{ background: '#6d35ff', color: '#3f3d3d', padding: '6px 10px', borderRadius: 12, fontSize: 13 }}>{t}</span>
                        ))}
                    </div>
                    <p style={{ color: '#333', lineHeight: 1.6 }}>{product.description}</p>
                    <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#ff40d3' }}>{Number(product.price || 0).toFixed(2)}€</div>
                        <Button variant="contained">AJOUTER</Button>
                    </div>
                </Box>
            </Box>
        </Box>
    );
}
