import NavBar from '../NavBar/NavBar.jsx';
import Footer from '../Footer/Footer.jsx';
import './Layout.css';

export default function Layout({ children }) {
    return (
        <>
            <NavBar />
            <main className="layout-main">
                {children}
            </main>
            <Footer />
        </>
    );
}
