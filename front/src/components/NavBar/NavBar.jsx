// On renomme LINK en RouterLink pour éviter les conflits avec le composant du même nom dans MUI.
import { Link as RouterLink } from "react-router-dom";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import SearchIcon from "@mui/icons-material/Search";
import "./NavBar.css";
import { useCart } from "../../context/CartContext.jsx";

export default function NavBar() {
    const { count } = useCart();

    return (
        <nav className="navbar-container">
            <div className="navbar-left">
                <RouterLink to="/" className="logo-link">
                    <img src="/icons/bazardim_logo.ico" alt="Logo" className="navbar-logo" />
                </RouterLink>
                <div className="navbar-search">
                    <SearchIcon />
                    <input placeholder="SEARCH サーチ" />
                </div>
            </div>
            <div className="navbar-middle">
                <RouterLink to="/">ACCUEIL</RouterLink>
                <RouterLink to="/categories">CATEGORIES</RouterLink>
                <RouterLink to="/licences">LICENCES</RouterLink>
            </div>
            <div className="navbar-right">
                <div className="navbar-auth-block">
                    <div className="navbar-auth">
                        <RouterLink to="/signup">INSCRIPTION</RouterLink>
                        <RouterLink to="/auth">CONNEXION</RouterLink>
                    </div>
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
