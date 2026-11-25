import { Link } from 'react-router-dom';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import { LEGAL_INFORMATION } from '../../data/legalInformation.js';
import './Legal.css';

// Données collectées : pour chaque usage, quelles données, pourquoi et combien de temps.
// La « base légale » est la raison qui autorise le traitement selon le RGPD (article 6).
const DATA_PROCESSING = [
  {
    purpose: 'Créer et gérer votre compte',
    data: 'Pseudo, adresse e-mail, mot de passe (enregistré chiffré, jamais en clair), photo de profil',
    legalBasis: 'Exécution du contrat (conditions d’utilisation)',
    retention: 'Jusqu’à la suppression de votre compte',
  },
  {
    purpose: 'Publier des annonces',
    data: 'Photos, titre, description et caractéristiques des figurines',
    legalBasis: 'Exécution du contrat',
    retention: 'Jusqu’à la suppression de l’annonce ou du compte',
  },
  {
    purpose: 'Échanger avec les autres utilisateurs',
    data: 'Contenu des messages, expéditeur, destinataire, date',
    legalBasis: 'Exécution du contrat',
    retention: 'Jusqu’à la suppression du compte de l’expéditeur ou du destinataire',
  },
  {
    purpose: 'Passer et suivre une commande',
    data: 'Annonces achetées, prix, nom et prénom du destinataire, numéro de téléphone, adresse de livraison, dates de paiement et d’expédition',
    legalBasis: 'Exécution du contrat, puis obligation légale (comptabilité)',
    retention:
      '10 ans (obligation comptable, article L123-22 du Code de commerce). Si vous supprimez votre compte, la commande est conservée mais n’est plus reliée à vous.',
  },
];

/**
 * Page « Politique de confidentialité et traitement des données à caractère personnel » (RGPD).
 * Elle explique quelles données sont collectées, pourquoi, combien de temps, avec qui elles sont
 * partagées, et comment l'utilisateur exerce ses droits.
 */
export default function PrivacyPolicy() {
  return (
    <article className="legal-page">
      <PageMetadata
        title="Politique de confidentialité"
        description="Comment Bazardim collecte, utilise et protège vos données personnelles, et comment exercer vos droits."
      />
      <h1>Politique de confidentialité</h1>
      <p className="legal-update">Dernière mise à jour : {LEGAL_INFORMATION.lastUpdate}</p>

      <p>
        Bazardim est une marketplace de figurines entre collectionneurs. Cette page explique quelles données
        personnelles nous collectons, pourquoi, et comment vous gardez la main dessus, conformément au Règlement général
        sur la protection des données (RGPD) et à la loi Informatique et Libertés.
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        {LEGAL_INFORMATION.publisherName}, {LEGAL_INFORMATION.publisherAddress}. Contact :{' '}
        {LEGAL_INFORMATION.contactEmail}.
      </p>

      <h2>Données collectées et utilisation</h2>
      <p>Nous ne collectons que les données nécessaires au fonctionnement du site. Elles ne sont jamais revendues.</p>
      <div className="legal-table-wrapper">
        <table className="legal-table">
          <thead>
            <tr>
              <th scope="col">Pourquoi</th>
              <th scope="col">Quelles données</th>
              <th scope="col">Base légale</th>
              <th scope="col">Durée de conservation</th>
            </tr>
          </thead>
          <tbody>
            {DATA_PROCESSING.map((processing) => (
              <tr key={processing.purpose}>
                <th scope="row">{processing.purpose}</th>
                <td>{processing.data}</td>
                <td>{processing.legalBasis}</td>
                <td>{processing.retention}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Le profil public d’un vendeur affiche uniquement son pseudo, sa photo et ses annonces : jamais son adresse
        e-mail. Une fois l’annonce payée, le pseudo de l’acheteur, ainsi que le nom, le téléphone et l’adresse du
        destinataire, sont communiqués au vendeur, et à lui seul, pour qu’il puisse expédier l’objet. Le téléphone sert
        uniquement au transporteur, en cas de problème de livraison.
      </p>

      <h2>Destinataires et services tiers</h2>
      <ul>
        <li>
          <strong>Stripe</strong> (paiement) : vous saisissez votre carte bancaire directement sur la page sécurisée de
          Stripe. Bazardim ne voit ni ne conserve jamais vos données de carte. Stripe peut transférer certaines données
          aux États-Unis, encadrées par les clauses contractuelles types de la Commission européenne.
        </li>
        <li>
          <strong>API Adresse</strong> (service public de l’État, data.gouv.fr) : quand vous tapez votre adresse de
          livraison dans le panier, le texte saisi lui est envoyé pour proposer des adresses existantes.
        </li>
        <li>
          <strong>Hébergeur</strong> : {LEGAL_INFORMATION.hostName}, qui stocke les données du site.
        </li>
      </ul>

      <h2>Cookies et stockage dans le navigateur</h2>
      <p>Bazardim n’utilise aucun cookie publicitaire ni de suivi. Seuls des éléments indispensables sont déposés :</p>
      <ul>
        <li>
          un <strong>cookie de connexion</strong> (<code>bazardim_token</code>), qui vous garde connecté pendant 7
          jours. Il est illisible par les scripts de la page (cookie « httpOnly ») ;
        </li>
        <li>
          le <strong>contenu de votre panier</strong> et l’<strong>adresse de livraison choisie</strong>, gardés dans
          votre navigateur (stockage local) pour les retrouver à votre prochaine visite.
        </li>
      </ul>
      <p>
        Ces éléments sont strictement nécessaires au service que vous demandez : ils ne nécessitent pas votre
        consentement (recommandations de la CNIL), c’est pourquoi aucune bannière de cookies n’est affichée.
      </p>

      <h2>Sécurité</h2>
      <p>
        Les mots de passe sont chiffrés avec l’algorithme bcrypt, les échanges avec le site sont chiffrés (HTTPS) et
        l’accès aux données est réservé à leur propriétaire : seul l’auteur d’une annonce peut la modifier, seuls
        l’expéditeur et le destinataire d’un message peuvent le lire.
      </p>

      <h2>Vos droits</h2>
      <p>Vous disposez à tout moment des droits suivants sur vos données :</p>
      <ul>
        <li>
          <strong>accès et rectification</strong> : vos informations sont visibles et modifiables dans{' '}
          <Link to="/profile">votre profil</Link> ;
        </li>
        <li>
          <strong>effacement</strong> : le bouton « Supprimer mon compte » de votre profil supprime définitivement votre
          compte, vos annonces, vos favoris et vos messages ;
        </li>
        <li>
          <strong>portabilité, limitation et opposition</strong> : écrivez-nous à {LEGAL_INFORMATION.contactEmail}.
        </li>
      </ul>
      <p>
        Nous répondons dans un délai d’un mois. Si vous estimez que vos droits ne sont pas respectés, vous pouvez
        adresser une réclamation à la CNIL (
        <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer">
          www.cnil.fr
        </a>
        ).
      </p>
    </article>
  );
}
