import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import figuresData from '../data/figures.json';
import { loginAs, renderWithProviders } from '../test/renderWithProviders.jsx';
import Auth from './Auth/Auth.jsx';
import Cart from './Cart/Cart.jsx';
import Home from './Home/Home.jsx';
import NotFound from './NotFound/NotFound.jsx';
import Product from './Product/Product.jsx';
import Profile from './Profile/Profile.jsx';
import Sell from './Sell/Sell.jsx';
import SignUp from './SignUp/SignUp.jsx';
import UserProfile from './UserProfile/UserProfile.jsx';

// Les nombres attendus sont calculés à partir des données de démonstration,
// pour que les tests restent valables quand on ajoute ou retire des produits.
const allProducts = figuresData.figures;
const statues = allProducts.filter((product) => product.category === 'STATUE');

describe('Home', () => {
  it('affiche tous les produits avec un titre principal', () => {
    renderWithProviders(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Figurines et statues de collection');
    expect(screen.getAllByRole('article')).toHaveLength(allProducts.length);
  });

  it('filtre par catégorie', () => {
    renderWithProviders(<Home category="STATUE" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Statues d’occasion');
    // Autant de cartes que de statues, et aucune figurine (Vegeta est une figurine).
    expect(screen.getAllByRole('article')).toHaveLength(statues.length);
    expect(screen.queryByText(/Vegeta/)).not.toBeInTheDocument();
  });

  it('affiche le nombre de résultats d’une recherche', () => {
    renderWithProviders(<Home />, { route: '/?q=vegeta' });
    expect(screen.getByRole('status')).toHaveTextContent('1 résultat(s) pour « vegeta »');
  });

  it('affiche un message quand rien ne correspond', () => {
    renderWithProviders(<Home />, { route: '/licences?licence=Inconnue' });
    expect(screen.getByText('Aucun produit ne correspond à votre recherche.')).toBeInTheDocument();
  });
});

describe('Auth (connexion)', () => {
  it('affiche une erreur avec un mauvais mot de passe', async () => {
    const { user } = renderWithProviders(<Auth />, { route: '/auth', path: '/auth' });
    await user.type(screen.getByLabelText(/Email/), 'collectionneurdu92@example.com');
    await user.type(screen.getByLabelText(/Mot de passe/), 'mauvais');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect.');
  });

  it('connecte puis redirige vers le profil', async () => {
    const { user } = renderWithProviders(<Auth />, { route: '/auth', path: '/auth' });
    await user.type(screen.getByLabelText(/Email/), 'Collectionneurdu92@example.com ');
    await user.type(screen.getByLabelText(/Mot de passe/), 'password123');
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

  it('refuse un mot de passe trop court ou mal confirmé', async () => {
    const { user } = renderWithProviders(<SignUp />, { route: '/signup', path: '/signup' });
    await fillForm(user, { password: 'court' });
    expect(screen.getByRole('alert')).toHaveTextContent('au moins 8 caractères');
  });

  it('refuse deux mots de passe différents', async () => {
    const { user } = renderWithProviders(<SignUp />, { route: '/signup', path: '/signup' });
    await fillForm(user, { password: 'motdepasse', confirmPassword: 'autrechose' });
    expect(screen.getByRole('alert')).toHaveTextContent('ne correspondent pas');
  });

  it('refuse un email déjà utilisé', async () => {
    const { user } = renderWithProviders(<SignUp />, { route: '/signup', path: '/signup' });
    await fillForm(user, { email: 'admin@example.com' });
    expect(screen.getByRole('alert')).toHaveTextContent('Un compte existe déjà avec cet email.');
  });

  it('crée le compte et redirige vers le profil', async () => {
    const { user } = renderWithProviders(<SignUp />, { route: '/signup', path: '/signup' });
    await fillForm(user, {});
    expect(screen.getByTestId('current-location')).toHaveTextContent('/profile');
  });
});

describe('Cart (panier)', () => {
  it('indique un panier vide', () => {
    renderWithProviders(<Cart />);
    expect(screen.getByText('Votre panier est vide.')).toBeInTheDocument();
  });

  it('modifie les quantités, retire un article et vide le panier', async () => {
    localStorage.setItem(
      'cartItems',
      JSON.stringify([
        { productId: 'FIG001', quantity: 1 },
        { productId: 'FIG002', quantity: 1 },
      ]),
    );
    const { user } = renderWithProviders(<Cart />);
    expect(screen.getByText('134.98 €')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /Ajouter un exemplaire/ })[0]);
    expect(screen.getByText('194.97 €')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /Retirer un exemplaire/ })[0]);
    expect(screen.getByText('134.98 €')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Retirer' })[0]);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Vider le panier' }));
    expect(screen.getByText('Votre panier est vide.')).toBeInTheDocument();
  });
});

