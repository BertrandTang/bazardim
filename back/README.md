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

### Lancer l'API dans un conteneur Docker (comme en production)

Le `Dockerfile` construit une image de l'API : Node.js 22 Alpine, dépendances de production seulement, utilisateur non administrateur, vérification de santé sur `/api/health`. Aucun secret n'est copié dans l'image (voir `.dockerignore`) : ils sont fournis au lancement.

```bash
# Depuis la racine du projet, après avoir arrêté `npm run dev` (même port 3000) :
docker compose --profile api up -d --build   # base + API en conteneurs
docker compose logs -f api                   # journal de l'API
docker compose --profile api down            # tout arrêter
```

L'API lit `back/.env`, mais se connecte à la base via le réseau Docker (`database:5432`) et passe en `NODE_ENV=production`.

Comptes de démo : `collectionneurdu92@example.com`, administrateur : `admin@example.com`. Mot de passe : la valeur de `SEED_DEMO_PASSWORD` dans `back/.env` (jamais écrite dans le dépôt).

## Choix techniques

- **Express 5** : framework web minimaliste ; la version 5 transmet automatiquement les erreurs des fonctions `async` au gestionnaire d'erreurs.
- **PostgreSQL + SQL écrit à la main (bibliothèque `pg`)** plutôt qu'un ORM : le modèle de données est lisible directement dans `database/schema.sql`, et chaque requête est visible. Toutes les valeurs passent par des paramètres `$1, $2...`, ce qui empêche les injections SQL.
- **zod** : validation de tout ce qui entre dans l'API (corps, paramètres d'URL, configuration).
- **Authentification** : mot de passe haché avec **bcrypt**, jeton **JWT** rangé dans un cookie `httpOnly` + `SameSite=Lax` (inaccessible au JavaScript de la page).
- **Sécurité** : `helmet` (en-têtes HTTP), CORS limité au front, limitation du nombre de tentatives de connexion, contrôle du propriétaire sur chaque modification, contraintes en base (`CHECK`, `UNIQUE`, clés étrangères).
- **Journalisation (winston)** : le journal est configuré dans `config/logger.js`, avec trois niveaux (`info`, `warn`, `error`) et la date sur chaque ligne. Le middleware `middlewares/requestLogger.js` écrit une ligne par requête (méthode, adresse, code de réponse, durée) : `info` si tout va bien, `warn` pour un 4xx, `error` pour un 5xx. Les erreurs inattendues sont journalisées par `errorHandler` avec leur pile d'appels. Tout s'affiche dans le terminal, et les erreurs sont aussi écrites dans `back/logs/errors.log` (ignoré par git). Aucun log pendant les tests.
- **Tests** : Vitest + supertest, sur une vraie base PostgreSQL de test. Stripe est simulé (`vi.mock`) : les tests ne l'appellent jamais.

## Licences : normalisation, synonymes et modération

Pour éviter que la même série existe sous plusieurs noms (« One Piece », « one-piece », « Tensura » / « Moi, quand je me réincarne en Slime »), la licence saisie par un vendeur est rangée ainsi (`findOrCreateLicenceId` dans `models/products.model.js`) :

1. **Nom normalisé** (`utils/normalizeText.js` : minuscules, sans accents, sans ponctuation) : « ONE-PIECE » retrouve « One Piece ». La colonne `licences.normalized_name` est `UNIQUE`.
2. **Synonyme** (table `licence_aliases`) : « DBZ » retrouve « Dragon Ball Z ».
3. Sinon, la licence est créée **en attente** (`status = 'pending'`) : l'annonce est publiée, mais la licence n'apparaît dans le menu qu'après validation.

