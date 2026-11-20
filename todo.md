# TODO — Certification Développeur Full Stack (RNCP 38606)

Projet fil rouge : **Bazardim**, marketplace de figurines entre collectionneurs.

## État des lieux (20/11/2026)

| Partie | État |
| --- | --- |
| Front-end (React) | ✅ Fonctionnel : catalogue, filtres, recherche, fiche produit, panier, favoris, vente / modification / suppression d'annonce, profil, avis vendeurs, inscription / connexion. Données simulées dans le localStorage. |
| Back-end | ❌ **Dossier `back/` vide** : pas d'API, pas de base de données, pas d'authentification réelle. |
| Tests | ❌ Aucun test (front et back). |
| CI / industrialisation | ⚠️ ESLint configuré (`npm run lint` : 0 erreur). Pas de CI, pas de tests automatisés. |
| Dossier écrit (bloc 1) | ❓ À vérifier / produire (voir plus bas). |

### Les 5 priorités

1. **Construire le back-end** (API REST + base de données + authentification) : c'est tout le bloc 3, rien n'existe.
2. **Écrire les tests** front et back avec **≥ 50 % de couverture** (C18, C25) : critère chiffré, éliminatoire.
3. **Paiement Stripe** + stratégie de monétisation (C23).
4. **Consommer une API tierce** depuis le front (C17 / E12) : rien actuellement.
5. **Conformité RGPD** : bannière cookies, politique de confidentialité, mentions légales, demande d'accès aux données, double opt-in (C11).

---

## Bloc 1 — Concevoir et modéliser (évalué sur dossier écrit uniquement)

Tous ces livrables vont dans le dossier de validation. Cocher quand le document existe et est relu.

- [ ] **E1 / C1–C3** — Synthèse de la demande client : public cible (collectionneurs, vendeurs particuliers), besoins SEO, sécurité, contraintes.
- [ ] **C2** — Prendre du recul sur la demande : proposer des améliorations (éco-conception, accessibilité / inclusion, ex : vendeurs malvoyants, connexion lente).
- [ ] **E2 / C3** — Planning prévisionnel (diagramme de Gantt ou roadmap de sprints) + ébauche de budget (jours × TJM, hébergement, nom de domaine, frais Stripe).
- [ ] **E3** — Note de préconisations techniques : justifier React / Vite / MUI, le choix du back (Node/Express ? NestJS ?), PostgreSQL, Stripe, l'hébergeur.
- [ ] **E4 / C5** — Procédure d'installation de l'environnement de dev : Git (branches, conventions de commit), IDE (VS Code + extensions), **virtualisation locale avec Docker / docker-compose** (front + back + base de données). ⚠️ La virtualisation est explicitement demandée.
- [ ] **E5 / C4** — Note justifiant la méthode agile choisie (Scrum ou Kanban adapté à un développeur seul).
- [ ] **E6 / C4** — Trame de compte rendu (ex : modèle de « sprint review » / « daily ») correspondant à la méthode choisie.
- [ ] **E7 / C6** — Maquette wireframe d'au moins une vue (Figma, Balsamiq...). Vérifier que le front correspond aux maquettes (le carrousel d'accueil `HeroCarousel` a été supprimé car il n'était pas utilisé : le remettre s'il est sur la maquette).
- [ ] **E8 / C7, C8, C10** — Dossier de conception :
  - [ ] Diagramme de cas d'utilisation (UML) couvrant toutes les fonctionnalités.
  - [ ] Diagramme de classes (analyse + conception).
  - [ ] MCD / MLD (Merise) ou diagramme entité-association + schéma de la base. Entités probables : `User`, `Product`, `Category`, `Licence`, `Character`, `Tag`, `Review`, `Like`, `Order`, `OrderItem`, `Payment`.
  - [ ] Schéma d'architecture logicielle (front SPA ↔ API REST ↔ base de données ↔ Stripe).
- [ ] **C9** — Architecture des données : cycle de vie (collecte → stockage → suppression), sauvegardes et restauration de la base.
- [ ] **E9 / C11** — Audit RGPD (sur le site fourni par l'école).
- [ ] **E10 / C12** — Méthodologie de veille technologique : sources (blogs React, Node, OWASP, newsletters...), fréquence, outil (Feedly, Notion...), exemples concrets appliqués au projet.

---

## Bloc 2 — Front-end (dossier + soutenance 10 min)

### C13 / C15 — Interface, UX et accessibilité

- [ ] Faire un audit d'accessibilité (Lighthouse, extension **axe DevTools** ou **WAVE**) et viser 0 erreur bloquante ; mettre le rapport dans le dossier.
- [ ] Contraste : le violet `#6d35ff` sur le bleu `#b9e9ff` est à ≈ 4,5:1, **juste à la limite** du niveau AA ; les textes de 11 px des cartes produit sont trop petits. Foncer légèrement le violet ou agrandir ces textes.
- [ ] Menus déroulants CATEGORIES / LICENCES : ils s'ouvrent au survol, ce qui marche mal sur mobile (tactile). Prévoir un menu « burger » ou un clic pour ouvrir.
- [ ] Ajouter une **page 404** (route `path="*"` dans `App.jsx`).
- [ ] Ajouter un `<h1>` sur la page d'accueil (aujourd'hui seule la liste de produits est affichée).
- [ ] Tester la navigation complète au clavier (Tab / Entrée / Échap) et avec un lecteur d'écran (VoiceOver sur Mac : Cmd + F5).
- [ ] Vérifier que **tous les cas d'utilisation** du dossier de conception sont implémentés (commande, historique d'achats, messagerie entre utilisateurs ? tri par prix ? pagination ?).

