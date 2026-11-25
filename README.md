# Bazardim

**La marketplace des collectionneurs de figurines.**

Revendre une figurine sur un site généraliste, c'est souvent la noyer parmi des milliers d'annonces
écrites chacune à sa façon : l'un met le nom du personnage, l'autre celui de la série, un troisième
oublie l'édition. Et pour l'acheteur, retrouver la pièce qu'il cherche devient un casse-tête.

Bazardim est né de ce constat. C'est une marketplace dédiée aux figurines, figurines articulées et
statues d'occasion, où chaque annonce suit le même format et où une licence est reconnue quelle que
soit son orthographe (« One Piece », « one-piece » ou « ONE PIECE », c'est la même chose).

> Projet réalisé pour la certification **Développeur Full Stack** (RNCP 38606).
> Les paiements fonctionnent en mode test : aucune somme réelle n'est débitée.

## Ce qu'on peut y faire

- **Vendre** une figurine en quelques champs : le titre de l'annonce se construit tout seul
  (« Figurine – Monkey D. Luffy (Gear 5 Ver.) »), et on peut recadrer la photo.
- **Chercher** par mot-clé, catégorie ou licence, et garder ses coups de cœur en favoris.
- **Acheter** : panier, adresse de livraison suggérée par l'API Adresse de l'État, paiement par Stripe.
- **Échanger** avec le vendeur grâce à la messagerie.
- **Expédier** : le vendeur voit à qui envoyer le colis et indique quand il l'a expédié.
- **Modérer** : un administrateur valide les nouvelles licences et peut retirer une annonce.

## Sous le capot

| | |
| --- | --- |
| **Front-end** ([`front/`](front/)) | React 19, Vite, Material UI, React Router |
| **Back-end** ([`back/`](back/)) | Node.js 22, Express 5, API REST documentée avec Swagger |
| **Base de données** | PostgreSQL 17, dans Docker |
| **Paiement** | Stripe Checkout et webhook signé |
| **Qualité** | Vitest, ESLint, Prettier, intégration continue avec GitHub Actions |

Chaque dossier a son propre README, et [`docs/presentation.md`](docs/presentation.md) raconte
le projet en détail : architecture, dépendances, base de données, Docker.

## Lancer le projet

Il vous faut **Node.js 22** (ou plus récent) et **Docker Desktop**.

```bash
# 1. La base de données
cp .env.example .env          # choisissez un mot de passe pour POSTGRES_PASSWORD
docker compose up -d

# 2. L'API (premier terminal)
cd back
cp .env.example .env          # remplissez les variables indiquées dans le fichier
npm install
npm run db:reset              # crée les tables et un jeu de démonstration de 15 figurines
npm run dev                   # http://localhost:3000

# 3. Le site (second terminal)
cd front
npm install
npm run dev                   # http://localhost:5173
```

L'API et le site tournent en même temps : en développement, le site transmet à l'API toutes ses
requêtes `/api/...`.

### Se connecter

Le jeu de démonstration crée plusieurs comptes, dont :

- `collectionneurdu92@example.com`, un vendeur ;
- `admin@example.com`, l'administrateur.

Leur mot de passe est celui que vous avez choisi dans `back/.env` (`SEED_DEMO_PASSWORD`).
Pour revenir aux données d'origine à tout moment : `npm run db:reset` dans `back/`.

### Pour payer en mode test

Utilisez la carte `4242 4242 4242 4242`, n'importe quelle date future et n'importe quel code.

## Les adresses utiles

| Adresse | Ce qu'on y trouve |
| --- | --- |
| [localhost:5173](http://localhost:5173) | Le site |
| [localhost:5173/admin/licences](http://localhost:5173/admin/licences) | L'espace de modération (lien « MODÉRATION » une fois connecté en administrateur) |
| [localhost:3000/api/docs](http://localhost:3000/api/docs) | La documentation de l'API, où l'on peut essayer chaque route |
| [localhost:3000/api/health](http://localhost:3000/api/health) | L'état de l'API et de la base |
| [localhost:5173/sitemap.xml](http://localhost:5173/sitemap.xml) | Le plan du site pour les moteurs de recherche |

## Sauvegarder la base

```bash
./scripts/backup-database.sh                                  # crée backups/bazardim-<date>.dump (garde les 7 dernières)
./scripts/restore-database.sh backups/<fichier>.dump essai    # restaure dans une base d'essai pour vérifier
./scripts/restore-database.sh backups/<fichier>.dump          # ⚠️ remplace la base bazardim (confirmation demandée)
```

Rien à installer : les outils de PostgreSQL tournent dans le conteneur. Une fois le site en ligne,
la sauvegarde serait lancée chaque nuit et copiée sur un autre serveur.
