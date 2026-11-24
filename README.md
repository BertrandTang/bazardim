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
Pour repartir des données d'origine : `npm run db:reset` dans `back/`.

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