### C14 — Charte graphique

- [ ] Documenter la charte dans le dossier (couleurs, typographies, logo, formes « coins arrondis en biais »). Les couleurs sont centralisées dans `front/src/main.css` (`--color-primary`, `--color-accent`, `--color-surface`).

### C16 — Qualité, sécurité, éco-conception

- [x] Analyse statique : ESLint (`npm run lint`).
- [ ] Ajouter **SonarCloud** (gratuit pour les dépôts publics) ou SonarQube pour un rapport de qualité à montrer au jury.
- [ ] Ajouter **Prettier** pour un formatage automatique et uniforme du code.
- [ ] Sécurité (à configurer au déploiement) : HTTPS / certificat SSL, en-têtes HTTP de sécurité (CSP, `X-Content-Type-Options`, `Strict-Transport-Security`...), CORS côté API. Vérifier avec securityheaders.com et Mozilla Observatory.
- [ ] `npm audit` sans vulnérabilité ; outil de mise à jour des dépendances (**Dependabot** sur GitHub).
- [ ] Supprimer le stockage des mots de passe en clair dans le localStorage (disparaîtra avec le vrai back-end : le front ne doit garder qu'un jeton ou un cookie `httpOnly`).
- [ ] Éco-conception : le JavaScript fait 513 Ko → découper par page avec `React.lazy()` + `<Suspense>`. Mesurer avec **EcoIndex** / GreenIT-Analysis et mettre le score dans le dossier.
- [x] Images de démonstration redimensionnées (41 Mo → 2,3 Mo). À faire aussi : convertir en **WebP**, et redimensionner les images envoyées par les vendeurs (côté back).
- [ ] Tester sur Chrome, Firefox, Safari et sur mobile (compatibilité navigateurs).

### C17 / E12 — Consommer une API tierce ⚠️ rien actuellement

- [ ] Consommer **votre propre API** (back-end) avec `fetch` + authentification (JWT ou cookie de session).
- [ ] Consommer **une API tierce**. Idées adaptées au projet :
  - **API Adresse** (api-adresse.data.gouv.fr, gratuite, sans clé) : autocomplétion de l'adresse de livraison au moment de la commande ;
  - API de recherche par **code EAN** pour pré-remplir la fiche produit à la mise en vente ;
  - **Stripe** (paiement) compte aussi comme service tiers.
- [ ] Justifier dans le dossier le format choisi (REST + JSON) et la gestion des erreurs réseau (message à l'utilisateur, état de chargement).

### C18 / E13 — Tests front ⚠️ couverture ≥ 50 % obligatoire

- [ ] Installer **Vitest** + **React Testing Library** + `@vitest/coverage-v8`, ajouter le script `npm test`.
- [ ] Rédiger un **plan de tests** (tableau : fonctionnalité / scénario / résultat attendu) cohérent avec les cas d'utilisation.
- [ ] Tests unitaires faciles pour commencer : `utils/productHelpers.js`, les contextes (`CartContext` : ajout, quantité, suppression ; `AuthContext` : connexion, inscription), `ProductForm` (validation).
- [ ] Tests de composants : `ProductCard`, `NavBar` (recherche), pages `Auth` et `SignUp`.
- [ ] Optionnel mais apprécié : tests de bout en bout avec **Playwright** (parcours achat, mise en vente).
- [ ] Capture du rapport de couverture (≥ 50 %) dans le dossier.

### C19 / E14 — Industrialisation front

- [ ] **GitHub Actions** : à chaque push / pull request → `npm ci`, `npm run lint`, `npm test`, `npm run build`.
- [x] Gestion des dépendances : `package.json` + `package-lock.json` (outils de build rangés dans `devDependencies`).
- [ ] Optimisation du build : découpage du code (`React.lazy`), compression, analyse de la taille du bundle (`rollup-plugin-visualizer`).

### C20 — SEO ⚠️ ≥ 70 % des critères techniques

- [x] `lang="fr"`, `<title>` et `<meta name="description">` dans `index.html`.
- [ ] Titre et description **différents pour chaque page** (React 19 permet d'écrire `<title>` et `<meta>` directement dans un composant).
- [ ] `robots.txt` et `sitemap.xml` dans `front/public/`.
- [ ] Données structurées **schema.org `Product`** (JSON-LD) sur la fiche produit.
- [ ] Balises Open Graph (partage sur les réseaux sociaux).
- [ ] Limite d'une SPA : le contenu est généré en JavaScript. L'expliquer au jury et proposer une solution (pré-rendu, ou migration vers un framework SSR comme Next.js / React Router en mode framework).
- [ ] Outils de mesure d'audience **respectueux du RGPD** : **Matomo** ou **Plausible** (pas de bannière nécessaire avec Matomo en mode exempté). Intégration fonctionnelle à montrer.
- [ ] Score **Lighthouse SEO** dans le dossier.

---

## Bloc 3 — Back-end (dossier + soutenance 10 min) ⚠️ tout est à faire

Stack suggérée pour rester en JavaScript : **Node.js + Express** (ou NestJS) + **PostgreSQL** + **Prisma** (ORM). À justifier dans la note E3.

### C21 / E15 — Couche de persistance et sécurité en profondeur

- [ ] Créer la base PostgreSQL (dans Docker) et le schéma à partir du MLD (migrations Prisma).
- [ ] Script de « seed » qui importe `figures.json` et `profiles.json`.
- [ ] Mots de passe **hachés** avec **bcrypt** ou **argon2**.
- [ ] Filtrage / validation des entrées (**zod** ou **Joi**) et des sorties (ne jamais renvoyer le mot de passe).
- [ ] Authentification forte : JWT en cookie `httpOnly` + `secure` + `sameSite`, ou sessions ; optionnel : double authentification (2FA).
- [ ] Contrôle d'accès : seul le propriétaire modifie / supprime son annonce ou son avis (aujourd'hui vérifié seulement côté front).
- [ ] Journalisation (**pino** ou **winston**) et monitoring.
- [ ] Validation de la configuration au démarrage (variables d'environnement dans `.env`, jamais commitées ; fournir un `.env.example`).
- [ ] Optionnel : cache (**Redis**) sur la liste des produits.

### C22 / E16 — Développement de l'API

- [ ] Routes REST couvrant tous les cas d'utilisation, par exemple :
  - `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
  - `GET /products` (filtres : catégorie, licence, recherche, pagination), `GET /products/:id`, `POST`, `PUT`, `DELETE /products/:id`
  - `GET/PUT /users/:id`, `GET/POST/PUT/DELETE /users/:id/reviews`
  - `GET/POST/DELETE /likes`, `POST /orders`, `GET /orders`
- [ ] Upload d'images d'annonces (**multer** + redimensionnement avec **sharp**).
- [ ] Organisation du code : `routes/` → `controllers/` → `services/` → accès aux données.
- [ ] Brancher le front : remplacer les fonctions marquées `⚠️ TEMPORAIRE` dans `front/src/context/` par des appels `fetch` vers l'API.

### C23 / E17 — Paiement et monétisation

- [ ] Intégrer **Stripe Checkout** en mode test (paiement depuis le panier, bouton « Commander » actuellement désactivé).
- [ ] Webhook Stripe pour confirmer le paiement côté serveur (ne jamais faire confiance au front pour le montant : recalculer le total côté back).
- [ ] Marketplace entre particuliers → étudier **Stripe Connect** (reversement aux vendeurs).
- [ ] Rédiger la stratégie de monétisation : commission sur chaque vente (ex : 5 %), mise en avant payante d'annonces, abonnement vendeur pro...
- [ ] CGV / conditions générales d'utilisation (contraintes légales de la vente en ligne).

### C24 / E18 — API sécurisée pour des services tiers

- [ ] Authentification + autorisation (rôles `user` / `admin`), **helmet**, **CORS** restreint au domaine du front, **rate limiting** (`express-rate-limit`).
- [ ] Toutes les entrées validées ; données sensibles chiffrées (HTTPS en transit, mots de passe hachés).
- [ ] Documentation **OpenAPI / Swagger** (`swagger-ui-express`) — aussi demandée en C27.

### C25 / E19 — Tests back ⚠️ couverture ≥ 50 %

- [ ] Plan de tests cohérent avec les spécifications.
- [ ] Tests unitaires (services) + tests d'intégration des routes avec **Vitest/Jest + supertest** sur une base de test.
- [ ] Rapport de couverture ≥ 50 % dans le dossier.

### C26 / E20 — Industrialisation back

- [ ] CI GitHub Actions : lint, tests, build, `npm audit`.
- [ ] Image **Docker** de production (multi-stage) ; scan de sécurité de l'image (Trivy) et des dépendances.

### RGPD dans l'application (C11, à implémenter)

- [ ] Bannière de consentement aux cookies (**tarteaucitron.js**, open source) si un traceur non exempté est utilisé.
- [ ] Pages **Politique de confidentialité** et **Mentions légales** (liens dans le footer).
- [ ] Formulaire de **demande d'accès / export / suppression** des données personnelles + traitement côté back.
- [ ] **Double opt-in** à l'inscription : e-mail de confirmation avec lien de validation avant d'activer le compte.
- [ ] Suppression de compte depuis le profil.
- [x] L'e-mail des vendeurs n'est plus affiché sur leur profil public.

---

## Bloc 4 — Déploiement et maintien en production (mise en situation de 5 h)

L'épreuve porte sur une application **fournie le jour J**, pas sur Bazardim. Mais déployer Bazardim est le meilleur entraînement.

- [ ] **C29 / E21** — Choisir un hébergeur cloud (OVH, Scaleway, AWS, Azure...) et argumenter : coûts, dimensionnement, **élasticité** (autoscaling), hébergement des données en UE (RGPD).
- [ ] **C30 / E22** — Environnements **pré-production** et **production** ; un environnement conteneurisé (Docker) ; un **gestionnaire de configuration** (Ansible) ; un **hôte bastion** pour l'accès SSH.
- [ ] **C28 / E23** — Nom de domaine, DNS, certificats **Let's Encrypt** (Certbot ou Caddy) sur les deux environnements.
- [ ] **C31 / E24** — Déploiement automatisé (GitHub Actions → serveur), identique en pré-prod et en prod.
- [ ] **C32 / E25–E26** — Logs centralisés (Loki / ELK), supervision et alertes (Uptime Kuma, Prometheus + Grafana), sauvegardes automatiques de la base testées (restauration).
- [ ] **C32 / E27–E28** — S'entraîner à trouver bugs et failles (OWASP Top 10, `npm audit`, composants obsolètes).
- [ ] **C27 / E29** — Documentation générée depuis le code : les fonctions ont des commentaires **JSDoc** (`/** ... */`) → générer la doc avec **JSDoc** ou **TypeDoc**. Tenir un **CHANGELOG.md** (versions, du plus récent au plus ancien).

---

## Hygiène du projet et Git

- [ ] Fusionner la branche `cleanup` (ce nettoyage) dans `main`, puis supprimer les branches déjà fusionnées (`mylikestab`, `productdelete`, `productview`, `searchmechanism`). La branche `comments` est contenue dans `cleanup`.
- [ ] Messages de commit explicites, par exemple au format **Conventional Commits** : `feat: ajout du paiement Stripe`, `fix: ...`. Éviter « update » ou « whatever ».
- [ ] Travailler par branche + Pull Request, même seul (ça se montre bien au jury).
- [ ] Ajouter un `README.md` à la racine : présentation du projet, architecture front/back, lancement avec `docker compose up`.
- [ ] Ajouter un `.gitignore` à la racine (`.env`, `node_modules`, `.DS_Store`...).

---

## Nettoyage déjà réalisé (branche `cleanup`)

À réutiliser dans le dossier pour montrer la démarche qualité :

- **Bugs corrigés** : deux paniers différents coexistaient (`CartProvider` déclaré deux fois) ; une annonce modifiée n'était à jour que sur sa page (pas sur l'accueil ni le profil) ; un même produit avait une image différente selon la page ; le mode sombre affichait du texte blanc sur fond blanc ; l'inscription n'enregistrait rien.
- **Architecture** : toutes les données partagées passent par des contextes React (`Products`, `Reviews` ajoutés) et un hook commun `useLocalStorageState`. Les compteurs `productsVersion` et les événements personnalisés ont été supprimés.
- **Duplication supprimée** : un seul formulaire produit (`ProductForm`) pour la vente et la modification ; une seule carte produit (fusion avec `ProductCardOwner`) ; un formulaire d'avis réutilisable ; styles CSS en double supprimés ; couleurs centralisées en variables CSS.
- **Code mort supprimé** : `CategoryBar`, `HeroCarousel`, `categories.json`, champs alternatifs inutilisés (`product_title`, `product_price`...).
- **Accessibilité** : le focus clavier est de nouveau visible (il était masqué partout), messages d'erreur dans la page au lieu de `alert()`, libellés ARIA sur la recherche, le panier et les boutons +/−.
- **Qualité** : ESLint installé et configuré (22 problèmes → 0), noms de variables explicites, commentaires et JSDoc.
- **Performance** : images de démonstration de 41 Mo à 2,3 Mo, chargement différé des images (`loading="lazy"`).

> Note : les nouvelles clés du localStorage (`products`, `users`, `cartItems`...) remplacent les anciennes.
> Les produits et le panier créés pendant vos tests précédents n'apparaîtront plus.
