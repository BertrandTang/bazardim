import NavBar from '../NavBar/NavBar.jsx';
import Footer from '../Footer/Footer.jsx';
import './Layout.css';

export default function Layout({ children }) {
    return (
        <div className="layout">
            <NavBar />
            <main className="layout-main">
                {children}
            </main>
            <Footer />
        </div>
    );
}
