# Image Docker de l'API Bazardim, prête pour la production.
#
# Construire l'image :   docker build -t bazardim-api ./back
# Ou, avec la base :     docker compose --profile api up -d --build   (voir docker-compose.yml)
#
# Une image contient tout ce qu'il faut pour lancer l'API (Node.js, dépendances, code) :
# elle tourne de la même façon sur n'importe quel serveur, comme sur ce poste.

# Image de base : Node.js 22 sur Alpine Linux, une distribution très légère (≈ 50 Mo).
FROM node:22-alpine

# Mode production : Express désactive les messages de débogage, le cookie de connexion passe en "secure".
ENV NODE_ENV=production

# Dossier de travail dans le conteneur.
WORKDIR /app

# 1. On copie d'abord SEULEMENT package.json et package-lock.json, puis on installe les dépendances.
#    Docker garde chaque étape en cache : tant que les dépendances ne changent pas,
#    cette étape (la plus longue) n'est pas refaite quand on modifie le code.
#    --omit=dev : pas d'outils de développement (tests, lint...) → image plus petite et moins de failles possibles.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 2. Puis le code de l'API.
COPY src ./src

# Dossiers où l'API écrit (images envoyées, fichiers de log), donnés à l'utilisateur "node".
RUN mkdir -p uploads logs && chown node:node uploads logs

# Sécurité : l'API ne tourne pas en administrateur (root) mais avec l'utilisateur "node" fourni par l'image.
# Si une faille permettait de prendre la main sur l'API, l'attaquant aurait des droits limités.
USER node

# Port sur lequel l'API écoute (documentation : la publication du port se fait au lancement).
EXPOSE 3000

# Docker vérifie toutes les 30 secondes que l'API répond (route /api/health, qui teste aussi la base).
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/api/health || exit 1

# Commande lancée au démarrage du conteneur. Les variables d'environnement (DATABASE_URL, JWT_SECRET...)
# sont fournies au lancement : aucun secret n'est enregistré dans l'image.
CMD ["node", "src/server.js"]