Un administrateur modère les licences sur la page `/admin/licences` : **valider**, **renommer** (l'ancien nom devient un synonyme) ou **fusionner** un doublon dans une licence existante (ses annonces sont déplacées et son nom devient un synonyme, reconnu automatiquement la fois suivante). La recherche tient aussi compte des synonymes.

## Images (multer)

Les photos d'annonces et de profil sont choisies sur l'appareil de l'utilisateur, jamais saisies sous forme de lien :

1. Le front envoie le fichier à `POST /api/uploads` (connexion obligatoire).
2. Le middleware `middlewares/imageUpload.js` (bibliothèque **multer**) vérifie le type (JPEG, PNG ou WebP) et la taille (2 Mo maximum), puis enregistre le fichier dans `back/uploads/` sous un **nom aléatoire** (jamais le nom choisi par l'utilisateur).
3. L'API renvoie l'adresse de l'image (`/uploads/abc.jpg`), que le front met dans `image_url` (annonce) ou `profile_image_url` (profil).

Les annonces n'acceptent que des images du site (`/uploads/...` ou les images de démo `/img/...`). Le dossier `uploads/` est ignoré par Git.

## Paiement (Stripe Checkout, mode test)

Le trajet d'une commande :

1. Le front envoie `POST /api/orders` avec les identifiants des annonces du panier (pièces uniques : pas de quantité, **jamais de prix**) et l'adresse de livraison.
2. Le back relit les prix dans la base, calcule les **frais de service** (0,70 € + 5 % du prix des articles, `src/utils/serviceFee.js`) et le total, enregistre la commande « en attente » (`pending`) et crée une **session Stripe Checkout**. Il renvoie l'adresse de la page de paiement (`checkout_url`).
3. Le front redirige l'acheteur vers cette page, hébergée par Stripe : la carte bancaire ne passe jamais par notre serveur.
4. Après le paiement, Stripe renvoie l'acheteur sur `/commande/confirmation?order_id=...`. La commande passe à `paid`, et ses produits sont marqués **vendus** (`sold_at`, ils ne peuvent plus être commandés). Cela se fait de deux façons :
   - **webhook** : Stripe appelle `POST /api/stripe/webhook` (signature vérifiée avec `STRIPE_WEBHOOK_SECRET`). C'est la méthode fiable, même si l'acheteur ferme son navigateur ;
   - **vérification à l'affichage** : `GET /api/orders/:id` demande à Stripe si la session est payée. Pratique en local, sans webhook.

En local, pour recevoir aussi le webhook, installer la [Stripe CLI](https://docs.stripe.com/stripe-cli) puis lancer
`stripe listen --forward-to localhost:3000/api/stripe/webhook` : elle affiche un secret `whsec_...` à copier dans `STRIPE_WEBHOOK_SECRET`.

**Monétisation** : Bazardim gagne de l'argent grâce aux frais de service payés par l'acheteur. Ils sont affichés dans le panier avant le paiement, envoyés à Stripe comme une ligne à part (« Frais de service Bazardim ») et enregistrés dans `orders.service_fee`. Évolution prévue pour une vraie marketplace : **Stripe Connect**, qui reverse automatiquement le prix de l'annonce au vendeur et garde la commission (`application_fee_amount`).

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
│   ├── config/             Variables d'environnement (config.js), connexion PostgreSQL (database.js), journal winston (logger.js)
│   ├── routes/             URL → fonction du contrôleur (ex : products.routes.js)
│   ├── controllers/        Règles métier : droits, codes HTTP (ex : products.controller.js)
│   ├── models/             Requêtes SQL vers la base (ex : products.model.js)
│   ├── validators/         Validation des données reçues avec zod (ex : products.validator.js)
│   ├── docs/               Documentation OpenAPI de l'API (affichée par Swagger UI sur /api/docs)
│   ├── middlewares/        Authentification (requireAuth), journal des requêtes, gestion des erreurs
│   └── utils/              Hachage des mots de passe, classe HttpError
└── tests/                  Un fichier de test par ressource (auth, users, products...)
```

Organisation **MVC** classique (la « vue » est le JSON renvoyé). Le trajet d'une requête :
**route** → `requireAuth` (si protégée) → **contrôleur** (valide les données avec le **validateur**, vérifie les droits) → **modèle** (SQL) → réponse JSON. En cas d'erreur, le contrôleur lance une `HttpError` et `errorHandler` répond.

## Routes de l'API

**Documentation interactive (Swagger)** : [http://localhost:3000/api/docs](http://localhost:3000/api/docs), API lancée. Chaque route y est décrite (paramètres, corps, réponses) et peut être essayée avec « Try it out ». La même description au format standard OpenAPI 3 (JSON) est disponible sur `/api/docs.json`, pour d'autres outils (Postman, Insomnia, générateurs de clients…). Elle est écrite dans `src/docs/openapi.js`.

Toutes les réponses sont en JSON. En cas d'erreur : `{ "error": "message" }` (+ `details` par champ pour une erreur de validation 400).
🔒 = connexion requise (cookie envoyé avec `credentials: 'include'` côté front). 👑 = administrateur uniquement (sinon 403).

| Méthode   | Route                                    | Description                                                                                                  |
| --------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| GET       | `/api/health`                            | État de l'API et de la base                                                                                  |
| POST      | `/api/auth/register`                     | Inscription `{ username, email, password }` → 201 + cookie                                                   |
| POST      | `/api/auth/login`                        | Connexion `{ email, password }` → cookie                                                                     |
| POST      | `/api/auth/logout`                       | Déconnexion → 204                                                                                            |
| GET 🔒    | `/api/auth/me`                           | Utilisateur connecté                                                                                         |
| GET       | `/api/users/:id`                         | Profil public (pseudo, image — pas d'email)                                                                  |
| PATCH 🔒  | `/api/users/me`                          | Modifier son compte (`current_password` requis pour changer d'email ou de mot de passe)                      |
| DELETE 🔒 | `/api/users/me`                          | Supprimer son compte `{ current_password }` (RGPD)                                                           |
| GET       | `/api/products`                          | Liste ; filtres : `category`, `licence`, `search`, `owner_id`, `limit` (≤ 100), `offset`                     |
| GET       | `/api/products/:id`                      | Détail d'un produit                                                                                          |
| POST 🔒   | `/api/products`                          | Créer une annonce                                                                                            |
| PUT 🔒    | `/api/products/:id`                      | Modifier son annonce (propriétaire ou admin)                                                                 |
| DELETE 🔒 | `/api/products/:id`                      | Supprimer son annonce (propriétaire ou admin)                                                                |
| GET       | `/api/licences`                          | Licences **validées** utilisées par au moins une annonce (menu, suggestions)                                 |
| GET 🔒    | `/api/likes`                             | Produits mis en favoris                                                                                      |
| PUT 🔒    | `/api/likes/:productId`                  | Ajouter aux favoris (sans effet si déjà présent)                                                             |
| DELETE 🔒 | `/api/likes/:productId`                  | Retirer des favoris                                                                                          |
| GET 🔒    | `/api/messages/received`                 | Messages reçus (boîte de réception)                                                                          |
| GET 🔒    | `/api/messages/sent`                     | Messages envoyés                                                                                             |
| GET 🔒    | `/api/messages/unread-count`             | Nombre de messages non lus `{ count }` (pastille de la barre de navigation)                                  |
| POST 🔒   | `/api/uploads`                           | Envoyer une image (formulaire `multipart/form-data`, champ `image`) → `{ image_url: "/uploads/..." }`        |
| GET       | `/uploads/:fichier`                      | Image envoyée (fichier statique)                                                                             |
| GET       | `/sitemap.xml`                           | Plan du site pour les moteurs de recherche : pages fixes + annonces en vente (adresse du site : `FRONT_URL`) |
| POST 🔒   | `/api/messages`                          | Envoyer `{ recipient_id, product_id, content }` (`product_id` facultatif)                                    |
| PATCH 🔒  | `/api/messages/:id/read`                 | Marquer un message reçu comme lu (destinataire uniquement)                                                   |
| POST 🔒   | `/api/orders`                            | Commander `{ product_ids: [3, 8], shipping_address }` → `{ order_id, checkout_url }`                         |
| GET 🔒    | `/api/orders`                            | Mes commandes (avec leurs articles)                                                                          |
| GET 🔒    | `/api/orders/sales`                      | Mes ventes : acheteur, adresse de livraison, date de paiement et d'expédition de chaque annonce vendue       |
| PATCH 🔒  | `/api/orders/items/:id/shipped`          | Marquer un article vendu comme expédié (vendeur de l'annonce, commande payée, une seule fois)                |
| GET 🔒    | `/api/orders/:id`                        | Une de mes commandes (vérifie le paiement auprès de Stripe si elle est en attente)                           |
| POST      | `/api/stripe/webhook`                    | Réservée à Stripe (signature vérifiée) : confirme un paiement                                                |
| GET 👑    | `/api/admin/licences`                    | Toutes les licences (en attente d'abord), nombre d'annonces, synonymes                                       |
| PATCH 👑  | `/api/admin/licences/:id`                | Renommer (`name`, l'ancien nom devient un synonyme) et/ou valider (`status: "approved"`)                     |
| POST 👑   | `/api/admin/licences/:id/merge`          | Fusionner un doublon `{ target_licence_id }` : annonces déplacées, nom gardé comme synonyme                  |
| POST 👑   | `/api/admin/licences/:id/aliases`        | Ajouter un synonyme `{ alias }`                                                                              |
| DELETE 👑 | `/api/admin/licences/:id/aliases/:alias` | Supprimer un synonyme                                                                                        |

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
