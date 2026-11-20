import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useProducts } from '../../context/ProductsContext.jsx';
import { CATEGORIES } from '../../data/categories.js';
import './NavBar.css';

// Pages qui affichent une liste de produits : la recherche reste sur ces pages,
// sinon (ex : depuis le panier) on renvoie vers l'accueil.
const PAGES_WITH_PRODUCT_LIST = ['/', '/licences', ...CATEGORIES.map((category) => category.path)];

export default function NavBar() {
  const { currentUser, logout } = useAuth();
  const { itemCount } = useCart();
  const { licences } = useProducts();
  const location = useLocation();
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

  return (
    <nav className="navbar-container" aria-label="Navigation principale">
      <div className="navbar-left">
        <Link to="/" className="logo-link">
          <img src="/icons/bazardim_logo.ico" alt="Bazardim - retour à l'accueil" className="navbar-logo" />
        </Link>
        <form className="navbar-search" role="search" onSubmit={handleSearchSubmit}>
          <SearchIcon aria-hidden="true" />
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
      </div>

      <div className="navbar-middle">
        <Link to="/">ACCUEIL</Link>

        <div className="navbar-dropdown">
          <Link to={CATEGORIES[0].path}>CATEGORIES</Link>
          <div className="navbar-dropdown-menu">
            {CATEGORIES.map((category) => (
              <Link key={category.value} to={category.path}>
                {category.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="navbar-dropdown">
          <Link to="/licences">LICENCES</Link>
          <div className="navbar-dropdown-menu">
            {licences.map((licence) => (
              <Link key={licence} to={`/licences?licence=${encodeURIComponent(licence)}`}>
                {licence}
              </Link>
            ))}
          </div>
        </div>

        <Link to="/vendre" className="navbar-sell-button">
          VENDRE
        </Link>
      </div>

      <div className="navbar-right">
        <div className="navbar-auth">
          {currentUser ? (
            <>
              <Link to="/profile">PROFIL</Link>
              <button type="button" className="logout-button" onClick={logout}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/signup">INSCRIPTION</Link>
              <Link to="/auth">CONNEXION</Link>
            </>
          )}
        </div>
        <Link to="/cart" className="navbar-cart" aria-label={`Panier (${itemCount} articles)`}>
          <ShoppingCartOutlinedIcon />
          {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </Link>
      </div>
    </nav>
  );
}
