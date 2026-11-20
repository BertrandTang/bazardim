import Footer from '../Footer/Footer.jsx';
import NavBar from '../NavBar/NavBar.jsx';
import './Layout.css';

/** Structure commune à toutes les pages : barre de navigation, contenu de la page, pied de page. */
export default function Layout({ children }) {
  return (
    <div className="layout">
      <NavBar />
      <main className="layout-main">{children}</main>
      <Footer />
    </div>
  );
}
