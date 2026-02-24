// On renomme LINK en RouterLink pour éviter les conflits avec le composant du même nom dans MUI.
import { Link as RouterLink } from "react-router-dom";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import SearchIcon from "@mui/icons-material/Search";
import "./NavBar.css";

export default function NavBar() {
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
            </div>
            <div className="navbar-right">
                <div className="navbar-auth">
                    <RouterLink to="/auth?mode=signup">INSCRIPTION</RouterLink>
                    <RouterLink to="/auth?mode=login">CONNEXION</RouterLink>
                </div>
                <RouterLink to="/cart" className="navbar-cart">
                    <ShoppingCartOutlinedIcon />
                </RouterLink>
            </div>
        </nav>
    );
}