describe('Product (fiche produit)', () => {
  it('affiche le produit, ses caractéristiques et ses données structurées', () => {
    renderWithProviders(<Product />, { route: '/product/FIG001', path: '/product/:id' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vegeta');
    expect(screen.getByText('4573102711298')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AJOUTER' })).toBeInTheDocument();
    const structuredData = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    expect(structuredData).toMatchObject({ '@type': 'Product', offers: { price: '59.99', priceCurrency: 'EUR' } });
  });

  it('indique un produit introuvable', () => {
    renderWithProviders(<Product />, { route: '/product/INCONNU', path: '/product/:id' });
    expect(screen.getByRole('heading', { name: 'Produit introuvable' })).toBeInTheDocument();
  });

  it('permet au propriétaire de modifier puis supprimer son annonce', async () => {
    loginAs(101);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { user } = renderWithProviders(<Product />, { route: '/product/FIG001', path: '/product/:id' });

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
    loginAs(101);
    const { user } = renderWithProviders(<Product />, { route: '/product/FIG001?edit=1', path: '/product/:id' });
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
  });
});

describe('Sell (mise en vente)', () => {
  it('crée l’annonce puis ouvre sa page', async () => {
    loginAs(101);
    const { user } = renderWithProviders(<Sell />, { route: '/vendre', path: '/vendre' });
    await user.type(screen.getByLabelText(/Titre/), 'Statue Zoro');
    await user.type(screen.getByLabelText(/Description/), 'Statue en résine');
    await user.type(screen.getByLabelText(/Prix/), '120');
    await user.click(screen.getByRole('button', { name: 'Publier le produit' }));

    expect(screen.getByTestId('current-location')).toHaveTextContent(/^\/product\/USR\d+$/);
    const savedProducts = JSON.parse(localStorage.getItem('products'));
    expect(savedProducts.at(-1)).toMatchObject({ title: 'Statue Zoro', owner_user_id: 101 });
  });
});

describe('Profile (mon profil)', () => {
  it('met à jour le pseudo', async () => {
    loginAs(101);
    const { user } = renderWithProviders(<Profile />);
    const usernameInput = screen.getByLabelText('Pseudo');
    await user.clear(usernameInput);
    await user.type(usernameInput, 'Collec92');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getByText('Profil mis à jour.')).toBeInTheDocument();
  });

  it('liste mes produits, mes likes et mes avis', async () => {
    loginAs(101);
    localStorage.setItem('likesByUser', JSON.stringify({ 101: ['FIG002'] }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { user } = renderWithProviders(<Profile />);

    await user.click(screen.getByRole('button', { name: 'Mes produits' }));
    const myProductsCount = screen.getAllByRole('article').length;
    await user.click(screen.getAllByRole('button', { name: 'Supprimer' })[0]);
    expect(screen.getAllByRole('article')).toHaveLength(myProductsCount - 1);

    await user.click(screen.getByRole('button', { name: 'Mes likes' }));
    expect(screen.getByRole('heading', { name: 'Figurine S.H. Figuarts Luffy' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Avis' }));
    expect(screen.getByText('Aucun avis reçu pour le moment.')).toBeInTheDocument();
  });
});

describe('UserProfile (profil public)', () => {
  it('permet à un utilisateur connecté de laisser un avis', async () => {
    loginAs(101);
    const { user } = renderWithProviders(<UserProfile />, { route: '/user/105', path: '/user/:id' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('FigurineParadise');
    expect(screen.queryByText(/@example.com/)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Votre commentaire'), 'Envoi rapide');
    await user.click(screen.getByRole('button', { name: 'Publier l’avis' }));
    const reviewsBlock = screen.getByRole('heading', { name: 'Avis récents' }).parentElement;
    expect(within(reviewsBlock).getByText('Envoi rapide')).toBeInTheDocument();
    expect(screen.getByText('5.0 / 5')).toBeInTheDocument();
  });

  it('invite un visiteur à se connecter pour laisser un avis', () => {
    renderWithProviders(<UserProfile />, { route: '/user/105', path: '/user/:id' });
    expect(screen.getByRole('link', { name: 'Connectez-vous' })).toBeInTheDocument();
  });

  it('indique un profil introuvable', () => {
    renderWithProviders(<UserProfile />, { route: '/user/999', path: '/user/:id' });
    expect(screen.getByRole('heading', { name: 'Profil introuvable' })).toBeInTheDocument();
  });

  it('redirige vers "Mon profil" quand on consulte son propre profil public', () => {
    loginAs(101);
    renderWithProviders(<UserProfile />, { route: '/user/101', path: '/user/:id' });
    expect(screen.getByTestId('current-location')).toHaveTextContent('/profile');
  });
});

describe('NotFound (404)', () => {
  it('propose de revenir à l’accueil', () => {
    renderWithProviders(<NotFound />, { route: '/nimporte-quoi' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cette page n’existe pas');
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/');
  });
});
