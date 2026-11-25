# Présentation détaillée du projet Bazardim

Bazardim est une **marketplace de figurines d'occasion entre particuliers**, sur le modèle de Vinted :
chacun peut mettre en vente ses figurines, en acheter d'autres, les mettre en favoris et contacter les vendeurs.

Ce document explique le projet de bout en bout : les deux parties (front et back), chaque dépendance
et à quoi elle sert, le fonctionnement des modules importants et les commandes utiles.

---

## Sommaire

- [Vue d'ensemble](#vue-densemble)
- [Partie 1 — Le front-end (React)](#partie-1--le-front-end-react)
  - [Dépendances du front](#dépendances-du-front)
  - [Organisation du code front](#organisation-du-code-front)
  - [Fonctionnement : démarrage, routes, contextes](#fonctionnement--démarrage-routes-contextes)
  - [Composants et pages](#composants-et-pages)
  - [Communication avec l'API](#communication-avec-lapi)
  - [Sécurité, SEO, accessibilité et performance](#sécurité-seo-accessibilité-et-performance)
  - [Tests du front](#tests-du-front)
  - [Commandes utiles du front](#commandes-utiles-du-front)
- [Partie 2 — Le back-end (API Node.js)](#partie-2--le-back-end-api-nodejs)
  - [Dépendances du back](#dépendances-du-back)
  - [Organisation du code back (MVC)](#organisation-du-code-back-mvc)
  - [Le trajet d'une requête : les middlewares](#le-trajet-dune-requête--les-middlewares)
  - [Les modules importants](#les-modules-importants)
  - [La base de données](#la-base-de-données)
  - [Les routes de l'API](#les-routes-de-lapi)
  - [L'administration](#ladministration)
  - [Tests du back](#tests-du-back)
  - [Commandes utiles du back](#commandes-utiles-du-back)
  - [⭐ Installer le projet avec Docker](#-installer-le-projet-avec-docker)
  - [⭐ Accéder à la base de données](#-accéder-à-la-base-de-données)
- [Partie commune : qualité et CI](#partie-commune--qualité-et-ci)

---

## Vue d'ensemble

```
 Navigateur                       Serveur                              Services externes
┌──────────────────┐   HTTP    ┌───────────────────────┐   SQL    ┌──────────────────┐
│  Front React     │ ────────► │  API Express (Node)   │ ───────► │  PostgreSQL      │
│  (Vite, MUI)     │  JSON +   │  port 3000            │          │  (Docker)        │
│  port 5173       │  cookie   │                       │          └──────────────────┘
└──────────────────┘ ◄──────── │                       │ ───────► Stripe (paiement)
        │                      └───────────────────────┘
        └──────────────────────────────────────────────────────────► API Adresse de l'État
                                                                     (autocomplétion d'adresse)
```

| Partie | Technologies | Rôle |
| --- | --- | --- |
| **Front** (`front/`) | React 19, Vite 7, Material UI 7, React Router 7 | Ce que voit l'utilisateur : pages, formulaires, panier |
| **Back** (`back/`) | Node.js 22, Express 5, PostgreSQL 17, zod, Stripe | L'API REST : règles métier, sécurité, base de données, paiement |
| **Base de données** | PostgreSQL 17 dans Docker | Stockage des comptes, annonces, messages, commandes |

Les deux parties communiquent en **JSON** par une **API REST**. L'utilisateur connecté est reconnu grâce à
un **cookie** (jeton JWT) déposé par l'API.

---

# Partie 1 — Le front-end (React)

## Dépendances du front

Les dépendances sont listées dans `front/package.json`. `npm install` les télécharge dans `node_modules/`.

### Dépendances de l'application (`dependencies`)

Elles font partie du site livré aux visiteurs.

| Paquet | Rôle | Où il est utilisé |
| --- | --- | --- |
| **react** | La bibliothèque d'interface : on décrit l'écran avec des **composants** (fonctions qui renvoient du JSX), React met la page à jour quand les données changent. | Partout |
| **react-dom** | Fait le lien entre React et la page HTML du navigateur (`createRoot(...).render(...)`). | `src/main.jsx` |
| **react-router-dom** | Le **routage** : associe une adresse (`/product/12`) à une page, sans recharger le site. Fournit `<Link>`, `useNavigate`, `useParams`, `useSearchParams`. | `src/App.jsx`, toutes les pages |
| **@mui/material** | **Material UI** : bibliothèque de composants prêts à l'emploi (boutons, champs de formulaire, onglets, fenêtres de dialogue, autocomplétion). | Formulaires, profil, panier, pop-up de suppression |
| **@mui/icons-material** | Les icônes Material (ex : l'œil pour afficher le mot de passe). | `components/PasswordField` |
| **@emotion/react**, **@emotion/styled** | Le moteur de styles utilisé **en interne** par Material UI (obligatoire avec MUI, on ne l'utilise pas directement). | Indirectement, via MUI |

### Outils de développement (`devDependencies`)

Ils servent à développer, tester et construire le site, mais ne sont pas envoyés aux visiteurs.

| Paquet | Rôle |
| --- | --- |
| **vite** | Le serveur de développement (rechargement instantané à chaque modification) et l'outil de **build** qui produit le site optimisé dans `dist/`. |
| **@vitejs/plugin-react** | Permet à Vite de comprendre le JSX et active le rechargement à chaud des composants React. |
| **vitest** | Le lanceur de **tests** (même configuration que Vite). |
| **@vitest/coverage-v8** | Calcule la **couverture de code** des tests (seuil minimal : 50 %, exigé par la grille). |
| **jsdom** | Simule un navigateur (document, fenêtre, localStorage) dans Node.js, pour les tests. |
| **@testing-library/react** | Affiche un composant dans les tests et le cherche « comme un utilisateur » (par son texte, son rôle). |
| **@testing-library/user-event** | Simule les actions de l'utilisateur dans les tests : clics, frappe au clavier. |
| **@testing-library/jest-dom** | Ajoute des vérifications lisibles : `toBeInTheDocument()`, `toBeDisabled()`… |
| **eslint**, **@eslint/js**, **globals** | L'**analyse statique** : détecte les erreurs et mauvaises pratiques sans lancer le code. |
| **eslint-plugin-react-hooks** | Vérifie les règles des hooks React (ex : dépendances de `useEffect`). |
| **eslint-plugin-react-refresh** | Vérifie que les fichiers restent compatibles avec le rechargement à chaud. |
| **prettier** | Le **formatage** automatique du code (indentation, guillemets, longueur des lignes). |

## Organisation du code front

```
front/
├── index.html              Page HTML unique (SPA) : React s'affiche dans <div id="root">
├── vite.config.js          Configuration de Vite : proxy vers l'API, CSP, tests
├── public/                 Fichiers servis tels quels : images de démo, robots.txt, icône
├── src/
│   ├── main.jsx            Point d'entrée : affiche <App /> dans la page
│   ├── App.jsx             Les Providers (contextes) et toutes les routes
│   ├── index.css           Styles globaux, couleurs de la charte (variables CSS) et décor de fond
│   ├── theme.js            Thème Material UI : les couleurs de la charte pour les composants MUI
│   ├── pages/              Une page = un dossier (Home, Product, Cart, Profile...)
│   ├── components/         Composants réutilisables (NavBar, ProductCard, PasswordField...)
│   ├── context/            Données partagées par toute l'application (compte, panier, favoris...)
│   ├── services/           Appels réseau : notre API (api.js) et l'API Adresse (addressApi.js)
│   ├── hooks/              Hook maison : useLocalStorageState
│   ├── utils/              Petites fonctions : prix, dates, frais de service, redirection
│   └── data/               Données fixes : catégories, informations légales
└── tests/                  Tests automatiques + fausse API utilisée pendant les tests
```

## Fonctionnement : démarrage, routes, contextes

### 1. Le démarrage

1. Le navigateur charge `index.html`, qui charge `src/main.jsx`.
2. `main.jsx` affiche le composant `<App />` dans `<div id="root">`, entouré de `ThemeProvider` (le thème MUI de `theme.js`).
3. `App.jsx` entoure l'application de ses **Providers** (contextes) puis déclare les **routes**.
4. `Layout` affiche autour de chaque page : la barre de navigation, la page, le pied de page.

### 2. Les routes (`App.jsx`)

| Adresse | Page | Accès |
| --- | --- | --- |
| `/` , `/figurines`, `/figurines-articulees`, `/statue`, `/licences` | `Home` : liste des annonces en vente, filtrée par catégorie, licence ou recherche (`?q=...`) | Tout le monde |
| `/product/:id` | `Product` : fiche d'une annonce (modification et suppression pour son vendeur) | Tout le monde |
| `/user/:id` | `UserProfile` : profil public d'un vendeur et ses annonces | Tout le monde |
| `/cart` | `Cart` : panier, destinataire (nom, téléphone, adresse), total avec frais de service | Tout le monde (connexion pour payer) |
| `/auth`, `/signup` | Connexion, inscription | Tout le monde |
| `/vendre` | `Sell` : mettre une annonce en vente | Connecté |
| `/profile` | `Profile` : onglets Profil, Mes produits, Mes likes, Mes commandes | Connecté |
| `/messages` | `Messages` : messages reçus et envoyés | Connecté |
| `/admin/licences` | `AdminLicences` : modération des licences saisies par les vendeurs | Administrateur |
| `/commande/confirmation` | Retour du paiement Stripe | Connecté |
| `/comment-ca-marche` | `HowItWorks` : tutoriel pour vendre et acheter, et pourquoi le titre est automatique | Tout le monde |
| `/mentions-legales`, `/confidentialite`, `/conditions-generales` | Pages légales | Tout le monde |
| toute autre adresse | `NotFound` (erreur 404) | Tout le monde |

- Les pages réservées sont entourées de `<RequireAuth>` : un visiteur est envoyé vers `/auth`,
  puis ramené à la page demandée après sa connexion.
- Les pages sont **chargées à la demande** (`React.lazy`) : le code d'une page n'est téléchargé que si
  on l'ouvre. Pendant ce temps, `<Suspense>` (dans `Layout`) affiche « Chargement… ».

### 3. Les contextes : les données partagées

Un **contexte** React rend une donnée accessible à n'importe quel composant, sans la passer de parent en enfant.
Chaque contexte a un **Provider** (qui détient les données, déclaré dans `App.jsx`) et un **hook** pour les lire.

| Contexte | Hook | Contenu | D'où viennent les données |
| --- | --- | --- | --- |
| `AuthContext` | `useAuth()` | Utilisateur connecté, `login`, `logout`, `register`, `updateAccount`, `deleteAccount` | API (`/api/auth/me` au chargement) |
| `ProductsContext` | `useProducts()` | Toutes les annonces, les annonces encore en vente, les licences ; ajouter, modifier, supprimer | API (`/api/products`) |
| `CartContext` | `useCart()` | Annonces du panier, total, ajouter / retirer / vider | **localStorage** (identifiants des annonces) |
| `LikesContext` | `useLikes()` | Annonces en favoris, `toggleLike` | API (`/api/likes`) |
| `MessagesContext` | `useMessages()` | Nombre de messages non lus (pastille rouge) | API (`/api/messages/unread-count`) |

L'ordre des Providers compte : le panier a besoin des annonces, les favoris ont besoin de l'utilisateur connecté.

**Le hook `useLocalStorageState`** (`hooks/`) fonctionne comme `useState`, mais sauvegarde la valeur dans le
localStorage du navigateur : le panier et l'adresse de livraison survivent ainsi à un rechargement de la page,
même sans être connecté.

## Composants et pages

### Composants réutilisables (`src/components/`)

| Composant | Rôle |
| --- | --- |
| `Layout` | Structure commune : lien « Aller au contenu » (accessibilité), barre de navigation, page, pied de page |
| `NavBar` (+ `NavBarDropdown`, `NavBarIcons`) | Logo, recherche, menus Catégories / Licences (souris, doigt et clavier), lien « Comment ça marche ? », liens du compte, pastille des messages, panier. Mise en page en **grille CSS** sur deux lignes (une seule colonne réorganisée sur téléphone), sans défilement horizontal |
| `Footer` | Copyright et liens vers les pages légales |
| `ProductCard` | Carte d'une annonce : image, bandeau « Vendu », étiquettes, prix, cœur des favoris, bouton panier ; côté vendeur : Modifier / Supprimer, acheteur, adresse et bouton « Marquer comme expédié » |
| `ProductForm` | Formulaire d'annonce, utilisé pour la mise en vente **et** pour la modification |
| `ImageUploadField` | Choix d'une image sur l'appareil, envoi à l'API et aperçu |
| `AddToCartButton` | « Ajouter » au panier (désactivé « Dans le panier » si déjà ajouté) |
| `AddressAutocomplete` | Champ d'adresse avec suggestions de l'API Adresse de l'État |
| `OrderSummary` | Récapitulatif d'une commande : articles, suivi d'expédition, frais, total |
| `MessageForm` | Formulaire d'envoi d'un message |
| `PasswordField` | Champ mot de passe avec l'œil pour afficher / masquer |
| `DeleteAccountDialog` | Pop-up de suppression du compte (écrire « SUPPRIMER » + mot de passe) |
| `RequireAuth` | Protège une page : redirige un visiteur vers la connexion |
| `SellerLink` | Pastille avec l'initiale et le pseudo d'un vendeur, lien vers son profil |
| `PageMetadata` | Titre de l'onglet, description, balises Open Graph et `noindex` (SEO), propres à chaque page |

### Utilitaires (`src/utils/`, `src/data/`)

| Fichier | Rôle |
| --- | --- |
| `productHelpers.js` | `formatPrice` (« 59.99 € »), `getProductImage` (image ou image de démo) |
| `productTitle.js` | Aperçu du titre automatique de l'annonce (« Type – Personnage (Édition Ver.) », ou le fabricant). Le vrai calcul est fait par l'API. |
| `serviceFee.js` | Calcul **affiché** des frais de service (0,70 € + 5 %). Le vrai calcul est fait par l'API. |
| `formatDate.js` | Date au format français « 23/11/2026 » |
| `redirect.js` | Redirection complète (vers Stripe, ou rechargement après suppression du compte) |
| `data/categories.js` | Les 3 catégories : valeur en base, libellé, adresse de la page |
| `data/legalInformation.js` | Éditeur, contact et hébergeur affichés sur les pages légales |

## Communication avec l'API

Tous les appels à notre API sont réunis dans **`src/services/api.js`** :

- une fonction `request()` fait le `fetch`, avec `credentials: 'include'` pour **envoyer le cookie de connexion** ;
- elle transforme les erreurs de l'API (`{ "error": "..." }`) en message lisible, affiché dans les formulaires ;
- un serveur injoignable donne un message clair (« Impossible de joindre le serveur »).

**Le proxy de Vite** (`vite.config.js`) : en développement, le front tourne sur le port 5173 et l'API sur le 3000.
Vite transmet à l'API toutes les requêtes `/api`, `/uploads` et `/sitemap.xml`. Pour le navigateur, tout vient
de la même adresse : pas de problème de CORS ni de cookie.

**L'API tierce** : `src/services/addressApi.js` interroge l'**API Adresse** de l'État (data.gouv.fr) pour proposer
des adresses de livraison existantes pendant la frappe (avec un délai pour ne pas envoyer une requête par lettre,
et l'annulation des requêtes devenues inutiles).

## Sécurité, SEO, accessibilité et performance

| Thème | Ce qui est en place |
| --- | --- |
| **Sécurité** | Aucun mot de passe ni jeton dans le localStorage (cookie `httpOnly` illisible par le JavaScript) ; **CSP** ajoutée au build par un petit plugin dans `vite.config.js` (seuls les scripts du site et les appels vers notre API et l'API Adresse sont autorisés) ; React échappe automatiquement le texte affiché (protection XSS) |
| **SEO** | `lang="fr"`, titre et description par page (`PageMetadata`), Open Graph, `robots.txt`, `sitemap.xml` généré par l'API, données structurées **schema.org Product** sur la fiche produit. Lighthouse SEO : 100 sur les pages publiques |
| **Accessibilité** | Un `<h1>` par page, lien « Aller au contenu », menus utilisables au clavier, contrastes WCAG AA, libellés ARIA. Lighthouse accessibilité : 100. **Fond décoratif** (`body::before` dans `index.css`) : pastels assez clairs pour que tout texte garde au moins 4,5:1, y compris au survol ; supprimé si l'utilisateur demande plus de contraste (`prefers-contrast: more`) ou utilise un mode de couleurs forcées. **Thème MUI** (`theme.js`) : le bleu par défaut de Material UI (4:1 sur le fond pastel) est remplacé par le violet de la charte (au moins 5,6:1 partout) |
| **Performance / éco-conception** | Pages chargées à la demande (`React.lazy`), photos envoyées limitées à 2 Mo, images chargées seulement quand elles deviennent visibles (`loading="lazy"`) ; les photos du jeu de démonstration ont été réduites à la main (41 Mo → 2,3 Mo), celles des vendeurs ne sont pas encore compressées automatiquement |
| **Responsive** | Toutes les pages vérifiées à 320, 375 et 1280 px de large |

## Tests du front

- **Outils** : Vitest + React Testing Library + jsdom. **103 tests**, environ **90 % de couverture**.
- **La fausse API** (`tests/fakeApi.js`) : pendant les tests, `src/services/api.js` est remplacé (`vi.mock` dans
  `tests/setup.js`) par une version qui travaille sur des données en mémoire (`tests/fixtures.js`).
  Les tests du front ne dépendent donc ni du serveur, ni de la base de données.
- **`renderWithProviders`** affiche une page avec tous les contextes et le routeur, comme dans la vraie application.
- Le plan de tests (scénario → résultat attendu) est dans [`docs/plan-de-tests.md`](plan-de-tests.md).

## Commandes utiles du front

À lancer dans le dossier `front/` :

| Commande | Rôle |
| --- | --- |
| `npm install` | Installe les dépendances (à faire une fois, et après chaque changement de `package.json`) |
| `npm run dev` | Lance le site en développement sur **http://localhost:5173** (l'API doit tourner aussi) |
| `npm run build` | Construit le site optimisé pour la production dans `dist/` (avec la CSP) |
| `npm run preview` | Sert le build de production en local sur http://localhost:4173 |
| `npm test` | Lance les tests une fois |
| `npm run test:watch` | Relance les tests à chaque modification |
| `npm run test:coverage` | Tests + rapport de couverture (`coverage/index.html`), échoue sous 50 % |
| `npm run lint` | Analyse statique (ESLint) |
| `npm run format` / `npm run format:check` | Formate le code / vérifie le formatage (Prettier) |

Audit Lighthouse (après `npm run build && npm run preview`) :
`npx lighthouse http://localhost:4173 --view --only-categories=performance,accessibility,best-practices,seo`

---

# Partie 2 — Le back-end (API Node.js)

## Dépendances du back

Listées dans `back/package.json`.

### Dépendances de l'API (`dependencies`)

| Paquet | Rôle | Où il est utilisé |
| --- | --- | --- |
| **express** | Le **framework web** : crée le serveur, associe une route (`GET /api/products`) à une fonction, enchaîne les middlewares. La version 5 transmet automatiquement les erreurs des fonctions `async` au gestionnaire d'erreurs. | `src/app.js`, `src/routes/` |
| **pg** | Le **client PostgreSQL** : ouvre un « pool » de connexions et exécute les requêtes SQL **paramétrées** (`$1`, `$2`). | `src/config/database.js`, `src/models/` |
| **zod** | La **validation** des données reçues : on décrit la forme attendue (types, longueurs, formats) et zod refuse tout le reste avec un message par champ. Messages en français. | `src/validators/`, `src/config/config.js` |
| **bcryptjs** | Le **hachage des mots de passe** : on ne stocke jamais un mot de passe, seulement son empreinte (coût 12). | `src/utils/passwords.js` |
| **jsonwebtoken** | Crée et vérifie les **jetons JWT** de connexion (signés avec `JWT_SECRET`, valables 7 jours). | `src/middlewares/authentication.js` |
| **cookie-parser** | Lit les cookies de la requête (`request.cookies`), pour retrouver le jeton de connexion. | `src/app.js` |
| **helmet** | Ajoute des **en-têtes HTTP de sécurité** (`X-Content-Type-Options: nosniff`, protection contre le clickjacking, CSP de l'API...). | `src/app.js` |
| **cors** | Le **CORS** : seul notre front a le droit d'appeler l'API depuis un navigateur. | `src/app.js` |
| **express-rate-limit** | **Limite les tentatives** de connexion et d'inscription (20 par quart d'heure) contre les attaques par force brute. | `src/routes/auth.routes.js` |
| **multer** | Reçoit les **fichiers envoyés** (images) au format `multipart/form-data`, vérifie le type et la taille. | `src/middlewares/imageUpload.js` |
| **stripe** | Le SDK officiel **Stripe** : crée les pages de paiement (Checkout), vérifie les paiements et la signature des webhooks. | `src/config/stripe.js`, `src/controllers/orders.controller.js` |
| **winston** | La **journalisation** : messages avec date et niveau (info, warn, error), affichés dans le terminal ; erreurs écrites dans `logs/errors.log`. | `src/config/logger.js` |
| **swagger-ui-express** | Affiche la **documentation interactive** de l'API (Swagger) à partir de la description OpenAPI. | `src/app.js`, `src/docs/openapi.js` |

### Outils de développement (`devDependencies`)

| Paquet | Rôle |
| --- | --- |
| **vitest** + **@vitest/coverage-v8** | Lanceur de tests et couverture de code (seuil de 50 %) |
| **supertest** | Envoie de vraies requêtes HTTP à l'application Express pendant les tests, sans démarrer de serveur |
| **eslint**, **@eslint/js**, **globals** | Analyse statique |
| **prettier** | Formatage du code |

Node.js 22 fournit aussi directement : `--env-file` (lecture du `.env` sans dépendance), `--watch`
(redémarrage automatique), `crypto.randomUUID` (noms des images), `fetch`.

## Organisation du code back (MVC)

```
back/
├── Dockerfile              Image Docker de l'API pour la production
├── database/
│   ├── schema.sql          Toutes les tables, contraintes, index et la vue product_details
│   ├── seed.js + seed-data/  Données de démonstration (utilisateurs, figurines)
│   ├── reset.js            Script de `npm run db:reset`
│   └── docker-init/        Crée la base de test au premier démarrage de Docker
├── src/
│   ├── server.js           Démarre le serveur HTTP (et l'arrête proprement)
│   ├── app.js              Les middlewares, dans l'ordre, et le branchement des routes
│   ├── config/             Variables d'environnement (config.js), PostgreSQL (database.js),
│   │                       journal (logger.js), Stripe (stripe.js)
│   ├── routes/             Adresse → fonction du contrôleur (une ressource par fichier)
│   ├── controllers/        Règles métier : droits, codes HTTP, réponse JSON
│   ├── validators/         Schémas zod des données reçues
│   ├── models/             Requêtes SQL (une ressource par fichier)
│   ├── middlewares/        Authentification, journal des requêtes, images, erreurs
│   ├── utils/              Hachage, classe HttpError, frais de service
│   └── docs/openapi.js     Description OpenAPI de toutes les routes (Swagger)
└── tests/                  Un fichier de test par ressource
```

**MVC** (Modèle – Vue – Contrôleur) : le **modèle** parle à la base, le **contrôleur** applique les règles,
la **vue** est ici le JSON renvoyé au front. Chaque dossier a une seule responsabilité.

## Le trajet d'une requête : les middlewares

Un **middleware** Express est une fonction `(request, response, next)` exécutée pour chaque requête :
elle peut lire ou modifier la requête, répondre elle-même, ou passer la main au suivant avec `next()`.
Ils sont déclarés dans `src/app.js`, **dans cet ordre** :

| Ordre | Middleware | Rôle |
| --- | --- | --- |
| 1 | `helmet()` | Ajoute les en-têtes de sécurité à toutes les réponses |
| 2 | `cors({ origin: FRONT_URL, credentials: true })` | N'autorise que le front, avec ses cookies |
| 3 | `requestLogger` (maison) | Écrit une ligne par requête avec winston : `GET /api/products → 200 (12 ms)` (info, warn pour un 4xx, error pour un 5xx) |
| 4 | `express.raw` sur `/api/stripe/webhook` | **Avant** `express.json` : Stripe a besoin du corps brut pour vérifier sa signature |
| 5 | `express.json({ limit: '100kb' })` | Transforme le corps JSON en objet (`request.body`), refuse les envois géants |
| 6 | `cookieParser()` | Remplit `request.cookies` |
| 7 | Routes : `/api/health`, `/sitemap.xml`, `/api/docs`, `/api/auth`, `/api/users`, `/api/likes`, `/api/messages`, `/api/orders`, `/api/uploads`, `/uploads` (images), `/api/products` | Le travail demandé |
| 8 | `notFoundHandler` | Aucune route ne correspond : 404 |
| 9 | `errorHandler` | **Toujours en dernier** : transforme toute erreur en réponse JSON propre |

Certaines routes ajoutent leurs propres middlewares :

- **`requireAdmin`** (`middlewares/authentication.js`, après `requireAuth`) : réserve une route aux administrateurs (sinon **403**).
- **`requireAuth`** (`middlewares/authentication.js`) : lit le cookie `bazardim_token`, vérifie le jeton JWT
  (signature et expiration), relit l'utilisateur en base et le place dans `request.user`. Sinon : **401**.
- **`uploadImage`** (`middlewares/imageUpload.js`, multer) : accepte une seule image JPEG, PNG ou WebP de 2 Mo
  maximum, l'enregistre dans `back/uploads/` sous un **nom aléatoire** (jamais celui choisi par l'utilisateur).
- **`authenticationRateLimiter`** (express-rate-limit) : 20 tentatives par quart d'heure sur la connexion et l'inscription.

**Exemple complet**, `PUT /api/products/12` (modifier une annonce) :

```
helmet → cors → requestLogger → express.json → cookieParser
  → route PUT /api/products/:id
  → requireAuth              (qui est connecté ?            sinon 401)
  → contrôleur updateProduct
      → idSchema / productSchema (zod)    (données valides ?        sinon 400)
      → findProductById (modèle, SQL)      (l'annonce existe ?       sinon 404)
      → isOwnerOrAdmin                     (c'est la sienne ?        sinon 403)
      → sold_at ?                          (déjà vendue ?            sinon 409)
      → updateProductById (modèle, SQL)
  → réponse JSON 200
(en cas d'erreur à n'importe quelle étape → errorHandler → { "error": "message" })
```

## Les modules importants

### Configuration validée (`config/config.js`)

Au démarrage, toutes les variables d'environnement sont **validées avec zod**. Si l'une manque ou est invalide
(ex : `JWT_SECRET` trop court, clé Stripe qui n'est pas une clé de test), l'API **refuse de démarrer** avec un
message clair, au lieu de planter plus tard.

| Variable (`back/.env`) | Rôle |
| --- | --- |
| `DATABASE_URL` | Adresse de la base PostgreSQL de développement |
| `TEST_DATABASE_URL` | Base des tests automatiques (nom obligatoirement terminé par `_test`) |
| `JWT_SECRET` | Clé secrète qui signe les jetons de connexion (32 caractères minimum) |
| `FRONT_URL` | Adresse du front (CORS, redirections Stripe, sitemap) |
| `SEED_DEMO_PASSWORD` | Mot de passe des comptes de démonstration |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (uniquement `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook Stripe (facultatif en local) |
| `PORT`, `NODE_ENV`, `UPLOAD_DIRECTORY` | Facultatifs (3000, development, `back/uploads/`) |

### Connexion à la base (`config/database.js`)

- Un **pool** de connexions réutilisées (plus rapide qu'une connexion par requête).
- `query(sql, parameters)` : les valeurs sont **toujours** passées à part (`$1`, `$2`) → protection contre
  l'**injection SQL**.
- `withTransaction(...)` : plusieurs requêtes en **transaction** (tout ou rien). Ex : une commande et ses articles,
  ou « commande payée + annonces vendues ».

### Authentification (`middlewares/authentication.js`)

- À la connexion, l'API signe un **jeton JWT** (contenant l'identifiant de l'utilisateur) et le dépose dans le
  cookie `bazardim_token` : **httpOnly** (illisible par le JavaScript de la page), **SameSite=Lax** (protection CSRF),
  **secure** en production (HTTPS uniquement), valable 7 jours.
- `requireAuth` protège une route ; `findLoggedInUser` renvoie l'utilisateur ou `null` (route `/api/auth/me`).
- `isOwnerOrAdmin` : seul le propriétaire (ou un administrateur) peut modifier ou supprimer une ressource.

### Gestion des erreurs (`middlewares/errorHandler.js`, `utils/errors.js`)

Les contrôleurs lancent une `HttpError(code, message)`, par exemple `throw new HttpError(404, 'Produit introuvable.')`.
Le gestionnaire central traduit aussi les erreurs connues :

| Erreur | Réponse |
| --- | --- |
| `HttpError` | Son code et son message |
| Validation zod | 400 + le détail par champ |
| multer (image trop lourde...) | 400 |
| JSON mal formé | 400 |
| Valeur déjà utilisée en base (email, pseudo) | 409 |
| Toute autre erreur | **500** avec un message générique, et le détail **uniquement dans les logs** (jamais de SQL ni de pile d'appels envoyés au client) |

### Journalisation (`config/logger.js`, `middlewares/requestLogger.js`)

**winston** écrit chaque message avec sa date et son niveau : dans le terminal (en couleur) et, pour les erreurs,
dans `back/logs/errors.log`. Rien n'est écrit pendant les tests.

### Titre automatique des annonces (`utils/productTitle.js`)

Le vendeur ne choisit pas le titre : l'API le calcule à partir du **type**, du **personnage** et de l'**édition**
(ou du **fabricant** s'il n'y a pas d'édition), par exemple « Figurine – Roronoa Zoro (Wano Ver.) ».
Les titres sont ainsi homogènes et faciles à chercher. Le calcul est fait dans le validateur zod (`.transform`),
donc pour chaque création et modification ; un titre envoyé par le navigateur est ignoré. Le formulaire du front
affiche un **aperçu** avec le même calcul (`front/src/utils/productTitle.js`).

### Licences : normalisation, synonymes et modération (`utils/normalizeText.js`, `models/licences.model.js`)

Problème : sans contrôle, la même série finirait sous plusieurs noms (« One Piece », « one-piece », « Tensura » /
« Moi, quand je me réincarne en Slime »), ce qui pollue le menu Licences et casse la recherche.

Quand un vendeur saisit une licence, l'API la range ainsi :

1. elle compare le **nom normalisé** (minuscules, sans accents ni ponctuation : « ONE-PIECE » → « one piece ») ;
2. sinon, elle cherche un **synonyme** (table `licence_aliases` : « dbz » → Dragon Ball Z) ;
3. sinon, elle crée la licence **en attente** : l'annonce est publiée, mais la licence n'entre dans le menu
   qu'après validation par un administrateur.

Sur la page **`/admin/licences`** (lien « MODÉRATION » de la barre de navigation, visible des administrateurs), l'admin peut
**valider**, **renommer** (l'ancien nom devient un synonyme) ou **fusionner** un doublon dans une licence existante :
ses annonces sont déplacées et son nom devient un synonyme. Le système « apprend » : la fois suivante, c'est automatique.
Les routes `/api/admin/...` sont protégées par `requireAuth` puis `requireAdmin` (403 pour un non-administrateur).

### Paiement (`controllers/orders.controller.js`, `utils/serviceFee.js`)

1. Le front envoie `POST /api/orders` avec les **identifiants** des annonces (jamais de prix) et le destinataire : nom, téléphone et adresse.
2. L'API relit les prix en base, calcule les **frais de service** (0,70 € + 5 %, en centimes pour éviter les erreurs
   d'arrondi) et enregistre la commande « en attente ».
3. Elle crée une **session Stripe Checkout** et renvoie son adresse : la carte est saisie **chez Stripe**,
   jamais sur nos serveurs.
4. Après le paiement, la commande passe à « payée » et les annonces à « vendues » (dans une transaction), de deux façons :
   le **webhook** signé de Stripe, ou la vérification auprès de Stripe à l'affichage de la page de confirmation.
5. Le vendeur voit ensuite l'acheteur, ainsi que le nom, le téléphone et l'adresse du destinataire, et indique l'expédition (`PATCH /api/orders/items/:id/shipped`).

### Documentation de l'API (`docs/openapi.js`)

Description **OpenAPI 3** de toutes les routes, affichée par Swagger sur **http://localhost:3000/api/docs**
(chaque route peut y être essayée avec « Try it out ») et disponible en JSON sur `/api/docs.json`.

## La base de données

PostgreSQL 17, schéma complet dans `back/database/schema.sql`.

| Table | Contenu | Liens |
| --- | --- | --- |
| `users` | Comptes : pseudo, email, empreinte du mot de passe, photo, rôle (`user` / `admin`) | |
| `licences` | Licences (One Piece, Naruto...) : nom affiché, nom **normalisé** (`UNIQUE`), statut `pending` / `approved` | |
| `licence_aliases` | Synonymes d'une licence (« dbz » → Dragon Ball Z), enregistrés normalisés | licences |
| `products` | Annonces : titre, description, prix, catégorie, caractéristiques, image, `sold_at` (date de vente) | `owner_id` → users, `licence_id` → licences |
| `tags`, `product_tags` | Étiquettes libres et leur lien avec les annonces (relation plusieurs-à-plusieurs) | |
| `likes` | Favoris : qui aime quelle annonce | users, products |
| `messages` | Messagerie : expéditeur, destinataire, annonce concernée, contenu, lu / non lu | users, products |
| `orders` | Commandes : acheteur, statut (`pending` / `paid`), total, frais de service, adresse, session Stripe | `buyer_id` → users |
| `order_items` | Articles d'une commande : titre et prix **copiés à l'achat**, date d'expédition | orders, products |
| vue `product_details` | Annonce + nom de la licence + pseudo du vendeur + liste des tags (évite de répéter ces jointures) | |

Les règles sont aussi vérifiées **par la base** : contraintes `CHECK` (prix positif, catégorie connue...),
`UNIQUE` (email, pseudo), clés étrangères avec `ON DELETE CASCADE` ou `SET NULL` (ex : un compte supprimé
efface ses annonces, mais ses commandes sont gardées sans lien avec lui, pour la comptabilité et le RGPD).

## Les routes de l'API

La liste complète, avec les paramètres et les réponses, est dans **Swagger** (http://localhost:3000/api/docs)
et dans [`back/README.md`](../back/README.md). En résumé :

| Ressource | Routes principales |
| --- | --- |
| Authentification | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Comptes | `GET /api/users/:id`, `PATCH /api/users/me`, `DELETE /api/users/me` |
| Annonces | `GET /api/products` (filtres, recherche, pagination), `GET/PUT/DELETE /api/products/:id`, `POST /api/products`, `GET /api/licences` |
| Administration | `GET /api/admin/licences`, `PATCH /api/admin/licences/:id`, `POST /api/admin/licences/:id/merge`, `POST/DELETE /api/admin/licences/:id/aliases` (administrateurs uniquement) |
| Favoris | `GET /api/likes`, `PUT/DELETE /api/likes/:productId` |
| Messagerie | `GET /api/messages/received`, `/sent`, `/unread-count`, `POST /api/messages`, `PATCH /api/messages/:id/read` |
| Commandes | `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`, `GET /api/orders/sales`, `PATCH /api/orders/items/:id/shipped`, `POST /api/stripe/webhook` |
| Images | `POST /api/uploads`, `GET /uploads/:fichier` |
| Divers | `GET /api/health`, `GET /sitemap.xml`, `GET /api/docs` |

## L'administration

### Qui est administrateur ?

Il n'y a **pas de table à part** pour les administrateurs : c'est la colonne `users.role`, qui vaut `'user'`
(par défaut) ou `'admin'` (contrainte `CHECK` dans `schema.sql`). Personne ne peut devenir admin depuis le site :
l'inscription crée toujours un `'user'`, et `PATCH /api/users/me` refuse un champ `role` (schéma zod strict : 400).

- **Compte de démo** : `admin@example.com`, mot de passe = `SEED_DEMO_PASSWORD` de `back/.env` (créé par `npm run db:seed`).
- **Donner le rôle à un compte existant**, directement en base (voir [Accéder à la base de données](#-accéder-à-la-base-de-données)) :

```sql
UPDATE users SET role = 'admin' WHERE email = 'quelquun@example.com';
-- et pour le retirer :
UPDATE users SET role = 'user'  WHERE email = 'quelquun@example.com';
```

Le changement est **immédiat**, sans se reconnecter : le jeton JWT ne contient que l'identifiant de l'utilisateur,
et `requireAuth` relit le compte (donc son rôle) en base à chaque requête.

### Comment l'API protège les routes d'administration

Deux protections différentes, selon le besoin :

| Mécanisme | Où | Effet |
| --- | --- | --- |
| `requireAuth` puis `requireAdmin` | `routes/admin.routes.js` : `router.use(requireAuth, requireAdmin)` | Toutes les routes `/api/admin/...` : **401** si non connecté, **403** « Réservé aux administrateurs. » si connecté sans être admin |
| `isOwnerOrAdmin(user, ownerId)` | `controllers/products.controller.js` | Modifier / supprimer une annonce : le **propriétaire** ou un **admin** (sinon 403) |

`router.use(...)` place les deux middlewares **devant toutes les routes du routeur** : impossible d'oublier la
protection en ajoutant une nouvelle route admin dans ce fichier.

### Les routes réservées aux administrateurs

| Méthode | Route | Corps (JSON) | Rôle |
| --- | --- | --- | --- |
| GET | `/api/admin/licences` | — | Toutes les licences (**en attente d'abord**), avec leur nombre d'annonces et leurs synonymes |
| PATCH | `/api/admin/licences/:id` | `{ "name": "One Piece" }` et/ou `{ "status": "approved" }` | **Renommer** (l'ancien nom devient un synonyme) et/ou **valider** une licence |
| POST | `/api/admin/licences/:id/merge` | `{ "target_licence_id": 3 }` | **Fusionner** un doublon dans une autre licence : ses annonces y sont déplacées, son nom devient un synonyme, puis il est supprimé |
| POST | `/api/admin/licences/:id/aliases` | `{ "alias": "DBZ" }` | **Ajouter un synonyme** (abréviation, traduction...) |
| DELETE | `/api/admin/licences/:id/aliases/:alias` | — | **Supprimer un synonyme** |

Et les routes ordinaires où l'admin a **plus de droits** qu'un utilisateur :

| Méthode | Route | Ce que l'admin peut faire en plus |
| --- | --- | --- |
| PUT | `/api/products/:id` | Modifier l'annonce de **n'importe quel vendeur** (sauf une annonce vendue : 409 pour tout le monde) |
| DELETE | `/api/products/:id` | Supprimer l'annonce de **n'importe quel vendeur** (modération d'une annonce interdite ou frauduleuse) |

Codes de réponse à connaître : **400** données invalides (zod), **404** licence ou synonyme introuvable,
**409** conflit (le nouveau nom ou synonyme appartient déjà à une autre licence : il faut plutôt fusionner).

### Côté interface

- La page **`/admin/licences`** (fichier `pages/AdminLicences/AdminLicences.jsx`) regroupe toutes les actions sur les licences :
  - section **« En attente de validation »** : boutons *Valider*, *Renommer*, *Fusionner* ;
  - section **« Licences validées »** : les synonymes sous forme de puces (supprimables), plus un champ pour en ajouter un.
- **Lien « MODÉRATION » dans la barre de navigation**, affiché seulement si `currentUser.role === 'admin'`
  (`NavBar.jsx`). Cacher ou montrer un lien **n'est pas une sécurité** : la vraie barrière, c'est `requireAdmin`
  côté API. Un utilisateur qui taperait `/admin/licences` verrait seulement « Réservé aux administrateurs. », et
  l'API lui répondrait 403.
- **Modération des annonces** : sur la fiche d'une annonce d'un autre vendeur, l'admin voit un bouton
  **« Supprimer (modération) »** (`pages/Product/Product.jsx`, variable `canModerate`). Après confirmation, l'annonce
  est supprimée et l'admin revient à l'accueil. La modification des annonces des autres reste possible par l'API
  seulement (Swagger), volontairement : un admin modère, il ne réécrit pas l'annonce d'un vendeur.

### Tester les routes admin à la main

Le plus simple : **Swagger** (http://localhost:3000/api/docs). Se connecter d'abord avec `POST /api/auth/login`
(compte `admin@example.com`) : le cookie est déposé dans le navigateur, puis « Try it out » sur les routes `/api/admin`.

Avec `curl`, en gardant le cookie dans un fichier :

```bash
# 1. Connexion : le cookie bazardim_token est enregistré dans cookies.txt
curl -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"<SEED_DEMO_PASSWORD>"}' \
  http://localhost:3000/api/auth/login

# 2. Lister les licences (en attente d'abord)
curl -b cookies.txt http://localhost:3000/api/admin/licences

# 3. Valider la licence n° 12
curl -b cookies.txt -X PATCH -H "Content-Type: application/json" \
  -d '{"status":"approved"}' http://localhost:3000/api/admin/licences/12
```

Les tests automatiques correspondants sont dans `back/tests/licences.test.js` (droits 401 / 403, validation,
renommage, fusion, synonymes) et `back/tests/products.test.js` (« un administrateur peut supprimer n'importe quelle annonce »).

## Tests du back

- **Outils** : Vitest + supertest, sur une **vraie base PostgreSQL de test** (`bazardim_test`), vidée avant chaque test.
  **77 tests**, environ **97 % de couverture**.
- `tests/globalSetup.js` recrée les tables une fois avant tous les tests ; `tests/helpers.js` fournit
  `createLoggedInUser` (un utilisateur déjà connecté), `buildProduct` (une annonce valide)...
- **Stripe est simulé** (`vi.mock`) : les tests n'appellent jamais les serveurs de Stripe.
- Les fichiers de test s'exécutent l'un après l'autre (`fileParallelism: false`), car ils partagent la même base.

## Commandes utiles du back

À lancer dans le dossier `back/` :

| Commande | Rôle |
| --- | --- |
| `npm install` | Installe les dépendances |
| `npm run dev` | Lance l'API sur **http://localhost:3000**, redémarre à chaque modification |
| `npm start` | Lance l'API en production (variables d'environnement fournies par le serveur) |
| `npm run db:reset` | ⚠️ **Efface** la base de dev, recrée les tables et insère les données de démo |
| `npm test` | Lance les tests (sur `bazardim_test`, jamais sur la base de dev) |
| `npm run test:coverage` | Tests + rapport de couverture (`coverage/index.html`), échoue sous 50 % |
| `npm run lint` | Analyse statique (ESLint) |
| `npm run format` / `npm run format:check` | Formatage (Prettier) |
| `stripe listen --forward-to localhost:3000/api/stripe/webhook` | (Stripe CLI) recevoir les webhooks Stripe en local |

À lancer depuis la **racine** du projet :

| Commande | Rôle |
| --- | --- |
| `./scripts/backup-database.sh` | Sauvegarde la base dans `backups/` (7 dernières gardées) |
| `./scripts/restore-database.sh backups/<fichier>.dump essai` | Restaure dans une base d'essai pour vérifier une sauvegarde |
| `./scripts/restore-database.sh backups/<fichier>.dump` | ⚠️ Remplace la base de dev (confirmation « RESTAURER » demandée) |
| `node scripts/update-todo-progress.mjs` | Met à jour les barres de progression de `todo.md` |

---

## ⭐ Installer le projet avec Docker

**Docker** fait tourner des logiciels dans des **conteneurs** : des environnements isolés et identiques sur
tous les ordinateurs. Ici, PostgreSQL tourne dans un conteneur : rien à installer sur le Mac à part Docker Desktop.

### Installation complète, pas à pas

Prérequis : **Node.js 22+** et **Docker Desktop** (lancé : la baleine doit apparaître dans la barre des menus).

```bash
# 1. À la racine du projet : choisir le mot de passe de la base
cp .env.example .env
#    → ouvrir .env et remplir POSTGRES_PASSWORD (ex : générer une valeur aléatoire avec
#      node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")

# 2. Démarrer PostgreSQL dans Docker (en arrière-plan)
docker compose up -d
#    Au premier démarrage, Docker télécharge l'image postgres:17-alpine, crée la base "bazardim"
#    et la base de test "bazardim_test" (script back/database/docker-init/).

# 3. Configurer l'API
cd back
cp .env.example .env
#    → remplir DATABASE_URL et TEST_DATABASE_URL avec le même mot de passe :
#      DATABASE_URL=postgres://bazardim:<mot de passe>@localhost:5432/bazardim
#      TEST_DATABASE_URL=postgres://bazardim:<mot de passe>@localhost:5432/bazardim_test
#    → remplir JWT_SECRET (48 octets aléatoires), SEED_DEMO_PASSWORD et STRIPE_SECRET_KEY (sk_test_...)

# 4. Installer, créer les tables, insérer les données de démo, lancer l'API
npm install
npm run db:reset
npm run dev            # → http://localhost:3000/api/health doit répondre {"status":"ok"}

# 5. Dans un deuxième terminal : le front
cd front
npm install
npm run dev            # → http://localhost:5173
```

### Ce que contient `docker-compose.yml`

| Service | Image | Port | Rôle |
| --- | --- | --- | --- |
| `database` | `postgres:17-alpine` | `127.0.0.1:5432` (joignable uniquement depuis ce Mac) | La base de données. Les données sont gardées dans le **volume** `database_data` : elles survivent à l'arrêt du conteneur. |
| `api` (optionnel) | construite avec `back/Dockerfile` | `127.0.0.1:3000` | L'API en conteneur, comme en production. Ne démarre qu'avec `--profile api`. |

### Commandes Docker utiles

| Commande | Rôle |
| --- | --- |
| `docker compose up -d` | Démarre la base en arrière-plan |
| `docker compose ps` | État des conteneurs (`healthy` = la base est prête) |
| `docker compose logs -f database` | Journal de PostgreSQL en direct (Ctrl + C pour quitter) |
| `docker compose stop` | Arrête la base (les données sont gardées) |
| `docker compose down` | Arrête et supprime le conteneur (les données restent dans le volume) |
| `docker compose down -v` | ⚠️ Arrête **et supprime les données** (le volume) : repartir de zéro |
| `docker compose --profile api up -d --build` | Démarre aussi l'API dans un conteneur (arrêter d'abord `npm run dev`, même port 3000) |
| `docker compose logs -f api` | Journal de l'API en conteneur |

**Le Dockerfile de l'API** : image Node.js 22 Alpine (légère), dépendances de production seulement
(`npm ci --omit=dev`), l'API tourne avec l'utilisateur `node` (**pas en administrateur**), Docker vérifie
toutes les 30 secondes qu'elle répond (`HEALTHCHECK` sur `/api/health`), et **aucun secret** n'est copié dans l'image
(`.dockerignore` exclut `.env`).

**En cas de problème**

- « Cannot connect to the Docker daemon » → Docker Desktop n'est pas lancé.
- « port is already allocated » → un autre programme utilise déjà le port (5432, 3000 ou 5173) :
  `docker ps` pour voir les conteneurs qui tournent.
- L'API affiche « Configuration invalide » → une variable de `back/.env` manque ou est mal remplie, le message dit laquelle.

---

## ⭐ Accéder à la base de données

### Méthode 1 : `psql` dans le conteneur (rien à installer)

`psql` est le client en ligne de commande de PostgreSQL. Il est déjà dans le conteneur :

```bash
# Ouvrir une session SQL sur la base de développement
docker exec -it bazardim_database psql -U bazardim -d bazardim

# (sur la base des tests : -d bazardim_test)
```

- `docker exec -it` : lance une commande **dans** le conteneur, en mode interactif.
- `-U bazardim` : l'utilisateur PostgreSQL ; `-d bazardim` : la base.
- Pas de mot de passe demandé : à l'intérieur du conteneur, les connexions locales sont autorisées.

**Commandes `psql` utiles** (elles commencent par une barre oblique inversée) :

| Commande | Rôle |
| --- | --- |
| `\dt` | Liste des tables |
| `\d users` | Structure d'une table : colonnes, types, contraintes, index |
| `\dv` | Liste des vues (`product_details`) |
| `\x` | Affichage vertical, plus lisible pour les lignes longues (à nouveau `\x` pour revenir) |
| `\l` | Liste des bases (`bazardim`, `bazardim_test`) |
| `\q` | Quitter |

Chaque requête SQL se termine par un **point-virgule**.

**Requêtes utiles pour obtenir des informations :**

```sql
-- Comptes (jamais le mot de passe : seulement son empreinte, qu'on n'affiche pas)
SELECT id, username, email, role, created_at FROM users ORDER BY id;

-- Annonces en vente / vendues
SELECT id, title, price, category, sold_at FROM products ORDER BY id;
SELECT count(*) FILTER (WHERE sold_at IS NULL) AS en_vente,
       count(*) FILTER (WHERE sold_at IS NOT NULL) AS vendues
FROM products;

-- Annonces complètes avec vendeur, licence et tags (grâce à la vue)
SELECT id, title, owner_username, licence_name, tags FROM product_details;

-- Commandes avec leurs frais de service
SELECT id, buyer_id, status, total_price, service_fee, created_at, paid_at FROM orders ORDER BY id DESC;

-- Articles vendus et expédiés
SELECT order_id, product_title, price, shipped_at FROM order_items ORDER BY id DESC;

-- Chiffre d'affaires de Bazardim (frais de service des commandes payées)
SELECT sum(service_fee) AS revenus_bazardim FROM orders WHERE status = 'paid';

-- Messages non lus par destinataire
SELECT recipient_id, count(*) AS non_lus FROM messages WHERE NOT is_read GROUP BY recipient_id;

-- Annonces les plus mises en favoris
SELECT product_id, count(*) AS favoris FROM likes GROUP BY product_id ORDER BY favoris DESC LIMIT 5;
```

Pour une seule requête, sans ouvrir de session :

```bash
docker exec bazardim_database psql -U bazardim -d bazardim -c "SELECT count(*) FROM users;"
```

⚠️ Ce sont tes vraies données de développement : évite les `UPDATE` et `DELETE` sans `WHERE`,
et fais une sauvegarde avant toute manipulation (`./scripts/backup-database.sh`).

### Méthode 2 : un logiciel graphique

Pour parcourir les tables à la souris : **DBeaver** (gratuit), **pgAdmin** (gratuit), **TablePlus**, ou l'extension
**PostgreSQL** de Microsoft dans VS Code. Paramètres de connexion :

| Paramètre | Valeur |
| --- | --- |
| Hôte | `localhost` |
| Port | `5432` |
| Base | `bazardim` (ou `bazardim_test`) |
| Utilisateur | `bazardim` |
| Mot de passe | la valeur de `POSTGRES_PASSWORD` dans le fichier `.env` à la racine du projet |

La base n'est joignable que depuis ton ordinateur (`127.0.0.1` dans `docker-compose.yml`), pas depuis le réseau Wi-Fi.

---

# Partie commune : qualité et CI

| Outil | Rôle | Commande |
| --- | --- | --- |
| **ESLint** | Analyse statique (front et back) | `npm run lint` |
| **Prettier** | Formatage du code | `npm run format` |
| **Vitest** | Tests + couverture ≥ 50 % | `npm run test:coverage` |
| **npm audit** | Vérifie qu'aucune dépendance n'a de faille connue | `npm audit` |
| **GitHub Actions** | **Intégration continue** : à chaque push, GitHub relance tout ce qui précède | `.github/workflows/ci.yml` |

La CI a deux jobs :

- **front** : installation, lint, formatage, audit, tests avec couverture, build ;
- **back** : la même chose, avec une base PostgreSQL jetable créée par GitHub pour les tests.

Si une étape échoue, le commit est marqué en rouge sur GitHub.

**Les autres documents du projet**

| Document | Contenu |
| --- | --- |
| [`README.md`](../README.md) | Démarrage rapide, liens utiles, sauvegardes |
| [`front/README.md`](../front/README.md), [`back/README.md`](../back/README.md) | Détails techniques de chaque partie, liste des routes |
| [`docs/plan-de-tests.md`](plan-de-tests.md) | Plan de tests : scénario → résultat attendu → fichier de test |
| [`todo.md`](../todo.md) | Avancement par rapport à la grille de la certification |
