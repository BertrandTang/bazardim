import { Link } from 'react-router-dom';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import { LEGAL_INFORMATION } from '../../data/legalInformation.js';
import './Legal.css';

/**
 * Page « Mentions légales » : qui édite et qui héberge le site.
 * Obligatoire pour tout site en ligne (loi pour la confiance dans l'économie numérique, LCEN, article 6).
 * Les informations viennent de data/legalInformation.js.
 */
export default function LegalNotice() {
  return (
    <article className="legal-page">
      <PageMetadata title="Mentions légales" description="Mentions légales du site Bazardim : éditeur et hébergeur." />
      <h1>Mentions légales</h1>
      <p className="legal-update">Dernière mise à jour : {LEGAL_INFORMATION.lastUpdate}</p>

      <h2>Éditeur du site</h2>
      <p>
        {LEGAL_INFORMATION.publisherName}
        <br />
        {LEGAL_INFORMATION.publisherStatus}
        <br />
        {LEGAL_INFORMATION.publisherAddress}
        <br />
        Contact : {LEGAL_INFORMATION.contactEmail}
      </p>

      <h2>Directeur de la publication</h2>
      <p>{LEGAL_INFORMATION.publicationDirector}</p>

      <h2>Hébergeur</h2>
      <p>
        {LEGAL_INFORMATION.hostName}
        <br />
        {LEGAL_INFORMATION.hostAddress}
        <br />
        {LEGAL_INFORMATION.hostPhone}
      </p>

      <h2>Paiement</h2>
      <p>
        Les paiements sont traités par Stripe Payments Europe, Ltd. (Dublin, Irlande). Les données de carte bancaire
        sont saisies sur la page sécurisée de Stripe : elles ne passent jamais par les serveurs de Bazardim.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Le nom Bazardim, son logo et la présentation du site sont protégés. Les photos et descriptions des annonces
        appartiennent aux utilisateurs qui les publient ; ils garantissent en avoir le droit. Les noms de licences et de
        personnages cités (One Piece, Dragon Ball…) appartiennent à leurs ayants droit.
      </p>

      <h2>Données personnelles</h2>
      <p>
        L’utilisation de vos données est expliquée dans la{' '}
        <Link to="/confidentialite">politique de confidentialité</Link>.
      </p>
    </article>
  );
}
