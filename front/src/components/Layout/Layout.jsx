import { Suspense } from 'react';
import Footer from '../Footer/Footer.jsx';
import NavBar from '../NavBar/NavBar.jsx';
import './Layout.css';

/** Structure commune à toutes les pages : barre de navigation, contenu de la page, pied de page. */
export default function Layout({ children }) {
  return (
    <div className="layout">
      {/* Accessibilité : permet aux utilisateurs du clavier de sauter directement au contenu. */}
      <a href="#main-content" className="skip-link">
        Aller au contenu
      </a>
      <NavBar />
      <main id="main-content" className="layout-main" tabIndex={-1}>
        {/* Les pages sont chargées à la demande (voir App.jsx) : pendant leur téléchargement,
            Suspense affiche ce message à la place. */}
        <Suspense fallback={<p className="layout-loading">Chargement…</p>}>{children}</Suspense>
      </main>
      <Footer />
    </div>
  );
}
