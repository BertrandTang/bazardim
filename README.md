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
docker compose up -d                       # base de données PostgreSQL

cd back
cp .env.example .env                       # puis remplir JWT_SECRET
npm install && npm run db:reset && npm run dev   # API sur http://localhost:3000

cd ../front
npm install && npm run dev                 # site sur http://localhost:5173
```

> Le front n'utilise pas encore l'API : il fonctionne avec des données de démonstration
> stockées dans le navigateur. Le branchement est la prochaine étape (voir `todo.md`).
