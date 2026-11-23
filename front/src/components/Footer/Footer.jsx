import { Link } from 'react-router-dom';
import './Footer.css';

/** Pied de page : copyright et liens vers les pages légales (obligatoires sur un site en ligne). */
export default function Footer() {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} Bazardim. Tous droits réservés.</span>
      <nav className="footer-links" aria-label="Informations légales">
        <Link to="/mentions-legales">Mentions légales</Link>
        <Link to="/confidentialite">Politique de confidentialité</Link>
      </nav>
    </footer>
  );
}
