import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import figuresData from '../src/data/figures.json';
import { loginAs, renderWithProviders } from './renderWithProviders.jsx';
import NavBar from '../src/components/NavBar/NavBar.jsx';
import ProductCard from '../src/components/ProductCard/ProductCard.jsx';
import ProductForm from '../src/components/ProductForm/ProductForm.jsx';
import RequireAuth from '../src/components/RequireAuth/RequireAuth.jsx';

const vegeta = figuresData.figures[0]; // FIG001, 59.99 €, vendu par l'utilisateur 101

describe('ProductCard', () => {
  it('affiche le produit et ses liens', () => {
    renderWithProviders(<ProductCard product={vegeta} />);
    expect(screen.getByRole('heading', { name: vegeta.title })).toBeInTheDocument();
    expect(screen.getByText('59.99 €')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /CollectionneurDu92/ })).toHaveAttribute('href', '/user/101');
  });

  it('ajoute aux favoris et au panier', async () => {
    const { user } = renderWithProviders(<ProductCard product={vegeta} />);

    const likeButton = screen.getByRole('button', { name: 'Ajouter aux favoris' });
    await user.click(likeButton);
    expect(screen.getByRole('button', { name: 'Retirer des favoris' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'AJOUTER' }));
    expect(screen.getByText('Ajouté au panier')).toBeInTheDocument();
  });

  it('affiche Modifier / Supprimer dans la version propriétaire', async () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    const { user } = renderWithProviders(<ProductCard product={vegeta} onEdit={handleEdit} onDelete={handleDelete} />);

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
    const { user } = renderWithProviders(
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

  it('convertit les valeurs saisies en champs de produit', async () => {
    const handleSubmit = vi.fn();
    const { user } = renderWithProviders(
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
        box: true,
        category: 'FIGURINE',
      }),
    );
  });

  it('pré-remplit le formulaire avec le produit à modifier', () => {
    renderWithProviders(
      <ProductForm initialProduct={vegeta} submitLabel="Enregistrer" onSubmit={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.getByLabelText(/Titre/)).toHaveValue(vegeta.title);
    expect(screen.getByLabelText(/Tags/)).toHaveValue('articulée, shf, bandai, premium');
  });
});

describe('NavBar', () => {
  it('lance une recherche en ajoutant ?q= à l’adresse', async () => {
    const { user } = renderWithProviders(<NavBar />, { route: '/cart' });
    await user.type(screen.getByRole('searchbox', { name: 'Rechercher un produit' }), 'luffy{Enter}');
    expect(screen.getByTestId('current-location')).toHaveTextContent('/?q=luffy');
  });

  it('ouvre le menu des catégories au clavier et le ferme avec Échap', async () => {
    const { user } = renderWithProviders(<NavBar />);
    const categoriesButton = screen.getByRole('button', { name: 'CATEGORIES' });

    categoriesButton.focus();
    await user.keyboard('{Enter}');
    expect(categoriesButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Statues' })).toBeVisible();

    await user.keyboard('{Escape}');
    expect(categoriesButton).toHaveAttribute('aria-expanded', 'false');
    expect(categoriesButton).toHaveFocus();
  });

  it('affiche Profil et Déconnexion quand l’utilisateur est connecté', async () => {
    loginAs(101);
    const { user } = renderWithProviders(<NavBar />);
    expect(screen.getByRole('link', { name: 'PROFIL' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Déconnexion' }));
    expect(screen.getByRole('link', { name: 'CONNEXION' })).toBeInTheDocument();
  });
});

describe('RequireAuth', () => {
  it('redirige vers la connexion si personne n’est connecté', () => {
    renderWithProviders(
      <RequireAuth>
        <p>Page privée</p>
      </RequireAuth>,
      { route: '/profile', path: '/profile' },
    );
    expect(screen.queryByText('Page privée')).not.toBeInTheDocument();
    expect(screen.getByTestId('current-location')).toHaveTextContent('/auth');
  });

  it('affiche la page si l’utilisateur est connecté', () => {
    loginAs(101);
    renderWithProviders(
      <RequireAuth>
        <p>Page privée</p>
      </RequireAuth>,
    );
    expect(screen.getByText('Page privée')).toBeInTheDocument();
  });
});
