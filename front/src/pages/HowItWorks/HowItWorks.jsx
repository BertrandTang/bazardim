import { Link } from 'react-router-dom';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import { buildProductTitle } from '../../utils/productTitle.js';
import { SERVICE_FEE_DESCRIPTION } from '../../utils/serviceFee.js';
import './HowItWorks.css';

// Exemples de titres, calculés avec la même fonction que l'API : le tutoriel reste toujours juste.
const TITLE_EXAMPLES = [
  { category: 'FIGURINE', character_name: 'Roronoa Zoro', version: 'Wano', manufacturer: 'Banpresto' },
  { category: 'FIGURINE ARTICULÉE', character_name: 'Monkey D. Luffy', version: 'Gear 5' },
  { category: 'STATUE', character_name: 'Sephiroth', manufacturer: 'Square Enix' },
];

/**
 * Page « Comment ça marche ? » : un petit tutoriel pour vendre et acheter sur Bazardim,
 * et les règles qui gardent les fiches produits claires pour tout le monde
 * (titre créé automatiquement, licences vérifiées).
 */
export default function HowItWorks() {
  return (
    <article className="how-page">
      <PageMetadata
        title="Comment ça marche ?"
        description="Vendre et acheter des figurines d’occasion sur Bazardim, étape par étape : fiche produit, titre automatique, paiement sécurisé, expédition."
      />
      <h1>Comment ça marche ?</h1>
      <p className="how-intro">
        Bazardim met en relation des collectionneurs qui vendent et achètent des figurines, figurines articulées et
        statues d’occasion. Chaque annonce est une <strong>pièce unique</strong> : une fois vendue, elle disparaît du
        catalogue.
      </p>

      <h2>Vendre une figurine</h2>
      <ol className="how-steps">
        <li>
          <h3>Crée ton compte</h3>
          <p>
            L’<Link to="/signup">inscription</Link> est gratuite : un pseudo, une adresse e-mail et un mot de passe
            suffisent.
          </p>
        </li>
        <li>
          <h3>Remplis la fiche de ta figurine</h3>
          <p>
            Clique sur <strong>Vendre</strong> puis ajoute une photo (obligatoire) et décris ta figurine : son type, le
            personnage, l’édition, le fabricant, la licence, son état, celui de la boîte et ton prix. Plus la fiche est
            complète, plus les acheteurs ont confiance.
          </p>
        </li>
        <li>
          <h3>Le titre se crée tout seul</h3>
          <p>
            Tu ne choisis pas le titre de ton annonce : Bazardim le construit à partir de ta fiche, sous la forme{' '}
            <strong>Type – Personnage (Édition Ver.)</strong>. S’il n’y a pas d’édition, c’est le fabricant qui est
            indiqué entre parenthèses. Un aperçu s’affiche pendant que tu remplis la fiche.
          </p>
          <ul className="how-examples">
            {TITLE_EXAMPLES.map((example) => (
              <li key={example.character_name}>{buildProductTitle(example)}</li>
            ))}
          </ul>
        </li>
        <li>
          <h3>Choisis la licence dans la liste</h3>
          <p>
            Choisis la licence (One Piece, Naruto…) parmi celles proposées : Bazardim reconnaît aussi les autres
            écritures et les noms courants (« DBZ » pour Dragon Ball Z). Une licence encore inconnue est vérifiée par
            notre équipe avant d’apparaître dans le menu <strong>Licences</strong>.
          </p>
        </li>
        <li>
          <h3>Vends et expédie</h3>
          <p>
            Quand ta figurine est payée, elle passe en <strong>Vendu</strong>. Dans ton profil (onglet{' '}
            <strong>Mes produits</strong>), tu vois l’acheteur et son adresse de livraison. Expédie le colis dans les 5
            jours ouvrés, puis clique sur <strong>Marquer comme expédié</strong> : l’acheteur est informé.
          </p>
        </li>
      </ol>

      <aside className="how-why" aria-labelledby="how-why-title">
        <h2 id="how-why-title">Pourquoi le titre est-il automatique ?</h2>
        <p>Pour que toutes les fiches produits soient claires et limpides pour tout le monde :</p>
        <ul>
          <li>
            <strong>Des annonces faciles à comparer</strong> : toutes les fiches se lisent de la même façon, d’un coup
            d’œil.
          </li>
          <li>
            <strong>Une recherche efficace</strong> : le personnage et l’édition sont toujours au même endroit, sans
            faute de frappe ni majuscules en trop.
          </li>
          <li>
            <strong>Pas de titres trompeurs</strong> : pas de « WOW RARE !!! », le titre décrit exactement la figurine.
          </li>
        </ul>
        <p>
          « Ver. » (pour « version ») est l’usage des figurines japonaises. La licence n’est pas répétée dans le titre :
          elle est déjà affichée sur chaque annonce. Ta description, elle, reste libre pour tous les détails.
        </p>
      </aside>

      <h2>Acheter une figurine</h2>
      <ol className="how-steps">
        <li>
          <h3>Trouve ta pièce</h3>
          <p>
            Cherche par nom, ou parcours les <strong>catégories</strong> et les <strong>licences</strong>. Clique sur le
            cœur pour garder une annonce dans tes favoris.
          </p>
        </li>
        <li>
          <h3>Pose tes questions au vendeur</h3>
          <p>Depuis la page d’une annonce, envoie un message au vendeur : il le reçoit dans sa messagerie.</p>
        </li>
        <li>
          <h3>Paie en toute sécurité</h3>
          <p>
            Ajoute les figurines à ton panier, choisis ton adresse de livraison et paie par carte sur la page sécurisée
            de notre partenaire Stripe. Le total comprend le prix des figurines et les frais de service de Bazardim (
            {SERVICE_FEE_DESCRIPTION}), affichés avant le paiement.
          </p>
        </li>
        <li>
          <h3>Suis ton colis</h3>
          <p>
            Dans ton profil (onglet <strong>Mes commandes</strong>), chaque figurine passe de « En préparation » à «
            Expédié le … » dès que le vendeur l’a envoyée.
          </p>
        </li>
      </ol>

      <p className="how-terms">
        Toutes les règles sont détaillées dans les <Link to="/conditions-generales">conditions générales</Link>.
      </p>

      <div className="how-actions">
        <Link to="/vendre" className="how-action-primary">
          Mettre une figurine en vente
        </Link>
        <Link to="/" className="how-action-secondary">
          Voir les figurines
        </Link>
      </div>
    </article>
  );
}
