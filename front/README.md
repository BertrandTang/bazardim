# Bazardim — Front-end

Marketplace entre collectionneurs (figurines, figurines articulées, statues).
Application React 19 + Vite + Material UI + React Router.

## Lancer le projet

```bash
npm install            # installe les dépendances
npm run dev            # serveur de développement (http://localhost:5173)
npm test               # tests automatiques (Vitest + React Testing Library)
npm run test:coverage  # tests + rapport de couverture (coverage/index.html), échoue sous 80 %
npm run lint           # analyse statique du code (ESLint)
npm run format         # formate tout le code (Prettier)
npm run build          # build de production dans dist/
npm run build:analyze  # build + carte de la taille du JavaScript (dist/stats.html)
npm run preview        # sert le build de production en local
```

Comptes de démonstration (voir `src/data/profiles.json`) :
`collectionneurdu92@example.com` / `password123`, `admin@example.com` / `admin123`.

> En attendant le back-end, toutes les données (comptes, produits, panier, likes, avis)
> sont sauvegardées dans le **localStorage** du navigateur. Pour repartir des données
> d'origine : outils de développement → Application → Local Storage → « Clear ».
> Les endroits à remplacer par des appels API sont signalés par `⚠️ TEMPORAIRE`.

## Organisation du code

```
src/
├── main.jsx              Point d'entrée : affiche <App /> dans index.html
├── main.css              Styles globaux + couleurs de la charte (variables CSS)
├── App/App.jsx           Providers (données partagées) + liste des routes
├── context/              Données partagées entre toutes les pages (React Context)
│   ├── AuthContext       Comptes et utilisateur connecté
│   ├── ProductsContext   Annonces (création, modification, suppression)
│   ├── CartContext       Panier
│   ├── LikesContext      Favoris
│   └── ReviewsContext    Avis sur les vendeurs
├── hooks/
│   └── useLocalStorageState.js   useState sauvegardé dans le localStorage
├── services/             Appels à des API externes (adresses : Géoplateforme de l'IGN)
├── test/                 Outils communs aux tests (affichage avec les Providers)
├── components/           Morceaux d'interface réutilisables (cartes, formulaires...)
├── pages/                Une page = une route (Home, Product, Cart, Profile...)
├── data/                 Données de démonstration (JSON) et liste des catégories
└── utils/                Fonctions utilitaires (image d'un produit, format du prix)
```

Les tests sont à côté du code qu'ils vérifient (`*.test.js` / `*.test.jsx`).
Le plan de tests est dans [docs/plan-de-tests.md](../docs/plan-de-tests.md).

### Rappels React

- **`useState`** : crée une variable dont le changement réaffiche le composant.
  `const [count, setCount] = useState(0)` → on lit `count`, on modifie avec `setCount(1)`.
- **`useEffect`** : exécute du code _après_ l'affichage (ex : sauvegarder dans le localStorage).
- **Context** (`useAuth()`, `useCart()`...) : accès aux données partagées sans les passer de
  composant en composant via les props.
- Une valeur qui se calcule à partir d'autres (ex : la liste filtrée des produits) n'a **pas**
  besoin de `useState` : on la recalcule simplement à chaque affichage.
