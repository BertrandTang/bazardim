import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PRODUCTS } from './fixtures.js';
import { addFakeMessage } from './fakeApi.js';
import { loginAs, renderWithProviders } from './renderWithProviders.jsx';
import NavBar from '../src/components/NavBar/NavBar.jsx';
import PasswordField from '../src/components/PasswordField/PasswordField.jsx';
import ProductCard from '../src/components/ProductCard/ProductCard.jsx';
import ProductForm from '../src/components/ProductForm/ProductForm.jsx';
import RequireAuth from '../src/components/RequireAuth/RequireAuth.jsx';

const vegeta = PRODUCTS[0]; // produit 1, 59.99 €, vendu par l'utilisateur 1

describe('ProductCard', () => {
  it('affiche le produit et ses liens', async () => {
    await renderWithProviders(<ProductCard product={vegeta} />);
    expect(screen.getByRole('heading', { name: vegeta.title })).toBeInTheDocument();
    expect(screen.getByText('59.99 €')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /CollectionneurDu92/ })).toHaveAttribute('href', '/user/1');
  });

  it('envoie un visiteur vers la connexion quand il clique sur le cœur', async () => {
    const { user } = await renderWithProviders(<ProductCard product={vegeta} />);
    await user.click(screen.getByRole('button', { name: 'Ajouter aux favoris' }));
    expect(screen.getByTestId('current-location')).toHaveTextContent('/auth');
  });

  it('ajoute aux favoris et au panier', async () => {
    loginAs(2);
    const { user } = await renderWithProviders(<ProductCard product={vegeta} />);

    const likeButton = screen.getByRole('button', { name: 'Ajouter aux favoris' });
    await user.click(likeButton);
    expect(screen.getByRole('button', { name: 'Retirer des favoris' })).toHaveAttribute('aria-pressed', 'true');

    // Pièce unique : une fois ajoutée, le bouton indique qu'elle est déjà dans le panier.
    await user.click(screen.getByRole('button', { name: 'AJOUTER' }));
    expect(screen.getByRole('button', { name: 'DANS LE PANIER' })).toBeDisabled();
    expect(screen.getByText('Ajouté au panier')).toBeInTheDocument(); // annoncé aux lecteurs d'écran
  });

  it('affiche le badge "Vendu" et pas de bouton AJOUTER pour une annonce vendue', async () => {
    await renderWithProviders(<ProductCard product={{ ...vegeta, sold_at: '2026-11-23T10:00:00Z' }} />);
    expect(screen.getByText('Vendu')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'AJOUTER' })).not.toBeInTheDocument();
  });

  it('affiche Modifier / Supprimer dans la version propriétaire', async () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    const { user } = await renderWithProviders(
      <ProductCard product={vegeta} onEdit={handleEdit} onDelete={handleDelete} />,
    );

    expect(screen.queryByRole('button', { name: 'AJOUTER' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Modifier' }));
    await user.click(screen.getByRole('button', { name: 'Supprimer' }));
    expect(handleEdit).toHaveBeenCalledWith(vegeta);
    expect(handleDelete).toHaveBeenCalledWith(vegeta);
  });
});

