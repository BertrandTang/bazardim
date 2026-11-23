# Bazardim — Back-end (API REST)

API de la marketplace Bazardim : Node.js 22+, Express 5, PostgreSQL 17.

## Lancer le projet

```bash
# 1. Démarrer PostgreSQL (depuis la racine du projet, Docker Desktop doit être lancé)
cp .env.example .env     # une seule fois : choisir POSTGRES_PASSWORD
docker compose up -d

# 2. Configurer l'API (une seule fois, dans back/) : copier le modèle puis remplir
#    DATABASE_URL, TEST_DATABASE_URL (avec le même mot de passe), JWT_SECRET et SEED_DEMO_PASSWORD
cp .env.example .env

# 3. Installer, créer les tables et insérer les données de démo
npm install
npm run db:reset

# 4. Démarrer l'API (redémarre toute seule à chaque modification)
npm run dev        # http://localhost:3000/api/health
```

| Commande                | Rôle                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `npm run dev`           | API en développement (rechargement automatique)                                            |
| `npm start`             | API en production (variables d'environnement à fournir)                                    |
| `npm run db:reset`      | ⚠️ efface la base, recrée les tables (`database/schema.sql`) et insère les données de démo |
| `npm test`              | tests automatiques (sur la base `bazardim_test`, jamais sur celle de dev)                  |
| `npm run test:coverage` | tests + rapport de couverture (`coverage/index.html`), échoue sous 50 %                    |
| `npm run lint`          | analyse statique (ESLint)                                                                  |

Comptes de démo : `collectionneurdu92@example.com`, administrateur : `admin@example.com`. Mot de passe : la valeur de `SEED_DEMO_PASSWORD` dans `back/.env` (jamais écrite dans le dépôt).

## Choix techniques

- **Express 5** : framework web minimaliste ; la version 5 transmet automatiquement les erreurs des fonctions `async` au gestionnaire d'erreurs.
- **PostgreSQL + SQL écrit à la main (bibliothèque `pg`)** plutôt qu'un ORM : le modèle de données est lisible directement dans `database/schema.sql`, et chaque requête est visible. Toutes les valeurs passent par des paramètres `$1, $2...`, ce qui empêche les injections SQL.
- **zod** : validation de tout ce qui entre dans l'API (corps, paramètres d'URL, configuration).
- **Authentification** : mot de passe haché avec **bcrypt**, jeton **JWT** rangé dans un cookie `httpOnly` + `SameSite=Lax` (inaccessible au JavaScript de la page).
- **Sécurité** : `helmet` (en-têtes HTTP), CORS limité au front, limitation du nombre de tentatives de connexion, contrôle du propriétaire sur chaque modification, contraintes en base (`CHECK`, `UNIQUE`, clés étrangères).
- **Journalisation** : un middleware maison (`middlewares/requestLogger.js`) affiche chaque requête dans le terminal (méthode, adresse, code de réponse, durée) ; les erreurs inattendues sont affichées par `errorHandler`.
- **Tests** : Vitest + supertest, sur une vraie base PostgreSQL de test. Stripe est simulé (`vi.mock`) : les tests ne l'appellent jamais.

## Paiement (Stripe Checkout, mode test)

Le trajet d'une commande :

1. Le front envoie `POST /api/orders` avec les identifiants des annonces du panier (pièces uniques : pas de quantité, **jamais de prix**) et l'adresse de livraison.
2. Le back relit les prix dans la base, calcule le total, enregistre la commande « en attente » (`pending`) et crée une **session Stripe Checkout**. Il renvoie l'adresse de la page de paiement (`checkout_url`).
3. Le front redirige l'acheteur vers cette page, hébergée par Stripe : la carte bancaire ne passe jamais par notre serveur.
4. Après le paiement, Stripe renvoie l'acheteur sur `/commande/confirmation?order_id=...`. La commande passe à `paid`, et ses produits sont marqués **vendus** (`sold_at`, ils ne peuvent plus être commandés). Cela se fait de deux façons :
   - **webhook** : Stripe appelle `POST /api/stripe/webhook` (signature vérifiée avec `STRIPE_WEBHOOK_SECRET`). C'est la méthode fiable, même si l'acheteur ferme son navigateur ;
   - **vérification à l'affichage** : `GET /api/orders/:id` demande à Stripe si la session est payée. Pratique en local, sans webhook.

