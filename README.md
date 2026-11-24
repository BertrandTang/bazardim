# Bazardim

Marketplace entre collectionneurs pour acheter et vendre des figurines, figurines articulées et statues.

Projet fil rouge de la certification **Développeur Full Stack** (RNCP 38606).

| Dossier | Contenu | Documentation |
| --- | --- | --- |
| [`front/`](front/) | Application React 19 + Vite + Material UI | [front/README.md](front/README.md) |
| [`back/`](back/) | API REST Node.js + Express 5 + PostgreSQL | [back/README.md](back/README.md) |
| [`todo.md`](todo.md) | Ce qu'il reste à faire pour la certification | |

## Démarrage rapide

Prérequis : Node.js 22+, Docker Desktop.

```bash
cp .env.example .env                       # puis choisir POSTGRES_PASSWORD
docker compose up -d                       # base PostgreSQL + Mailpit (e-mails de dev : http://localhost:8025)

cd back
cp .env.example .env                       # puis remplir DATABASE_URL, TEST_DATABASE_URL, JWT_SECRET et SEED_DEMO_PASSWORD
npm install && npm run db:reset && npm run dev   # API sur http://localhost:3000

cd ../front
npm install && npm run dev                 # site sur http://localhost:5173
```

L'API et le front doivent tourner **en même temps** (deux terminaux) : en développement,
le front transmet à l'API toutes les requêtes `/api/...` (voir `front/vite.config.js`).

Comptes de démonstration : `collectionneurdu92@example.com`, administrateur : `admin@example.com`.
Leur mot de passe est celui que vous avez choisi dans `back/.env` (`SEED_DEMO_PASSWORD`).
Le compte administrateur a toujours la double authentification : le code de connexion arrive dans Mailpit (voir ci-dessous).
Pour repartir des données d'origine : `npm run db:reset` dans `back/`.

## Liens utiles en développement

Une fois `docker compose up -d` lancé et l'API et le front démarrés :

| Lien | Contenu |
| --- | --- |
| [http://localhost:5173](http://localhost:5173) | Le site Bazardim (front React) |
| [http://localhost:3000/api/docs](http://localhost:3000/api/docs) | Documentation interactive de l'API (Swagger) |
| [http://localhost:3000/api/health](http://localhost:3000/api/health) | État de l'API et de la base de données (`{ "status": "ok" }`) |
| [http://localhost:8025](http://localhost:8025) | **Mailpit** : les e-mails envoyés par l'API (codes de double authentification) |
| [http://localhost:5173/sitemap.xml](http://localhost:5173/sitemap.xml) | Plan du site pour les moteurs de recherche (généré par l'API) |

## E-mails : Mailpit en développement, un vrai service en production

L'API envoie des e-mails (codes de double authentification) avec **nodemailer**.

- **En développement**, ils partent vers **Mailpit**, une fausse boîte mail lancée par `docker compose up -d`.
  Mailpit **attrape tous les e-mails, quelle que soit l'adresse du destinataire** : même avec votre vraie adresse,
  rien n'arrive dans votre vraie boîte mail. On les lit sur [http://localhost:8025](http://localhost:8025).
  Pratique pour développer et pour la démonstration : aucun risque d'envoyer un e-mail à un vrai utilisateur.
- **Dans les tests automatiques**, aucun e-mail n'est envoyé : l'envoi est simulé (`vi.mock`) et le test lit le code directement.
- **Pour recevoir de vrais e-mails** (en production, ou pour essayer avec votre propre adresse), il faut un service d'envoi
  (Brevo, Mailjet… souvent gratuit pour quelques centaines d'e-mails par jour) et remplir les variables `SMTP_HOST`,
  `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` et `MAIL_FROM` dans `back/.env` (voir `back/.env.example`).
  Les e-mails partent alors réellement, vers l'adresse de chaque compte.

## Secrets

Aucun mot de passe ni clé secrète n'est commité : ils sont dans les fichiers `.env`
(racine et `back/`), ignorés par Git. Les fichiers `.env.example` montrent les variables à remplir.

## Sauvegarde et restauration de la base

```bash
./scripts/backup-database.sh                                  # crée backups/bazardim-<date>.dump (7 dernières gardées)
./scripts/restore-database.sh backups/<fichier>.dump essai    # vérifie la sauvegarde dans une base d'essai
./scripts/restore-database.sh backups/<fichier>.dump          # ⚠️ remplace la base bazardim (confirmation demandée)
```

`pg_dump` et `pg_restore` sont lancés dans le conteneur de la base : rien à installer.
Le dossier `backups/` contient des données personnelles : il est ignoré par Git.
En production, la sauvegarde est planifiée chaque nuit (cron) et copiée sur un autre serveur.
