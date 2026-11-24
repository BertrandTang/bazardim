import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  addFakeMessage,
  addFakePendingLicence,
  createOrder,
  fakeUserExists,
  fetchUnreadMessageCount,
  likeProduct,
  markFakeOrderAsPaid,
  markFakeProductAsSold,
} from './fakeApi.js';
import { PRODUCTS, TEST_PASSWORD } from './fixtures.js';
import { loginAs, renderWithProviders } from './renderWithProviders.jsx';
import Auth from '../src/pages/Auth/Auth.jsx';
import Cart from '../src/pages/Cart/Cart.jsx';
import Home from '../src/pages/Home/Home.jsx';
import Messages from '../src/pages/Messages/Messages.jsx';
import NotFound from '../src/pages/NotFound/NotFound.jsx';
import OrderConfirmation from '../src/pages/OrderConfirmation/OrderConfirmation.jsx';
import Product from '../src/pages/Product/Product.jsx';
import Profile from '../src/pages/Profile/Profile.jsx';
import RequireAuth from '../src/components/RequireAuth/RequireAuth.jsx';
import AdminLicences from '../src/pages/AdminLicences/AdminLicences.jsx';
import Footer from '../src/components/Footer/Footer.jsx';
import LegalNotice from '../src/pages/Legal/LegalNotice.jsx';
import PrivacyPolicy from '../src/pages/Legal/PrivacyPolicy.jsx';
import TermsAndConditions from '../src/pages/Legal/TermsAndConditions.jsx';
import Sell from '../src/pages/Sell/Sell.jsx';
import SignUp from '../src/pages/SignUp/SignUp.jsx';
import UserProfile from '../src/pages/UserProfile/UserProfile.jsx';
import { redirectTo } from '../src/utils/redirect.js';

// Le navigateur simulé ne sait pas aller sur un autre site (Stripe) : on remplace
// redirectTo par une fausse fonction, et on vérifie simplement avec quelle adresse elle est appelée.
vi.mock('../src/utils/redirect.js', () => ({ redirectTo: vi.fn() }));

/** Adresse de livraison telle que l'enregistre le champ d'adresse du panier. */
const SHIPPING_ADDRESS = { id: 'A1', label: '10 Rue de Rivoli 75004 Paris', postcode: '75004', city: 'Paris' };

/** Met des annonces dans le panier (localStorage), avant d'afficher la page. Ex : fillCart([1, 2]). */
function fillCart(productIds) {
  localStorage.setItem('cartProductIds', JSON.stringify(productIds));
}

// Les nombres attendus sont calculés à partir des données de test (fixtures.js),
// pour que les tests restent valables quand on ajoute ou retire des produits.
const statues = PRODUCTS.filter((product) => product.category === 'STATUE');