describe('ProductForm', () => {
  it('affiche une erreur si les champs obligatoires sont vides ou le prix invalide', async () => {
    const handleSubmit = vi.fn();
    const { user } = await renderWithProviders(
      <ProductForm submitLabel="Publier" onSubmit={handleSubmit} onCancel={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Publier' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Le titre et la description sont obligatoires.');

    await user.type(screen.getByLabelText(/Titre/), 'Luffy');
    await user.type(screen.getByLabelText(/Description/), 'Très belle figurine');
    await user.click(screen.getByRole('button', { name: 'Publier' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Le prix doit être supérieur à 0.');
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('convertit les valeurs saisies en champs de produit, au format de l’API', async () => {
    const handleSubmit = vi.fn();
    const { user } = await renderWithProviders(
      <ProductForm submitLabel="Publier" onSubmit={handleSubmit} onCancel={vi.fn()} />,
    );

    await user.type(screen.getByLabelText(/Titre/), '  Luffy  ');
    await user.type(screen.getByLabelText(/Description/), 'Très belle figurine');
    await user.type(screen.getByLabelText(/Prix/), '49.9');
    await user.type(screen.getByLabelText(/Tags/), 'shf, bandai, ');
    await user.click(screen.getByRole('button', { name: 'Publier' }));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Luffy',
        price: 49.9,
        tags: ['shf', 'bandai'],
        has_box: true,
        category: 'FIGURINE',
        scale: '1/8',
      }),
    );
  });

  it('affiche l’erreur renvoyée par l’API', async () => {
    const handleSubmit = vi.fn().mockRejectedValue(new Error('Données invalides. ean_code : 8 ou 13 chiffres'));
    const { user } = await renderWithProviders(
      <ProductForm initialProduct={vegeta} submitLabel="Enregistrer" onSubmit={handleSubmit} onCancel={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('ean_code : 8 ou 13 chiffres');
    // Le bouton est de nouveau utilisable pour corriger et renvoyer.
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
  });

  it('pré-remplit le formulaire avec le produit à modifier', async () => {
    await renderWithProviders(
      <ProductForm initialProduct={vegeta} submitLabel="Enregistrer" onSubmit={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.getByLabelText(/Titre/)).toHaveValue(vegeta.title);
    expect(screen.getByLabelText(/Tags/)).toHaveValue('articulée, shf, bandai, premium');
  });
});

describe('NavBar', () => {
  it('lance une recherche en ajoutant ?q= à l’adresse', async () => {
    const { user } = await renderWithProviders(<NavBar />, { route: '/cart' });
    await user.type(screen.getByRole('searchbox', { name: 'Rechercher un produit' }), 'luffy{Enter}');
    expect(screen.getByTestId('current-location')).toHaveTextContent('/?q=luffy');
  });

  it('ouvre le menu des catégories au clavier et le ferme avec Échap', async () => {
    const { user } = await renderWithProviders(<NavBar />);
    const categoriesButton = screen.getByRole('button', { name: 'CATEGORIES' });

    categoriesButton.focus();
    await user.keyboard('{Enter}');
    expect(categoriesButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Statues' })).toBeVisible();

    await user.keyboard('{Escape}');
    expect(categoriesButton).toHaveAttribute('aria-expanded', 'false');
    expect(categoriesButton).toHaveFocus();
  });

  it('affiche une pastille avec le nombre de messages non lus', async () => {
    addFakeMessage({ sender_id: 2, recipient_id: 1, product_id: 1, content: 'Bonjour' });
    addFakeMessage({ sender_id: 2, recipient_id: 1, product_id: 1, content: 'Toujours là ?' });
    loginAs(1);
    await renderWithProviders(<NavBar />);
    const messagesLink = screen.getByRole('link', { name: 'Messages (2 non lus)' });
    expect(messagesLink).toHaveTextContent('2');
  });

  it('affiche Messages, Profil et Déconnexion quand l’utilisateur est connecté', async () => {
    loginAs(1);
    const { user } = await renderWithProviders(<NavBar />);
    // Sans message non lu : pas de pastille.
    expect(screen.getByRole('link', { name: 'Messages' })).toHaveAttribute('href', '/messages');
    expect(screen.getByRole('link', { name: 'Profil' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Déconnexion' }));
    expect(screen.getByRole('link', { name: 'Connexion' })).toBeInTheDocument();
  });
});

describe('RequireAuth', () => {
  it('redirige vers la connexion si personne n’est connecté', async () => {
    await renderWithProviders(
      <RequireAuth>
        <p>Page privée</p>
      </RequireAuth>,
      { route: '/profile', path: '/profile' },
    );
    expect(screen.queryByText('Page privée')).not.toBeInTheDocument();
    expect(screen.getByTestId('current-location')).toHaveTextContent('/auth');
  });

  it('affiche la page si l’utilisateur est connecté', async () => {
    loginAs(1);
    await renderWithProviders(
      <RequireAuth>
        <p>Page privée</p>
      </RequireAuth>,
    );
    expect(screen.getByText('Page privée')).toBeInTheDocument();
  });
});

describe('PasswordField', () => {
  it('affiche puis masque le mot de passe avec le bouton œil', async () => {
    const { user } = await renderWithProviders(<PasswordField label="Mot de passe" />);
    const passwordInput = screen.getByLabelText('Mot de passe');
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Masquer le mot de passe' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
