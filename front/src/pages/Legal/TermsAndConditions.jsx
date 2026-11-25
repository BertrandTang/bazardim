import { Link } from 'react-router-dom';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import { LEGAL_INFORMATION } from '../../data/legalInformation.js';
import { SERVICE_FEE_DESCRIPTION } from '../../utils/serviceFee.js';
import './Legal.css';

/**
 * Page « Conditions générales d'utilisation et de vente » (CGU / CGV).
 * Elle fixe les règles du site : rôle de Bazardim, annonces, prix et frais de service,
 * paiement, livraison, litiges. Le barème des frais vient de utils/serviceFee.js,
 * pour que la page affiche toujours le même montant que le panier.
 */
export default function TermsAndConditions() {
  return (
    <article className="legal-page">
      <PageMetadata
        title="Conditions générales"
        description="Conditions générales d’utilisation et de vente de Bazardim : annonces, frais de service, paiement, livraison et litiges."
      />
      <h1>Conditions générales d’utilisation et de vente</h1>
      <p className="legal-update">Dernière mise à jour : {LEGAL_INFORMATION.lastUpdate}</p>

      <p className="legal-notice">
        Bazardim est un projet réalisé dans le cadre d’une formation. Les paiements fonctionnent en{' '}
        <strong>mode test</strong> : aucune somme réelle n’est débitée et aucune vente réelle n’a lieu.
      </p>

      <h2>1. Objet</h2>
      <p>
        Bazardim est une plateforme qui met en relation des particuliers pour acheter et vendre des figurines, figurines
        articulées et statues de collection d’occasion. Ces conditions s’appliquent à toute personne qui utilise le site
        (conditions d’utilisation) et à tout achat (conditions de vente). En créant un compte ou en passant une
        commande, vous les acceptez.
      </p>

      <h2>2. Rôle de Bazardim</h2>
      <p>
        Bazardim est un <strong>intermédiaire</strong> : chaque vente est conclue directement entre le vendeur et
        l’acheteur. Bazardim ne vend pas les objets présentés et n’en est pas propriétaire. Bazardim fournit le site, le
        paiement sécurisé et la messagerie entre utilisateurs.
      </p>

      <h2>3. Compte</h2>
      <ul>
        <li>L’inscription est gratuite. Les informations du compte doivent être exactes.</li>
        <li>Le mot de passe est personnel : ne le communiquez à personne.</li>
        <li>
          Vous pouvez supprimer votre compte à tout moment depuis <Link to="/profile">votre profil</Link>.
        </li>
      </ul>

      <h2>4. Annonces</h2>
      <ul>
        <li>
          Le vendeur publie uniquement des objets qu’il possède, avec une description et des photos fidèles (état,
          présence de la boîte, défauts).
        </li>
        <li>Les contrefaçons et les objets illicites sont interdits.</li>
        <li>Chaque annonce correspond à une pièce unique : une fois vendue, elle ne peut plus être modifiée.</li>
        <li>Bazardim peut supprimer une annonce qui ne respecte pas ces règles.</li>
      </ul>

      <h2>5. Prix et frais de service</h2>
      <p>
        Le prix de chaque annonce est fixé librement par le vendeur, en euros, toutes taxes comprises. Pour chaque
        commande, l’acheteur paie en plus des <strong>frais de service</strong> à Bazardim : {SERVICE_FEE_DESCRIPTION}.
        Ils financent le fonctionnement de la plateforme et le paiement sécurisé. Le détail (articles, frais de service,
        total) est affiché dans le panier <strong>avant</strong> le paiement.
      </p>

      <h2>6. Commande et paiement</h2>
      <p>
        L’acheteur indique dans le panier le nom, le téléphone et l’adresse du destinataire, puis paie par carte
        bancaire sur la page sécurisée de notre prestataire de paiement, Stripe : Bazardim ne voit ni ne conserve les
        données de carte. La commande est confirmée dès que le paiement est accepté. Les annonces achetées sont alors
        marquées « Vendu » et retirées de la vente. L’acheteur retrouve sa commande dans l’onglet « Mes commandes » de
        son profil.
      </p>

      <h2>7. Livraison</h2>
      <p>
        Après le paiement, le vendeur voit le nom, le téléphone et l’adresse du destinataire dans son profil (onglet «
        Mes produits »). Il s’engage à expédier l’objet, soigneusement emballé, dans les 5 jours ouvrés, puis à
        l’indiquer sur le site avec le bouton « Marquer comme expédié ». L’acheteur suit l’envoi dans l’onglet « Mes
        commandes » (« En préparation », puis « Expédié le … »). L’acheteur et le vendeur peuvent échanger à tout moment
        grâce à la messagerie du site.
      </p>

      <h2>8. Rétractation, réclamations et litiges</h2>
      <ul>
        <li>
          Les ventes ont lieu <strong>entre particuliers</strong> : le droit de rétractation de 14 jours, prévu par le
          Code de la consommation pour les achats auprès de professionnels, ne s’applique pas.
        </li>
        <li>
          La garantie des vices cachés (articles 1641 et suivants du Code civil) s’applique en revanche aussi entre
          particuliers.
        </li>
        <li>
          En cas de problème (objet non reçu ou différent de l’annonce), contactez d’abord le vendeur par la messagerie.
          Si aucune solution n’est trouvée, écrivez à Bazardim : {LEGAL_INFORMATION.contactEmail}.
        </li>
      </ul>

      <h2>9. Responsabilité</h2>
      <p>
        Chaque utilisateur est responsable des annonces et des messages qu’il publie. Bazardim fait son possible pour
        que le site reste accessible et sécurisé, mais ne peut pas garantir l’absence totale d’interruption.
      </p>

      <h2>10. Données personnelles</h2>
      <p>
        L’utilisation de vos données est expliquée dans la{' '}
        <Link to="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>11. Modification des conditions et droit applicable</h2>
      <p>
        Bazardim peut modifier ces conditions ; la date de mise à jour figure en haut de cette page. Elles sont soumises
        au droit français. En cas de désaccord, une solution amiable est recherchée en priorité ; à défaut, les
        tribunaux français sont compétents.
      </p>
    </article>
  );
}