describe('Home', () => {
  it('affiche tous les produits avec un titre principal', async () => {
    await renderWithProviders(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Figurines et statues de collection');
    expect(screen.getAllByRole('article')).toHaveLength(PRODUCTS.length);
  });

  it('filtre par catégorie', async () => {
    await renderWithProviders(<Home category="STATUE" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Statues d’occasion');
    // Autant de cartes que de statues, et aucune figurine (Vegeta est une figurine).
    expect(screen.getAllByRole('article')).toHaveLength(statues.length);
    expect(screen.queryByText(/Vegeta/)).not.toBeInTheDocument();
  });

  it('affiche le nombre de résultats d’une recherche', async () => {
    await renderWithProviders(<Home />, { route: '/?q=vegeta' });
    expect(screen.getByRole('status')).toHaveTextContent('1 résultat(s) pour « vegeta »');
  });

  it('n’affiche pas les annonces vendues', async () => {
    markFakeProductAsSold(1); // Vegeta
    await renderWithProviders(<Home />);
    expect(screen.getAllByRole('article')).toHaveLength(PRODUCTS.length - 1);
    expect(screen.queryByText(/Vegeta/)).not.toBeInTheDocument();
  });

  it('affiche un message quand rien ne correspond', async () => {
    await renderWithProviders(<Home />, { route: '/licences?licence=Inconnue' });
    expect(screen.getByText('Aucun produit ne correspond à votre recherche.')).toBeInTheDocument();
  });
});

describe('Auth (connexion)', () => {
  it('affiche le message d’erreur de l’API avec un mauvais mot de passe', async () => {
    const { user } = await renderWithProviders(<Auth />, { route: '/auth', path: '/auth' });
    await user.type(screen.getByLabelText(/Email/), 'collectionneurdu92@example.com');
    await user.type(screen.getByLabelText(/Mot de passe/), 'mauvais');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect.');
  });

  it('connecte puis redirige vers le profil', async () => {
    const { user } = await renderWithProviders(<Auth />, { route: '/auth', path: '/auth' });
    await user.type(screen.getByLabelText(/Email/), 'Collectionneurdu92@example.com ');
    await user.type(screen.getByLabelText(/Mot de passe/), TEST_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(screen.getByTestId('current-location')).toHaveTextContent('/profile');
  });
});

describe('SignUp (inscription)', () => {
  async function fillForm(
    user,
    { password = 'motdepasse', confirmPassword = password, email = 'nouveau@example.com' },
  ) {
    await user.type(screen.getByLabelText(/Pseudo/), 'Nouveau');
    await user.type(screen.getByLabelText(/^Email/), email);
    await user.type(screen.getByLabelText(/^Mot de passe/), password);
    await user.type(screen.getByLabelText(/Confirme/), confirmPassword);
    await user.click(screen.getByRole('button', { name: 'S’inscrire' }));
  }

  it('refuse un mot de passe trop court', async () => {
    const { user } = await renderWithProviders(<SignUp />, { route: '/signup', path: '/signup' });
    await fillForm(user, { password: 'court' });
    expect(screen.getByRole('alert')).toHaveTextContent('au moins 8 caractères');
  });

  it('refuse deux mots de passe différents', async () => {
    const { user } = await renderWithProviders(<SignUp />, { route: '/signup', path: '/signup' });
    await fillForm(user, { password: 'motdepasse', confirmPassword: 'autrechose' });
    expect(screen.getByRole('alert')).toHaveTextContent('ne correspondent pas');
  });

  it('affiche le refus de l’API pour un email déjà utilisé', async () => {
    const { user } = await renderWithProviders(<SignUp />, { route: '/signup', path: '/signup' });
    await fillForm(user, { email: 'admin@example.com' });
    expect(screen.getByRole('alert')).toHaveTextContent('Un compte existe déjà avec cet email.');
  });

  it('crée le compte et redirige vers le profil', async () => {
    const { user } = await renderWithProviders(<SignUp />, { route: '/signup', path: '/signup' });
    await fillForm(user, {});
    expect(screen.getByTestId('current-location')).toHaveTextContent('/profile');
  });
});

describe('Cart (panier)', () => {
  it('indique un panier vide', async () => {
    await renderWithProviders(<Cart />);
    expect(screen.getByText('Votre panier est vide.')).toBeInTheDocument();
  });

  it('affiche les annonces et le total, retire une annonce et vide le panier', async () => {
    fillCart([1, 2]); // produits 1 (59.99 €) et 2 (74.99 €)
    const { user } = await renderWithProviders(<Cart />);
    // Ligne du récapitulatif (libellé + montant) : le <div> qui contient le libellé <dt>.
    const summaryLine = (label) => screen.getByText(label, { selector: 'dt' }).parentElement;
    expect(summaryLine('Articles')).toHaveTextContent('134.98 €');
    // Frais de service affichés avant le paiement : 0.70 € + 5 % de 134.98 € (6.75 €) = 7.45 €.
    expect(summaryLine('Frais de service')).toHaveTextContent('7.45 €');
    expect(summaryLine('Total')).toHaveTextContent('142.43 €');
    // Pièces uniques : pas de boutons de quantité.
    expect(screen.queryByRole('button', { name: '+' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Retirer Figurine S.H. Figuarts Vegeta/ }));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(summaryLine('Total')).toHaveTextContent('79.44 €'); // 74.99 € + 4.45 € de frais

    await user.click(screen.getByRole('button', { name: 'Vider le panier' }));
    expect(screen.getByText('Votre panier est vide.')).toBeInTheDocument();
  });

  it('demande à un visiteur de se connecter pour commander', async () => {
    fillCart([2]);
    await renderWithProviders(<Cart />);
    expect(screen.getByRole('link', { name: 'Se connecter pour commander' })).toHaveAttribute('href', '/auth');
    expect(screen.getByRole('link', { name: 'conditions générales de vente' })).toHaveAttribute(
      'href',
      '/conditions-generales',
    );
  });

  it('demande une adresse, puis crée la commande et envoie vers la page de paiement Stripe', async () => {
    loginAs(1);
    fillCart([2]); // produit 2 : vendu par l'utilisateur 2
    const { user, unmount } = await renderWithProviders(<Cart />);
    expect(screen.getByRole('button', { name: 'Commander et payer' })).toBeDisabled();
    unmount();

    localStorage.setItem('shippingAddress', JSON.stringify(SHIPPING_ADDRESS));
    await renderWithProviders(<Cart />);
    await user.click(screen.getByRole('button', { name: 'Commander et payer' }));
    expect(redirectTo).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/fausse-session-1');
  });

  it('affiche le refus de l’API (achat de sa propre annonce)', async () => {
    loginAs(1);
    fillCart([1]); // produit 1 : vendu par l'utilisateur 1 lui-même
    localStorage.setItem('shippingAddress', JSON.stringify(SHIPPING_ADDRESS));
    const { user } = await renderWithProviders(<Cart />);
    await user.click(screen.getByRole('button', { name: 'Commander et payer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Vous ne pouvez pas acheter votre propre annonce');
  });

  it('retire du panier une annonce vendue entre-temps', async () => {
    fillCart([1, 2]);
    markFakeProductAsSold(1);
    await renderWithProviders(<Cart />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByText(/Vegeta/)).not.toBeInTheDocument();
  });
});

describe('OrderConfirmation (retour du paiement)', () => {
  it('attend la confirmation du paiement, puis remercie et vide le panier', async () => {
    loginAs(1);
    fillCart([2]);
    const { order_id: orderId } = await createOrder({
      product_ids: [2],
      shipping_address: SHIPPING_ADDRESS.label,
    });
    const { user } = await renderWithProviders(<OrderConfirmation />, {
      route: `/commande/confirmation?order_id=${orderId}`,
    });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Paiement en cours de vérification');
    expect(screen.getByText('En attente de paiement')).toBeInTheDocument();

    // Stripe confirme le paiement, l'utilisateur clique sur "Vérifier à nouveau".
    markFakeOrderAsPaid(orderId);
    await user.click(screen.getByRole('button', { name: 'Vérifier à nouveau' }));
    expect(await screen.findByText('Merci pour votre commande !')).toBeInTheDocument();
    expect(screen.getByText('Payée')).toBeInTheDocument();
    expect(screen.getByText('10 Rue de Rivoli 75004 Paris', { exact: false })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('cartProductIds'))).toEqual([]);
  });

  it('indique une commande introuvable', async () => {
    loginAs(1);
    await renderWithProviders(<OrderConfirmation />, { route: '/commande/confirmation?order_id=999' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Commande introuvable');
  });
});

describe('Product (fiche produit)', () => {
  it('affiche le produit, ses caractéristiques et ses données structurées', async () => {
    await renderWithProviders(<Product />, { route: '/product/1', path: '/product/:id' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vegeta');
    expect(screen.getByText('4573102711298')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AJOUTER' })).toBeInTheDocument();
    const structuredData = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    expect(structuredData).toMatchObject({ '@type': 'Product', offers: { price: '59.99', priceCurrency: 'EUR' } });
  });

  it('indique une annonce vendue, sans bouton pour l’ajouter au panier', async () => {
    markFakeProductAsSold(1);
    await renderWithProviders(<Product />, { route: '/product/1', path: '/product/:id' });
    expect(screen.getByText('Vendu')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'AJOUTER' })).not.toBeInTheDocument();
  });

  it('n’ouvre pas le formulaire de modification d’une annonce vendue', async () => {
    markFakeProductAsSold(1);
    loginAs(1); // propriétaire du produit 1
    await renderWithProviders(<Product />, { route: '/product/1?edit=1', path: '/product/:id' });
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
    expect(screen.getByText('Vendu')).toBeInTheDocument();
  });

  it('indique un produit introuvable', async () => {
    await renderWithProviders(<Product />, { route: '/product/999', path: '/product/:id' });
    expect(screen.getByRole('heading', { name: 'Produit introuvable' })).toBeInTheDocument();
  });

  it('permet au propriétaire de modifier puis supprimer son annonce', async () => {
    loginAs(1);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { user } = await renderWithProviders(<Product />, { route: '/product/1', path: '/product/:id' });

    // Le propriétaire ne peut pas s'écrire à lui-même.
    expect(screen.queryByRole('heading', { name: 'Contacter le vendeur' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Modifier' }));
    const titleInput = screen.getByLabelText(/Titre/);
    await user.clear(titleInput);
    await user.type(titleInput, 'Vegeta modifié');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vegeta modifié');

    await user.click(screen.getByRole('button', { name: 'Supprimer' }));
    expect(screen.getByTestId('current-location')).toHaveTextContent('/profile');
  });

  it('ouvre directement le formulaire avec ?edit=1 et permet d’annuler', async () => {
    loginAs(1);
    const { user } = await renderWithProviders(<Product />, { route: '/product/1?edit=1', path: '/product/:id' });
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
  });

  it('permet à un autre utilisateur de contacter le vendeur', async () => {
    loginAs(2);
    const { user } = await renderWithProviders(<Product />, { route: '/product/1', path: '/product/:id' });

    await user.click(screen.getByRole('button', { name: 'Envoyer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Le message ne peut pas être vide.');

    await user.type(screen.getByLabelText(/Votre message à CollectionneurDu92/), 'Toujours disponible ?');
    await user.click(screen.getByRole('button', { name: 'Envoyer' }));
    expect(screen.getByText('Message envoyé.')).toBeInTheDocument();
  });

  it('invite un visiteur à se connecter pour contacter le vendeur', async () => {
    await renderWithProviders(<Product />, { route: '/product/1', path: '/product/:id' });
    expect(screen.getByRole('link', { name: 'Connectez-vous' })).toHaveAttribute('href', '/auth');
  });
});

describe('Sell (mise en vente)', () => {
  it('crée l’annonce puis ouvre sa page', async () => {
    loginAs(1);
    const { user } = await renderWithProviders(<Sell />, { route: '/vendre', path: '/vendre' });
    await user.type(screen.getByLabelText(/Titre/), 'Statue Zoro');
    await user.type(screen.getByLabelText(/Description/), 'Statue en résine');
    await user.type(screen.getByLabelText(/Prix/), '120');
    await user.upload(
      screen.getByLabelText('Choisir une image'),
      new File(['photo'], 'zoro.jpg', { type: 'image/jpeg' }),
    );
    await user.click(screen.getByRole('button', { name: 'Publier le produit' }));

    // La fausse API donne l'identifiant suivant : 12 (il y a 11 produits au départ).
    expect(screen.getByTestId('current-location')).toHaveTextContent(`/product/${PRODUCTS.length + 1}`);
  });
});

describe('Profile (mon profil)', () => {
  // Comme dans App.jsx, la page est protégée par RequireAuth, qui attend de savoir qui est connecté.
  const profilePage = (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  );

  it('met à jour le pseudo', async () => {
    loginAs(1);
    const { user } = await renderWithProviders(profilePage);
    const usernameInput = screen.getByLabelText('Pseudo');
    await user.clear(usernameInput);
    await user.type(usernameInput, 'Collec92');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getByText('Profil mis à jour.')).toBeInTheDocument();
  });

  it('change la photo de profil avec une image de l’appareil', async () => {
    loginAs(1);
    const { user } = await renderWithProviders(profilePage);
    // L'utilisateur 1 a déjà une photo : le bouton propose de la changer.
    await user.upload(screen.getByLabelText('Changer l’image'), new File(['photo'], 'moi.png', { type: 'image/png' }));
    expect(screen.getByRole('img', { name: /Photo de profil/ })).toHaveAttribute(
      'src',
      expect.stringMatching(/^\/uploads\/.*moi\.png$/),
    );
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getByText('Profil mis à jour.')).toBeInTheDocument();
  });

  it('refuse un changement d’email sans le mot de passe actuel', async () => {
    loginAs(1);
    const { user } = await renderWithProviders(profilePage);
    const emailInput = screen.getByLabelText('Email');
    await user.clear(emailInput);
    await user.type(emailInput, 'nouvel-email@example.com');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Mot de passe actuel incorrect.');
  });

  it('liste mes produits et mes likes', async () => {
    loginAs(1);
    await likeProduct(2); // l'utilisateur 1 a mis le produit 2 (Luffy) en favori
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { user } = await renderWithProviders(profilePage);

    await user.click(screen.getByRole('button', { name: 'Mes produits' }));
    const myProductsCount = screen.getAllByRole('article').length;
    await user.click(screen.getAllByRole('button', { name: 'Supprimer' })[0]);
    expect(screen.getAllByRole('article')).toHaveLength(myProductsCount - 1);

    await user.click(screen.getByRole('button', { name: 'Mes likes' }));
    expect(screen.getByRole('heading', { name: 'Figurine S.H. Figuarts Luffy' })).toBeInTheDocument();
  });

  it('une annonce vendue affiche son acheteur et ne peut plus être modifiée', async () => {
    // L'utilisateur 2 achète et paie le produit 1 (Vegeta), qui appartient à l'utilisateur 1.
    loginAs(2);
    const { order_id: orderId } = await createOrder({ product_ids: [1], shipping_address: '1 rue de Paris' });
    markFakeOrderAsPaid(orderId);

    loginAs(1);
    const { user } = await renderWithProviders(profilePage);
    await user.click(screen.getByRole('button', { name: 'Mes produits' }));

    const soldCard = screen.getByRole('heading', { name: PRODUCTS[0].title }).closest('article');
    expect(within(soldCard).getByText('Vendu')).toBeInTheDocument();
    expect(within(soldCard).getByRole('link', { name: 'FigurineParadise' })).toHaveAttribute('href', '/user/2');
    expect(within(soldCard).queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
    expect(within(soldCard).getByRole('button', { name: 'Supprimer' })).toBeInTheDocument();
    // Le vendeur voit où expédier l'article, puis indique qu'il l'a expédié (après confirmation).
    expect(within(soldCard).getByText('1 rue de Paris')).toBeInTheDocument();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(within(soldCard).getByRole('button', { name: 'Marquer comme expédié' }));
    expect(await within(soldCard).findByText(/Expédié le/)).toBeInTheDocument();
    expect(within(soldCard).queryByRole('button', { name: 'Marquer comme expédié' })).not.toBeInTheDocument();

    // L'acheteur (utilisateur 2) voit l'article expédié dans « Mes commandes ».
    loginAs(2);
    await renderWithProviders(profilePage);
    await user.click(screen.getAllByRole('button', { name: 'Mes commandes' }).at(-1));
    expect(await screen.findByText(/^Expédié le/)).toBeInTheDocument();
  });

  it('supprime le compte après avoir écrit SUPPRIMER et donné son mot de passe', async () => {
    loginAs(1);
    const { user } = await renderWithProviders(profilePage, { route: '/profile', path: '/profile' });
    await user.click(screen.getByRole('button', { name: 'Supprimer mon compte' }));

    // La pop-up est ouverte ; le bouton reste désactivé tant que le mot n'est pas exactement "SUPPRIMER".
    const dialog = screen.getByRole('dialog', { name: 'Supprimer votre compte ?' });
    const deleteButton = within(dialog).getByRole('button', { name: 'Supprimer définitivement' });
    await user.type(within(dialog).getByLabelText('Mot de passe actuel'), 'mauvais');
    await user.type(within(dialog).getByLabelText(/Écrivez SUPPRIMER/), 'supprimer');
    expect(deleteButton).toBeDisabled();
    expect(within(dialog).getByText('Écrivez exactement SUPPRIMER, en majuscules.')).toBeInTheDocument();

    // Un espace tapé en trop après le mot est accepté.
    await user.clear(within(dialog).getByLabelText(/Écrivez SUPPRIMER/));
    await user.type(within(dialog).getByLabelText(/Écrivez SUPPRIMER/), 'SUPPRIMER ');
    expect(deleteButton).toBeEnabled();

    // Mauvais mot de passe : refus de l'API, le compte existe toujours.
    await user.click(deleteButton);
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Mot de passe actuel incorrect.');
    expect(fakeUserExists(1)).toBe(true);

    // Bon mot de passe : compte supprimé, le site est rechargé sur l'accueil.
    await user.clear(within(dialog).getByLabelText('Mot de passe actuel'));
    await user.type(within(dialog).getByLabelText('Mot de passe actuel'), TEST_PASSWORD);
    await user.click(deleteButton);
    expect(fakeUserExists(1)).toBe(false);
    expect(redirectTo).toHaveBeenCalledWith('/');
  });

  it('ferme la pop-up sans rien supprimer avec Annuler', async () => {
    loginAs(1);
    const { user } = await renderWithProviders(profilePage);
    await user.click(screen.getByRole('button', { name: 'Supprimer mon compte' }));
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    // La pop-up se ferme avec une petite animation : on attend qu'elle ait disparu.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(fakeUserExists(1)).toBe(true);
  });

  it('liste mes commandes', async () => {
    loginAs(1);
    const { user } = await renderWithProviders(profilePage);
    await user.click(screen.getByRole('button', { name: 'Mes commandes' }));
    expect(await screen.findByText('Vous n’avez pas encore passé de commande.')).toBeInTheDocument();

    await createOrder({ product_ids: [2, 3], shipping_address: SHIPPING_ADDRESS.label });
    await user.click(screen.getByRole('button', { name: 'Mes likes' }));
    await user.click(screen.getByRole('button', { name: 'Mes commandes' }));
    expect(await screen.findByRole('heading', { name: /Commande n° 1/ })).toBeInTheDocument();
    // Articles : 74.99 € + 99.99 € = 174.98 € ; frais : 0.70 € + 5 % (8.75 €) = 9.45 €.
    expect(screen.getByText(/^Frais de service/)).toHaveTextContent('9.45 €');
    expect(screen.getByText(/^Total/)).toHaveTextContent('184.43 €');
  });
});

describe('UserProfile (profil public)', () => {
  it('affiche le pseudo et les annonces du vendeur, sans son email', async () => {
    await renderWithProviders(<UserProfile />, { route: '/user/2', path: '/user/:id' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('FigurineParadise');
    expect(screen.getByRole('heading', { name: 'Annonces de FigurineParadise' })).toBeInTheDocument();
    // L'email est une donnée personnelle (RGPD) : il ne doit pas apparaître sur le profil public.
    expect(screen.queryByText(/@example.com/)).not.toBeInTheDocument();
  });

  it('indique un profil introuvable', async () => {
    await renderWithProviders(<UserProfile />, { route: '/user/999', path: '/user/:id' });
    expect(screen.getByRole('heading', { name: 'Profil introuvable' })).toBeInTheDocument();
  });

  it('redirige vers "Mon profil" quand on consulte son propre profil public', async () => {
    loginAs(1);
    await renderWithProviders(<UserProfile />, { route: '/user/1', path: '/user/:id' });
    expect(screen.getByTestId('current-location')).toHaveTextContent('/profile');
  });
});

describe('Messages (messagerie)', () => {
  it('affiche un message reçu, permet d’y répondre et le marque comme lu', async () => {
    // L'utilisateur 2 a écrit à l'utilisateur 1 à propos du produit 1.
    addFakeMessage({ sender_id: 2, recipient_id: 1, product_id: 1, content: 'Toujours disponible ?' });
    loginAs(1);
    const { user } = await renderWithProviders(<Messages />);

    const message = screen.getByRole('listitem');
    expect(within(message).getByText('Toujours disponible ?')).toBeInTheDocument();
    expect(within(message).getByRole('link', { name: 'FigurineParadise' })).toHaveAttribute('href', '/user/2');
    expect(within(message).getByText('Nouveau')).toBeInTheDocument();

    await user.click(within(message).getByRole('button', { name: 'Répondre' }));
    await user.type(within(message).getByLabelText(/Votre réponse/), 'Oui !');
    await user.click(within(message).getByRole('button', { name: 'Envoyer' }));
    expect(within(message).getByText('Message envoyé.')).toBeInTheDocument();
    expect(within(message).queryByText('Nouveau')).not.toBeInTheDocument();
    // Le message est bien enregistré comme lu (la pastille de la barre de navigation se base dessus).
    expect(await fetchUnreadMessageCount()).toEqual({ count: 0 });

    // La réponse apparaît dans l'onglet "Envoyés".
    await user.click(screen.getByRole('button', { name: 'Envoyés' }));
    expect(await screen.findByText('Oui !')).toBeInTheDocument();
  });

  it('indique une boîte vide et une annonce supprimée', async () => {
    addFakeMessage({ sender_id: 2, recipient_id: 1, product_id: null, content: 'Bonjour' });
    loginAs(1);
    const { user } = await renderWithProviders(<Messages />);
    expect(screen.getByText('annonce supprimée')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Marquer comme lu' }));
    expect(screen.queryByText('Nouveau')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Envoyés' }));
    expect(await screen.findByText('Aucun message.')).toBeInTheDocument();
  });
});

describe('NotFound (404)', () => {
  it('propose de revenir à l’accueil', async () => {
    await renderWithProviders(<NotFound />, { route: '/nimporte-quoi' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cette page n’existe pas');
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/');
  });
});

describe('Pages légales', () => {
  it('le pied de page donne accès aux mentions légales et à la politique de confidentialité', async () => {
    await renderWithProviders(<Footer />);
    expect(screen.getByRole('link', { name: 'Mentions légales' })).toHaveAttribute('href', '/mentions-legales');
    expect(screen.getByRole('link', { name: 'Politique de confidentialité' })).toHaveAttribute(
      'href',
      '/confidentialite',
    );
    expect(screen.getByRole('link', { name: 'Conditions générales' })).toHaveAttribute('href', '/conditions-generales');
  });

  it('affiche les mentions légales : éditeur et hébergeur', async () => {
    await renderWithProviders(<LegalNotice />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mentions légales');
    expect(screen.getByRole('heading', { name: 'Éditeur du site' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hébergeur' })).toBeInTheDocument();
  });

  it('explique les données collectées, les cookies et les droits RGPD', async () => {
    await renderWithProviders(<PrivacyPolicy />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Politique de confidentialité');
    // Une ligne du tableau par usage des données.
    expect(screen.getByRole('rowheader', { name: 'Passer et suivre une commande' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cookies et stockage dans le navigateur' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'votre profil' })).toHaveAttribute('href', '/profile');
  });

  it('affiche les conditions générales avec le barème des frais de service', async () => {
    await renderWithProviders(<TermsAndConditions />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Conditions générales d’utilisation et de vente',
    );
    expect(screen.getByRole('heading', { name: '5. Prix et frais de service' })).toBeInTheDocument();
    expect(screen.getByText(/0,70 € \+ 5 % du prix des articles/)).toBeInTheDocument();
    expect(screen.getByText(/mode test/)).toBeInTheDocument();
  });
});

describe('AdminLicences (modération des licences)', () => {
  const adminPage = (
    <RequireAuth>
      <AdminLicences />
    </RequireAuth>
  );

  it('est réservée aux administrateurs', async () => {
    loginAs(1);
    await renderWithProviders(adminPage);
    expect(screen.getByRole('alert')).toHaveTextContent('Réservé aux administrateurs.');
  });

  it('valide une licence en attente : elle rejoint les licences validées', async () => {
    addFakePendingLicence('Chainsaw Man');
    loginAs(8); // administrateur
    const { user } = await renderWithProviders(adminPage);

    expect(await screen.findByRole('heading', { name: 'En attente de validation (1)' })).toBeInTheDocument();
    const pending = screen.getByRole('article', { name: 'Licence en attente : Chainsaw Man' });
    await user.click(within(pending).getByRole('button', { name: 'Valider' }));

    expect(await screen.findByText('« Chainsaw Man » est validée.')).toBeInTheDocument();
    expect(screen.getByText('Aucune licence en attente.')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Licence validée : Chainsaw Man' })).toBeInTheDocument();
  });

  it('fusionne un doublon dans une licence validée : son nom devient un synonyme', async () => {
    addFakePendingLicence('OP');
    loginAs(8);
    const { user } = await renderWithProviders(adminPage);

    const pending = await screen.findByRole('article', { name: 'Licence en attente : OP' });
    await user.click(within(pending).getByRole('combobox', { name: 'C’est la même licence que…' }));
    await user.click(screen.getByRole('option', { name: 'One Piece' }));
    await user.click(within(pending).getByRole('button', { name: 'Fusionner' }));

    expect(await screen.findByText(/« OP » a été fusionnée dans « One Piece »/)).toBeInTheDocument();
    const onePiece = screen.getByRole('article', { name: 'Licence validée : One Piece' });
    expect(within(onePiece).getByText('op')).toBeInTheDocument();
  });

  it('ajoute puis supprime un synonyme', async () => {
    loginAs(8);
    const { user } = await renderWithProviders(adminPage);

    const naruto = await screen.findByRole('article', { name: 'Licence validée : Naruto' });
    await user.type(within(naruto).getByLabelText('Ajouter un synonyme'), 'Naruto Shippuden');
    await user.click(within(naruto).getByRole('button', { name: 'Ajouter' }));
    expect(await within(naruto).findByText('naruto shippuden')).toBeInTheDocument();

    // L'icône de suppression du « chip » MUI : on clique dessus pour retirer le synonyme.
    const aliasChip = within(naruto).getByText('naruto shippuden').closest('.MuiChip-root');
    await user.click(aliasChip.querySelector('.MuiChip-deleteIcon'));
    await waitFor(() => expect(within(naruto).queryByText('naruto shippuden')).not.toBeInTheDocument());
  });
});
