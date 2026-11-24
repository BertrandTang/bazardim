import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useMessages } from '../../context/MessagesContext.jsx';
import { useProducts } from '../../context/ProductsContext.jsx';
import { CATEGORIES } from '../../data/categories.js';
import NavBarDropdown from './NavBarDropdown.jsx';
import { CartIcon, SearchIcon } from './NavBarIcons.jsx';
import './NavBar.css';

// Pages qui affichent une liste de produits : la recherche reste sur ces pages,
// sinon (ex : depuis le panier) on renvoie vers l'accueil.
const PAGES_WITH_PRODUCT_LIST = ['/', '/licences', ...CATEGORIES.map((category) => category.path)];

export default function NavBar() {
  const { currentUser, logout } = useAuth();
  const { cartProducts } = useCart();
  const itemCount = cartProducts.length;
  const { licences } = useProducts();
  const { unreadCount, refreshUnreadCount } = useMessages();
  const location = useLocation();

  // À chaque changement de page, on redemande le nombre de messages non lus
  // (un nouveau message a pu arriver entre-temps).
  useEffect(() => {
    refreshUnreadCount();
  }, [location.pathname, refreshUnreadCount]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Recherche actuelle, lue dans l'URL (ex : /?q=luffy donne "luffy").
  const currentSearch = searchParams.get('q') ?? '';

  function handleSearchSubmit(event) {
    // Empêche le navigateur de recharger la page à l'envoi du formulaire.
    event.preventDefault();

    // On lit la valeur saisie directement dans le formulaire au moment de l'envoi.
    const formData = new FormData(event.currentTarget);
    const searchText = formData.get('search').trim();

    // On garde les autres filtres de l'URL (ex : la licence) et on remplace la recherche.
    const nextParams = new URLSearchParams(location.search);
    if (searchText) {
      nextParams.set('q', searchText);
    } else {
      nextParams.delete('q');
    }

    const targetPath = PAGES_WITH_PRODUCT_LIST.includes(location.pathname) ? location.pathname : '/';
    const queryString = nextParams.toString();
    navigate(queryString ? `${targetPath}?${queryString}` : targetPath);
  }

  // Mise en page (voir NavBar.css) : une grille sur deux lignes.
  //   Ordinateur : [logo] [recherche]              [compte + panier]
  //                [logo] [liens de navigation .............. VENDRE]
  //   Téléphone : le logo et le compte en haut, puis la recherche, puis les liens.
  return (
    <nav className="navbar-container" aria-label="Navigation principale">
      <Link to="/" className="navbar-logo-link">
        <img src="/icons/bazardim_logo.ico" alt="Bazardim - retour à l'accueil" className="navbar-logo" />
      </Link>

      <form className="navbar-search" role="search" onSubmit={handleSearchSubmit}>
        <SearchIcon />
        {/* `key` force React à recréer le champ quand la recherche de l'URL change,
            pour qu'il affiche toujours la bonne valeur (ex : après un retour arrière). */}
        <input
          key={currentSearch}
          name="search"
          type="search"
          placeholder="SEARCH サーチ"
          aria-label="Rechercher un produit"
          defaultValue={currentSearch}
        />
      </form>

      <div className="navbar-account">
        {currentUser ? (
          <>
            {/* aria-label : un lecteur d'écran lit "Messages (2 non lus)" au lieu de "Messages 2". */}
            <Link
              to="/messages"
              className="navbar-messages"
              aria-label={unreadCount > 0 ? `Messages (${unreadCount} non lus)` : 'Messages'}
            >
              Messages
              {unreadCount > 0 && <span className="messages-badge">{unreadCount}</span>}
            </Link>
            <Link to="/profile">Profil</Link>
            <button type="button" className="logout-button" onClick={logout}>
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/auth">Connexion</Link>
            <Link to="/signup" className="navbar-signup">
              Inscription
            </Link>
          </>
        )}
        <Link to="/cart" className="navbar-cart" aria-label={`Panier (${itemCount} articles)`}>
          <CartIcon />
          {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </Link>
      </div>

      <div className="navbar-links">
        <Link to="/">ACCUEIL</Link>

        <NavBarDropdown label="CATEGORIES">
          {CATEGORIES.map((category) => (
            <Link key={category.value} to={category.path}>
              {category.label}
            </Link>
          ))}
        </NavBarDropdown>

        <NavBarDropdown label="LICENCES">
          <Link to="/licences">Toutes les licences</Link>
          {licences.map((licence) => (
            <Link key={licence} to={`/licences?licence=${encodeURIComponent(licence)}`}>
              {licence}
            </Link>
          ))}
        </NavBarDropdown>

        <Link to="/comment-ca-marche">COMMENT ÇA MARCHE ?</Link>

        <Link to="/vendre" className="navbar-sell-button">
          VENDRE
        </Link>
      </div>
    </nav>
  );
}
