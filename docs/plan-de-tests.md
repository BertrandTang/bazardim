# Plan de tests — Bazardim

Ce plan relie chaque fonctionnalité de l'application aux tests automatiques qui la vérifient.
Tous les tests sont lancés à chaque push par la CI GitHub Actions (`.github/workflows/ci.yml`),
qui échoue si un test échoue ou si la couverture du code passe sous 80 %.

| | Front-end | Back-end |
| --- | --- | --- |
| Outils | Vitest + React Testing Library (navigateur simulé : jsdom) | Vitest + supertest, sur une vraie base PostgreSQL de test |
| Lancer | `cd front && npm run test:coverage` | `cd back && npm run test:coverage` |
| Nombre de tests | 56 | 42 |
| Couverture des lignes | 92 % | 97 % |
| Emplacement | `front/src/**/*.test.js(x)` | `back/tests/*.test.js` |

Types de tests :

- **Unitaire** : une fonction isolée (calcul du prix, image d'un produit...).
- **Composant** : un composant React affiché seul ; on simule les actions de l'utilisateur (clic, saisie).
- **Intégration** : plusieurs couches ensemble (page + contextes + routeur, ou route API + base de données).

---

## Front-end

| Fonctionnalité | Scénario | Résultat attendu | Type | Fichier |
| --- | --- | --- | --- | --- |
| Catalogue | Ouvrir l'accueil | 11 produits et un titre `<h1>` | Intégration | `pages/pages.test.jsx` |
| Catalogue | Ouvrir une catégorie (Statues) | Seuls les produits de la catégorie | Intégration | `pages/pages.test.jsx` |
| Recherche | Taper « luffy » + Entrée dans la barre | Adresse `/?q=luffy` | Composant | `components/components.test.jsx` |
| Recherche | Ouvrir `/?q=vegeta` | « 1 résultat(s) pour « vegeta » » | Intégration | `pages/pages.test.jsx` |
| Recherche | Licence inconnue | Message « Aucun produit ne correspond » | Intégration | `pages/pages.test.jsx` |
| Navigation | Menu Catégories : Entrée puis Échap | Menu ouvert puis fermé, focus rendu au bouton | Composant | `components/components.test.jsx` |
| Navigation | Adresse inexistante | Page 404 avec lien vers l'accueil | Composant | `pages/pages.test.jsx` |
| Connexion | Mauvais mot de passe | Message d'erreur | Intégration | `pages/pages.test.jsx` |
| Connexion | Bons identifiants | Redirection vers le profil | Intégration | `pages/pages.test.jsx` |
| Connexion | Page privée sans être connecté | Redirection vers `/auth` | Composant | `components/components.test.jsx` |
| Inscription | Mot de passe < 8 caractères / différent / email déjà pris | Message d'erreur adapté | Intégration | `pages/pages.test.jsx` |
| Inscription | Formulaire valide | Compte créé, redirection vers le profil | Intégration | `pages/pages.test.jsx` |
| Fiche produit | Ouvrir `/product/FIG001` | Caractéristiques + données structurées schema.org | Intégration | `pages/pages.test.jsx` |
| Fiche produit | Identifiant inconnu | « Produit introuvable » | Intégration | `pages/pages.test.jsx` |
| Vente | Formulaire vide / prix nul | Message d'erreur, rien n'est envoyé | Composant | `components/components.test.jsx` |
| Vente | Formulaire valide | Annonce créée, ouverture de sa page | Intégration | `pages/pages.test.jsx` |
| Modification | Le propriétaire modifie le titre | Nouveau titre affiché | Intégration | `pages/pages.test.jsx` |
| Suppression | Le propriétaire supprime son annonce | Retour au profil | Intégration | `pages/pages.test.jsx` |
| Favoris | Clic sur le cœur | Bouton « Retirer des favoris » activé | Composant | `components/components.test.jsx` |
| Favoris | Changement d'utilisateur | Chaque utilisateur a ses propres favoris | Unitaire | `context/contexts.test.jsx` |
| Panier | Ajouter, +, −, retirer, vider | Quantités et total recalculés | Intégration | `pages/pages.test.jsx` |
| Panier | Produit supprimé entre-temps | Il disparaît du panier | Unitaire | `context/contexts.test.jsx` |
| Livraison (API tierce) | Taper une adresse | Suggestions de l'API Adresse (BAN), adresse choisie enregistrée | Composant | `components/AddressAutocomplete/...test.jsx` |
| Livraison (API tierce) | API indisponible | Message d'erreur, saisie libre possible | Composant | `components/AddressAutocomplete/...test.jsx` |
| Livraison (API tierce) | Moins de 3 caractères | Aucun appel à l'API | Composant | `components/AddressAutocomplete/...test.jsx` |
| Profil | Modifier son pseudo | « Profil mis à jour » | Intégration | `pages/pages.test.jsx` |
| Profil | Onglets produits / likes / avis | Bonnes listes affichées | Intégration | `pages/pages.test.jsx` |
| Avis | Publier un avis sur un vendeur | Avis affiché, note moyenne mise à jour | Intégration | `pages/pages.test.jsx` |
| Avis | Avis d'un autre utilisateur | Pas de bouton Modifier | Composant | `components/components.test.jsx` |
| Avis | L'auteur modifie puis supprime | Avis modifié puis supprimé | Composant | `components/components.test.jsx` |
| RGPD | Profil public d'un vendeur | L'email n'est pas affiché | Intégration | `pages/pages.test.jsx` |
| Outils | Sauvegarde locale, prix, images | Valeurs attendues, y compris sauvegarde corrompue | Unitaire | `hooks/`, `utils/` |

## Back-end (API)

| Fonctionnalité | Scénario | Résultat attendu | Fichier |
| --- | --- | --- | --- |
| Inscription | Données valides | 201, cookie `httpOnly`, pas de mot de passe renvoyé | `auth.test.js` |
| Inscription | Email ou pseudo déjà pris | 409 avec message clair | `auth.test.js` |
| Inscription | Champs invalides | 400 avec la liste des champs en erreur | `auth.test.js` |
| Connexion | Bon / mauvais mot de passe, email inconnu | 200 / 401 (même message dans les deux cas d'échec) | `auth.test.js` |
| Session | Sans cookie, jeton falsifié, après déconnexion | 401 | `auth.test.js` |
| Produits | Créer une annonce | 201, appartient à l'utilisateur connecté | `products.test.js` |
| Produits | Prix négatif, catégorie inconnue, image `javascript:` | 400 | `products.test.js` |
| Produits | Filtres catégorie, licence, recherche, vendeur, pagination | Seuls les bons produits | `products.test.js` |
| Produits | Modifier / supprimer l'annonce d'un autre | 403 | `products.test.js` |
| Produits | Un administrateur supprime une annonce | 204 (modération) | `products.test.js` |
| Avis | Se noter soi-même, vendeur inexistant, note hors 1-5 | 400 / 404 / 400 | `reviews.test.js` |
| Avis | Note moyenne d'un vendeur | Moyenne exacte | `reviews.test.js` |
| Avis | Modifier l'avis d'un autre | 403 | `reviews.test.js` |
| Favoris | Liker deux fois, retirer | Pas de doublon, retrait effectif | `likes.test.js` |
| Compte | Changer de mot de passe ou d'email sans le mot de passe actuel | 403 | `users.test.js` |
| Compte | Envoyer `role: admin` | 400 (champ refusé) | `users.test.js` |
| Compte (RGPD) | Supprimer son compte | Compte, annonces et session supprimés | `users.test.js` |
| Sécurité | En-têtes HTTP, CORS | `nosniff`, origine autorisée = front uniquement | `users.test.js` |

## Ce qui n'est pas (encore) couvert

- Tests de bout en bout dans un vrai navigateur (Playwright) : parcours achat complet.
- Tests d'accessibilité avec un lecteur d'écran (VoiceOver, NVDA) : à faire manuellement.
- Le paiement (Stripe), pas encore développé.
