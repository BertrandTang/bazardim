import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Avatar, Stack } from '@mui/material';
import { useAuth } from '../../context/AuthContext.jsx';
import figuresData from '../../data/figures.json';
import ProductCardOwner from '../../components/ProductCard/ProductCardOwner.jsx';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import { useLikes } from '../../context/LikesContext.jsx';
import { addDeletedProductId, getAllProducts, subscribeToProductStorage } from '../../utils/productStorage.js';
import './Profile.css';

const sections = [
    { id: 'profile', label: 'Profil' },
    { id: 'products', label: 'Mes produits' },
    { id: 'likes', label: 'Mes likes' },
];

export default function Profile() {
    const navigate = useNavigate();
    const { user, updateProfile, logout } = useAuth();
    const { likedIds } = useLikes();
    const [activeSection, setActiveSection] = useState('profile');
    const [productsVersion, setProductsVersion] = useState(0);
    const [editValues, setEditValues] = useState({
        email: user?.email || '',
        mdp: user?.mdp || '',
        username: user?.username || '',
        profile_img: user?.profile_img || '',
    });

    useEffect(() => {
        return subscribeToProductStorage(() => {
            setProductsVersion((prev) => prev + 1);
        });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        updateProfile(editValues);
    };

    const handleDeleteProduct = (product) => {
        const productId = String(product?.id ?? product?.product_id ?? '');
        if (!productId) return;
        const confirmed = window.confirm('Voulez-vous vraiment supprimer ce post ?');
        if (!confirmed) return;
        addDeletedProductId(productId);
    };

    const availableProducts = useMemo(
        () => getAllProducts(figuresData.figures || []),
        [productsVersion]
    );

    const ownedProducts = useMemo(() => {
        return availableProducts.filter((product) => String(product.owner_user_id ?? product.user_id) === String(user?.user_id));
    }, [availableProducts, user?.user_id]);

    const likedProducts = useMemo(() => {
        const likedSet = new Set(likedIds.map((id) => String(id)));
        return availableProducts.filter((product) => likedSet.has(String(product.id ?? product.product_id)));
    }, [likedIds, availableProducts]);

    if (!user) return null; // should never happen because route is protected

    return (
        <Box className="profile-page">
            <Box className="profile-sidebar">
                <Stack spacing={1}>
                    {sections.map((s) => (
                        <Button
                            key={s.id}
                            variant={activeSection === s.id ? 'contained' : 'text'}
                            onClick={() => setActiveSection(s.id)}
                        >
                            {s.label}
                        </Button>
                    ))}
                    <Button color="error" onClick={logout}>
                        Déconnexion
                    </Button>
                </Stack>
            </Box>
            <Box className="profile-content">
                {activeSection === 'products' && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Mes produits</Typography>
                        <Button
                            className="profile-add-product"
                            variant="contained"
                            onClick={() => navigate('/vendre')}
                        >
                            Ajouter un produit en vente
                        </Button>
                        <Stack spacing={2}>
                            {ownedProducts.map(product => (
                                <ProductCardOwner
                                    key={product.id}
                                    product={product}
                                    onEdit={() => navigate(`/product/${product.id ?? product.product_id ?? ''}?edit=1`)}
                                    onDelete={() => handleDeleteProduct(product)}
                                />
                            ))}
                        </Stack>
                    </Box>
                )}
                {activeSection === 'likes' && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Mes likes</Typography>
                        {likedProducts.length === 0 ? (
                            <Box className="profile-likes-empty">Vous n'avez aucun like pour le moment.</Box>
                        ) : (
                            <Box className="profile-likes-grid">
                                {likedProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </Box>
                        )}
                    </Box>
                )}
                {activeSection === 'profile' && (
                    <Box sx={{ maxWidth: 500 }}>
                        <Typography variant="h6" gutterBottom>
                            Profil
                        </Typography>
                        <Stack spacing={2}>
                            <Avatar
                                src={editValues.profile_img}
                                sx={{ width: 80, height: 80 }}
                            />
                            <TextField
                                label="Username"
                                name="username"
                                fullWidth
                                value={editValues.username}
                                onChange={handleChange}
                            />
                            <TextField
                                label="Email"
                                name="email"
                                type="email"
                                fullWidth
                                value={editValues.email}
                                onChange={handleChange}
                            />
                            <TextField
                                label="Mot de passe"
                                name="mdp"
                                type="password"
                                fullWidth
                                value={editValues.mdp}
                                onChange={handleChange}
                            />
                            <TextField
                                label="Image URL"
                                name="profile_img"
                                fullWidth
                                value={editValues.profile_img}
                                onChange={handleChange}
                            />
                            <Button variant="contained" onClick={handleSave}>
                                Enregistrer
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