En local, pour recevoir aussi le webhook, installer la [Stripe CLI](https://docs.stripe.com/stripe-cli) puis lancer
`stripe listen --forward-to localhost:3000/api/stripe/webhook` : elle affiche un secret `whsec_...` à copier dans `STRIPE_WEBHOOK_SECRET`.

Carte de test : `4242 4242 4242 4242`, n'importe quelle date future et n'importe quel CVC. Seules les clés `sk_test_` sont acceptées par la configuration.

## Organisation du code

```
back/
├── database/
│   ├── schema.sql          Tables, contraintes, index et vue (modèle physique de données)
│   ├── seed.js             Données de démonstration (seed-data/*.json)
│   ├── reset.js            Script de `npm run db:reset`
│   └── docker-init/        Crée la base de test au premier démarrage de Docker
├── src/
│   ├── server.js           Démarre le serveur HTTP
│   ├── app.js              Middlewares (sécurité, logs, JSON) + branchement des routes
│   ├── config/             Variables d'environnement (config.js), connexion PostgreSQL (database.js)
│   ├── routes/             URL → fonction du contrôleur (ex : products.routes.js)
│   ├── controllers/        Règles métier : droits, codes HTTP (ex : products.controller.js)
│   ├── models/             Requêtes SQL vers la base (ex : products.model.js)
│   ├── validators/         Validation des données reçues avec zod (ex : products.validator.js)
│   ├── middlewares/        Authentification (requireAuth), journal des requêtes, gestion des erreurs
│   └── utils/              Hachage des mots de passe, classe HttpError
└── tests/                  Un fichier de test par ressource (auth, users, products...)
```

Organisation **MVC** classique (la « vue » est le JSON renvoyé). Le trajet d'une requête :
**route** → `requireAuth` (si protégée) → **contrôleur** (valide les données avec le **validateur**, vérifie les droits) → **modèle** (SQL) → réponse JSON. En cas d'erreur, le contrôleur lance une `HttpError` et `errorHandler` répond.

## Routes de l'API

Toutes les réponses sont en JSON. En cas d'erreur : `{ "error": "message" }` (+ `details` par champ pour une erreur de validation 400).
🔒 = connexion requise (cookie envoyé avec `credentials: 'include'` côté front).

| Méthode   | Route                        | Description                                                                              |
| --------- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| GET       | `/api/health`                | État de l'API et de la base                                                              |
| POST      | `/api/auth/register`         | Inscription `{ username, email, password }` → 201 + cookie                               |
| POST      | `/api/auth/login`            | Connexion `{ email, password }` → cookie                                                 |
| POST      | `/api/auth/logout`           | Déconnexion → 204                                                                        |
| GET 🔒    | `/api/auth/me`               | Utilisateur connecté                                                                     |
| GET       | `/api/users/:id`             | Profil public (pseudo, image — pas d'email)                                              |
| PATCH 🔒  | `/api/users/me`              | Modifier son compte (`current_password` requis pour changer d'email ou de mot de passe)  |
| DELETE 🔒 | `/api/users/me`              | Supprimer son compte `{ current_password }` (RGPD)                                       |
| GET       | `/api/products`              | Liste ; filtres : `category`, `licence`, `search`, `owner_id`, `limit` (≤ 100), `offset` |
| GET       | `/api/products/:id`          | Détail d'un produit                                                                      |
| POST 🔒   | `/api/products`              | Créer une annonce                                                                        |
| PUT 🔒    | `/api/products/:id`          | Modifier son annonce (propriétaire ou admin)                                             |
| DELETE 🔒 | `/api/products/:id`          | Supprimer son annonce (propriétaire ou admin)                                            |
| GET       | `/api/licences`              | Licences utilisées par au moins une annonce                                              |
| GET 🔒    | `/api/likes`                 | Produits mis en favoris                                                                  |
| PUT 🔒    | `/api/likes/:productId`      | Ajouter aux favoris (sans effet si déjà présent)                                         |
| DELETE 🔒 | `/api/likes/:productId`      | Retirer des favoris                                                                      |
| GET 🔒    | `/api/messages/received`     | Messages reçus (boîte de réception)                                                      |
| GET 🔒    | `/api/messages/sent`         | Messages envoyés                                                                         |
| GET 🔒    | `/api/messages/unread-count` | Nombre de messages non lus `{ count }` (pastille de la barre de navigation)              |
| POST 🔒   | `/api/messages`              | Envoyer `{ recipient_id, product_id, content }` (`product_id` facultatif)                |
| PATCH 🔒  | `/api/messages/:id/read`     | Marquer un message reçu comme lu (destinataire uniquement)                               |
| POST 🔒   | `/api/orders`                | Commander `{ product_ids: [3, 8], shipping_address }` → `{ order_id, checkout_url }`     |
| GET 🔒    | `/api/orders`                | Mes commandes (avec leurs articles)                                                      |
| GET 🔒    | `/api/orders/:id`            | Une de mes commandes (vérifie le paiement auprès de Stripe si elle est en attente)       |
| POST      | `/api/stripe/webhook`        | Réservée à Stripe (signature vérifiée) : confirme un paiement                            |

Exemple de produit envoyé à `POST /api/products` :

```json
{
  "title": "Figurine S.H. Figuarts Luffy",
  "description": "Figurine articulée, accessoires inclus.",
  "price": 74.99,
  "category": "FIGURINE ARTICULÉE",
  "licence_name": "One Piece",
  "character_name": "Monkey D. Luffy",
  "manufacturer": "Bandai",
  "has_box": true,
  "ean_code": "4573102711304",
  "height_cm": 17,
  "scale": "1/8",
  "image_url": "https://exemple.com/luffy.jpg",
  "tags": ["shf", "bandai"]
}
```

Seuls `title`, `description`, `price` et `category` sont obligatoires. Catégories : `FIGURINE`, `FIGURINE ARTICULÉE`, `STATUE`.
