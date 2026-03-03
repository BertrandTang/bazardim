import { useState } from 'react';
import { Box, Button, TextField, Typography, Avatar, Stack } from '@mui/material';
import { useAuth } from '../../context/AuthContext.jsx';
import figuresData from '../../data/figures.json';
import ProductCardOwner from '../../components/ProductCard/ProductCardOwner.jsx';
import './Profile.css';

const sections = [
    { id: 'profile', label: 'Profil' },
    { id: 'products', label: 'Mes produits' },
    { id: 'likes', label: 'Mes likes' },
];

export default function Profile() {
    const { user, updateProfile, logout } = useAuth();
    const [activeSection, setActiveSection] = useState('profile');
    const [editValues, setEditValues] = useState({
        email: user?.email || '',
        mdp: user?.mdp || '',
        username: user?.username || '',
        profile_img: user?.profile_img || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        updateProfile(editValues);
    };

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
                        <Stack spacing={2}>
                            {figuresData.figures.filter(f => f.owner_user_id === user.user_id).map(product => (
                                <ProductCardOwner
                                    key={product.id}
                                    product={product}
                                    onEdit={() => alert('Fonction modifier à implémenter')}
                                    onDelete={() => alert('Fonction supprimer à implémenter')}
                                />
                            ))}
                        </Stack>
                    </Box>
                )}
                {activeSection === 'likes' && (
                    <Typography>Liste de mes likes (à implémenter)</Typography>
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
