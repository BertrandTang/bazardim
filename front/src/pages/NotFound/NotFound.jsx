import { Link } from 'react-router-dom';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import './NotFound.css';

/** Page affichée quand l'adresse ne correspond à aucune route (erreur 404). */
export default function NotFound() {
  return (
    <section className="not-found-page">
      <PageMetadata title="Page introuvable" noIndex />
      <p className="not-found-code" aria-hidden="true">
        404
      </p>
      <h1>Cette page n’existe pas</h1>
      <p>Le lien est peut-être erroné, ou l’annonce a été supprimée.</p>
      <Link to="/" className="not-found-link">
        Retour à l’accueil
      </Link>
    </section>
  );
}
