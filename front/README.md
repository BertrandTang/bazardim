# Bazardim — Front-end

Marketplace entre collectionneurs (figurines, figurines articulées, statues).
Application React 19 + Vite + Material UI + React Router.

## Lancer le projet

```bash
npm install            # installe les dépendances
npm run dev            # serveur de développement (http://localhost:5173) — l'API doit tourner (voir back/)
npm test               # tests automatiques (Vitest + React Testing Library)
npm run test:coverage  # tests + rapport de couverture (coverage/index.html), échoue sous 50 %
npm run lint           # analyse statique du code (ESLint)
npm run format         # formate tout le code (Prettier)
npm run build          # build de production dans dist/
npm run preview        # sert le build de production en local
```

Comptes de démonstration : `collectionneurdu92@example.com`, `admin@example.com` (mot de passe : `SEED_DEMO_PASSWORD` dans `back/.env`).

Toutes les données (comptes, annonces, favoris, messages) viennent de l'API (dossier `back/`).
Seuls le panier et l'adresse de livraison restent dans le **localStorage** du navigateur,
pour qu'un visiteur puisse remplir son panier sans être connecté.

**Comment le front parle à l'API** : tous les appels sont dans `src/services/api.js`
(`fetch` avec `credentials: 'include'` pour envoyer le cookie de connexion).
En développement, Vite transmet les requêtes `/api/...` à `http://localhost:3000` (`server.proxy` dans `vite.config.js`).
En cas d'erreur, l'API renvoie un message (« Email ou mot de passe incorrect. »...) que les pages affichent.

## Sécurité : CSP (Content Security Policy)

Le build de production (`npm run build`) ajoute dans `index.html` une balise `<meta http-equiv="Content-Security-Policy">` :
la liste des sources que le navigateur a le droit de charger (scripts et images du site, appels vers notre API et vers
l'API Adresse). Un script injecté par un pirate (faille XSS) serait bloqué. Elle est définie dans `vite.config.js`
(`CONTENT_SECURITY_POLICY`) et n'est pas active avec `npm run dev`, dont les scripts de rechargement à chaud seraient bloqués.
Pour la tester : `npm run build && npm run preview`.

## Organisation du code

```
src/
├── main.jsx              Point d'entrée : affiche <App /> dans index.html
├── index.css             Styles globaux + couleurs de la charte (variables CSS)
├── App.jsx               Providers (données partagées) + liste des routes
├── context/              Données partagées entre toutes les pages (React Context)
│   ├── AuthContext       Utilisateur connecté (connexion, inscription, modification du compte)
│   ├── ProductsContext   Annonces (chargement, création, modification, suppression)
│   ├── CartContext       Panier (gardé dans le navigateur)
│   └── LikesContext      Favoris de l'utilisateur connecté
├── hooks/
│   └── useLocalStorageState.js   useState sauvegardé dans le localStorage
├── services/
│   ├── api.js            Appels à notre API (back/) : comptes, annonces, favoris, messages
│   └── addressApi.js     API tierce : API Adresse (Base Adresse Nationale)
├── components/           Morceaux d'interface réutilisables (cartes, formulaires...)
├── pages/                Une page = une route (Home, Product, Cart, Profile, Messages...)
├── data/                 Liste des catégories
└── utils/                Fonctions utilitaires (image d'un produit, format du prix, redirection vers Stripe)
```

Les tests sont dans le dossier `tests/` (à côté de `src/`), comme dans le back-end.
`tests/renderWithProviders.jsx` affiche un composant avec les données partagées (contextes).
Les tests n'appellent pas la vraie API : `tests/setup.js` remplace `src/services/api.js` par
`tests/fakeApi.js`, une fausse API qui garde ses données en mémoire (`tests/fixtures.js`).
Le plan de tests est dans [docs/plan-de-tests.md](../docs/plan-de-tests.md).

### Rappels React

- **`useState`** : crée une variable dont le changement réaffiche le composant.
  `const [count, setCount] = useState(0)` → on lit `count`, on modifie avec `setCount(1)`.
- **`useEffect`** : exécute du code _après_ l'affichage, par exemple charger des données depuis l'API.
  Le tableau à la fin (`[]`, `[id]`) indique quand le relancer : `[]` = une seule fois, `[id]` = à chaque changement d'`id`.
- **`async` / `await`** : un appel à l'API prend du temps ; `await` attend la réponse avant de continuer.
  Si l'API renvoie une erreur, elle est « lancée » : on l'attrape avec `try { ... } catch (error) { ... }`.
- **Context** (`useAuth()`, `useCart()`...) : accès aux données partagées sans les passer de
  composant en composant via les props.
- Une valeur qui se calcule à partir d'autres (ex : la liste filtrée des produits) n'a **pas**
  besoin de `useState` : on la recalcule simplement à chaque affichage.
