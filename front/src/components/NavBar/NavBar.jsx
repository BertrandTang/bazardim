// On renomme LINK en RouterLink pour éviter les conflits avec le composant du même nom dans MUI.
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import SearchIcon from "@mui/icons-material/Search";
import "./NavBar.css";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import figuresData from '../../data/figures.json';

export default function NavBar() {
    const { count } = useCart();
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');

    const searchablePaths = useMemo(
        () => ['/', '/licences', '/figurines', '/figurines-articulees', '/statue'],
        []
    );

    useEffect(() => {
        setSearchValue(searchParams.get('q') || '');
    }, [searchParams]);

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const nextParams = new URLSearchParams(location.search);
        const normalized = searchValue.trim();

        if (normalized) nextParams.set('q', normalized);
        else nextParams.delete('q');

        const targetPath = searchablePaths.includes(location.pathname) ? location.pathname : '/';
        const query = nextParams.toString();
        navigate(query ? `${targetPath}?${query}` : targetPath);
    };

    const licences = useMemo(
        () => Array.from(new Set((figuresData.figures || []).map((item) => item.licence_name).filter(Boolean))),
        []
    );

    return (
        <nav className="navbar-container">
            <div className="navbar-left">
                <RouterLink to="/" className="logo-link">
                    <img src="/icons/bazardim_logo.ico" alt="Logo" className="navbar-logo" />
                </RouterLink>
                <form className="navbar-search" onSubmit={handleSearchSubmit}>
                    <SearchIcon />
                    <input
                        placeholder="SEARCH サーチ"
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                    />
                </form>
            </div>
            <div className="navbar-middle">
                <RouterLink to="/">ACCUEIL</RouterLink>
                <div className="navbar-categories-dropdown">
                    <RouterLink to="/figurines" className="navbar-categories-trigger">CATEGORIES</RouterLink>
                    <div className="navbar-categories-menu">
                        <RouterLink to="/figurines">Figurines</RouterLink>
                        <RouterLink to="/figurines-articulees">Figurines articulées</RouterLink>
                        <RouterLink to="/statue">Statue</RouterLink>
                    </div>
                </div>
                <div className="navbar-licences-dropdown">
                    <RouterLink to="/licences" className="navbar-licences-trigger">LICENCES</RouterLink>
                    <div className="navbar-licences-menu">
                        {licences.map((licence) => (
                            <RouterLink
                                key={licence}
                                to={`/licences?name=${encodeURIComponent(licence)}`}
                            >
                                {licence}
                            </RouterLink>
                        ))}
                    </div>
                </div>
            </div>
            <div className="navbar-right">
                <div className="navbar-auth-block">
                    <div className="navbar-auth">
                        {!user && (
                            <>
                                <RouterLink to="/signup">INSCRIPTION</RouterLink>
                                <RouterLink to="/auth">CONNEXION</RouterLink>
                            </>
                        )}
                        {user && <RouterLink to="/profile">PROFIL</RouterLink>}
                    </div>
                    {user && (
                        <button className="logout-button" onClick={logout}>
                            Déconnexion
                        </button>
                    )}
                    <RouterLink to="/cart" className="navbar-cart">
                        <ShoppingCartOutlinedIcon />
                        {count > 0 && (
                            <span className="cart-badge">{count}</span>
                        )}
                    </RouterLink>
                </div>
            </div>
        </nav>
    );
}
