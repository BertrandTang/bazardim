# TODO — Certification Développeur Full Stack (RNCP 38606)

Projet fil rouge : **Bazardim**, marketplace de figurines entre collectionneurs.

<!-- progression:debut -->
**Progression globale : `████████████████░░░░` 81 % (63 / 78 tâches)**

| Partie | Progression | Tâches |
| --- | --- | --- |
| Bloc 2 — Front-end | `████████████████░░░░` 78 % | 28 / 36 |
| Bloc 3 — Back-end | `██████████████████░░` 88 % | 29 / 33 |
| RGPD dans l'application | `████████████████░░░░` 80 % | 4 / 5 |
| Hygiène du projet et Git | `██████████░░░░░░░░░░` 50 % | 2 / 4 |

**Hors progression** (suivi à part, voir en bas du fichier) :

- Dossier écrit : 0 / 27
- Bloc 4 — Entraînement : 0 / 7

_Calcul automatique : chaque case compte pour une tâche, quelle que soit sa taille._
_Après avoir coché des cases : `node scripts/update-todo-progress.mjs`_
<!-- progression:fin -->

## État des lieux (23/11/2026)

| Partie | État |
| --- | --- |
| Front-end (React) | ✅ Branché sur l'API : catalogue, filtres, recherche, fiche produit, panier (frais de service compris), favoris, vente / modification / suppression d'annonce, profil, inscription / connexion, messagerie, pages légales. Responsive mobile. |
| Back-end | ✅ API REST Express + PostgreSQL (Docker) : authentification, comptes, annonces, favoris, messagerie, commandes et paiement Stripe (mode test), frais de service, sitemap. Documentation Swagger sur `/api/docs`. Dockerfile. |
| Tests | ✅ Back : 63 tests, 97 % de couverture. ✅ Front : 92 tests, 90 % de couverture. Plan de tests : [docs/plan-de-tests.md](docs/plan-de-tests.md). |
| CI / industrialisation | ✅ GitHub Actions : lint, formatage (Prettier), audit, tests avec couverture et build, front et back. |
| Dossier écrit | ❌ À rédiger : voir la partie « Dossier écrit » en bas de ce fichier (hors progression). |

Périmètre fonctionnel retenu : comptes, annonces (création, modification, suppression), recherche et filtres,
favoris, panier, messagerie simple (boîte de réception, sans discussion en direct), commande et paiement.

**Organisation de ce fichier**

- **Partie 1 — À coder ou à vérifier** : c'est la seule partie comptée dans la progression ci-dessus.
- **Partie 2 — Dossier écrit** et **entraînement au bloc 4** : suivis à part, après le marqueur `hors-progression`.

---

# Partie 1 — À coder ou à vérifier (comptée dans la progression)

## Bloc 2 — Front-end

### C13 / C15 — Interface, UX et accessibilité

- [x] Contrastes conformes WCAG AA (≥ 4,5:1) : violet `#5b2be0`, rose `#d6005a`, étiquettes et boutons de suppression foncés ; textes de 11 px passés à 12-13 px.
- [x] Menus CATEGORIES / LICENCES utilisables à la souris, au doigt et au clavier (Entrée, Échap, `aria-expanded`) : `components/NavBar/NavBarDropdown.jsx`.
- [x] Page **404** (route `path="*"`).
- [x] Un `<h1>` sur chaque page (accueil : adapté à la catégorie / licence) + lien « Aller au contenu » pour le clavier.
- [x] Navigation au clavier testée automatiquement (menus, lien d'évitement, formulaires).
- [x] **Responsive mobile** : toutes les pages vérifiées à 320 px, 375 px et 1280 px de large, sans défilement horizontal.
- [ ] Audit d'accessibilité (Lighthouse, **axe DevTools** ou **WAVE**) : viser 0 erreur bloquante et corriger ce qui ressort. Commande (dans `front/`, après `npm run build && npm run preview`) :
  `npx lighthouse http://localhost:4173 --view --only-categories=performance,accessibility,best-practices,seo`
- [ ] Tester avec un lecteur d'écran (VoiceOver sur Mac : Cmd + F5).
- [ ] Vérifier que **tous les cas d'utilisation** du dossier de conception sont implémentés (une fois le diagramme de cas d'utilisation dessiné).

### C16 — Qualité, sécurité, éco-conception

- [x] Analyse statique : ESLint (`npm run lint`).
- [x] **Prettier** (front et back) : `npm run format`, vérifié par la CI.
- [x] `npm audit` sans vulnérabilité (vérifié par la CI).
- [x] Plus aucun mot de passe ni donnée de compte dans le localStorage : la connexion passe par un cookie `httpOnly` déposé par l'API (illisible par le JavaScript de la page).
- [x] Éco-conception : pages chargées à la demande (`React.lazy`), Material UI n'est plus chargé sur la page d'accueil : JavaScript initial de 163 Ko → 91 Ko compressés (−44 %).
- [x] Images de démonstration redimensionnées (41 Mo → 2,3 Mo).
- [x] **CSP** (Content Security Policy) ajoutée au build du front (`vite.config.js`) : scripts et images du site uniquement, appels vers l'API et l'API Adresse ; vérifiée dans le navigateur (aucune violation).
- [ ] **HTTPS** (certificat SSL) et en-têtes de sécurité du front, au déploiement ; vérifier avec securityheaders.com et Mozilla Observatory.
- [ ] Mesurer avec **EcoIndex** / GreenIT-Analysis.
- [ ] Tester sur Chrome, Firefox, Safari et sur un vrai téléphone (compatibilité navigateurs).

### C17 / E12 — Consommer une API

- [x] Consommer **votre propre API** (back-end) avec `fetch` + authentification (JWT dans un cookie `httpOnly`) : `front/src/services/api.js`. Messages d'erreur de l'API affichés dans les formulaires, états de chargement, serveur injoignable géré.
- [x] Consommer **une API tierce** : autocomplétion de l'adresse de livraison dans le panier avec l'**API Adresse (Base Adresse Nationale)**, API officielle de l'État ([fiche data.gouv.fr](https://www.data.gouv.fr/dataservices/api-adresse-base-adresse-nationale-ban)), `services/addressApi.js` + `components/AddressAutocomplete/`.

### C18 / E13 — Tests front ⚠️ couverture ≥ 50 % obligatoire

- [x] **Vitest** + **React Testing Library** + couverture (`npm test`, `npm run test:coverage`) : 92 tests, 90 % des lignes, seuil bloquant à 50 %.
- [x] **Plan de tests** front et back : [docs/plan-de-tests.md](docs/plan-de-tests.md).
- [x] Tests unitaires : utilitaires, hook `useLocalStorageState`, contextes, service d'adresses, frais de service.
- [x] Tests de composants et de pages : cartes, formulaires, barre de navigation, toutes les pages.

### C19 / E14 — Industrialisation front

- [x] **GitHub Actions** : lint + build à chaque push (`.github/workflows/ci.yml`).
- [x] Tests du front (avec couverture) et vérification du formatage dans la CI.
- [x] Gestion des dépendances : `package.json` + `package-lock.json` (outils de build rangés dans `devDependencies`).
- [x] Optimisation du build : chaque page est chargée à la demande (`React.lazy`).

### C20 — SEO ⚠️ ≥ 70 % des critères techniques

- [x] `lang="fr"`, `<title>` et `<meta name="description">` dans `index.html`.
- [x] Titre, description et `og:title` **propres à chaque page** (`components/PageMetadata`), `noindex` sur les pages privées.
- [x] `robots.txt` (`front/public/`) et **`sitemap.xml` généré par l'API** avec les annonces en vente (⚠️ remplacer `www.bazardim.fr` dans `robots.txt` par le vrai domaine).
- [x] Données structurées **schema.org `Product`** (JSON-LD) sur la fiche produit : prix, état, vendeur, EAN.
- [x] Balises Open Graph (titre, description, image par page).
- [ ] Outil de **mesure d'audience respectueux du RGPD** (Matomo, Plausible, Umami…) : intégration fonctionnelle à montrer.
- [ ] Lancer l'audit **Lighthouse SEO** et corriger ce qui ressort.

## Bloc 3 — Back-end

Stack retenue : **Node.js + Express 5 + PostgreSQL (Docker) + SQL écrit à la main (`pg`)**.
Détails et liste des routes : [back/README.md](back/README.md).

### C21 / E15 — Couche de persistance et sécurité en profondeur

- [x] Base PostgreSQL dans Docker (`docker-compose.yml`) + base de test séparée.
- [x] Schéma normalisé (`back/database/schema.sql`) : contraintes `CHECK` / `UNIQUE` / clés étrangères, index, vue `product_details`.
- [x] Données de démo (`npm run db:reset`), en passant par la même validation que l'API.
- [x] Mots de passe hachés avec **bcrypt** ; jamais renvoyés par l'API.
- [x] Validation de toutes les entrées avec **zod** ; requêtes SQL paramétrées (anti-injection).
- [x] Authentification : JWT dans un cookie `httpOnly` + `SameSite=Lax` (+ `secure` en production).
- [x] Contrôle d'accès : propriétaire ou admin pour modifier / supprimer une annonce ; messages visibles par l'expéditeur et le destinataire seulement.
- [x] Journalisation avec **winston** (`src/config/logger.js`) : niveaux info / warn / error, erreurs écrites dans `back/logs/errors.log` ; une ligne par requête (`src/middlewares/requestLogger.js`) ; route `/api/health` pour la supervision.
- [x] Configuration validée au démarrage (`src/config/config.js`), `.env` ignoré par Git, `.env.example` fourni.
- [ ] **Authentification forte** (citée dans la C21) : l'implémenter (code TOTP pour les administrateurs) ou décider de seulement l'expliquer au jury.
- [ ] **Sauvegarde / restauration** de la base : script `pg_dump`, puis tester une restauration.

### C22 / E16 — Développement de l'API

- [x] Routes REST : auth, comptes, annonces (filtres + pagination), licences, favoris, messagerie, commandes, images, sitemap.
- [x] Organisation MVC : `routes/` → `controllers/` → `validators/` (données reçues) et `models/` (requêtes SQL).
- [x] **Front branché sur l'API** (`front/src/services/api.js`, proxy Vite vers `http://localhost:3000`).
- [x] **Messagerie** : contacter le vendeur, boîte de réception / messages envoyés, réponse, marquer comme lu, pastille des messages non lus.
- [x] Envoi d'images avec **multer** (`POST /api/uploads`, JPEG/PNG/WebP, 2 Mo max, nom de fichier aléatoire) : photo d'annonce obligatoire et photo de profil.
- [x] Annonce **vendue** : bandeau « Vendu », plus modifiable (409), le vendeur voit le pseudo de l'acheteur (`GET /api/orders/sales`).

### C23 / E17 — Paiement et monétisation

- [x] Tables `orders` / `order_items` (titre et prix copiés à l'achat) + routes `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`.
- [x] **Stripe Checkout** en mode test : bouton « Commander et payer » du panier, page de confirmation, onglet « Mes commandes » du profil. Total recalculé côté back (le front n'envoie aucun prix).
- [x] Webhook Stripe (`POST /api/stripe/webhook`, signature vérifiée) + vérification du paiement à l'affichage de la confirmation.
- [x] Modèle « pièce unique » (comme Vinted) : chaque annonce est ajoutée une seule fois au panier, sans quantité.
- [x] **Monétisation** : frais de service payés par l'acheteur (0,70 € + 5 %), calculés par le back, affichés dans le panier avant le paiement, envoyés à Stripe comme une ligne à part et enregistrés dans `orders.service_fee`.
- [x] Page **CGU / CGV** (`/conditions-generales`) : rôle d'intermédiaire, annonces, frais de service, paiement, livraison, rétractation entre particuliers, litiges ; lien dans le pied de page et dans le panier.
- [ ] Faire un vrai paiement de test à la main (carte `4242 4242 4242 4242`) et garder des captures.

### C24 / E18 — API sécurisée pour des services tiers

- [x] Authentification + autorisation (rôles `user` / `admin`), **helmet**, **CORS** limité au front, **limitation des tentatives** de connexion (`express-rate-limit`).
- [x] Toutes les entrées validées ; mots de passe hachés.
- [x] Documentation **OpenAPI / Swagger** : page interactive sur `/api/docs`, JSON sur `/api/docs.json` (`src/docs/openapi.js`).
- [ ] HTTPS en production (données chiffrées en transit) : au déploiement.

### C25 / E19 — Tests back

- [x] 63 tests d'intégration (Vitest + supertest) sur une vraie base PostgreSQL de test, **97 % de couverture** (seuil bloquant à 50 %).
- [x] Plan de tests back : [docs/plan-de-tests.md](docs/plan-de-tests.md).

### C26 / E20 — Industrialisation back

- [x] CI GitHub Actions : lint, `npm audit`, tests avec couverture (base PostgreSQL fournie par la CI).
- [x] **Prettier** vérifié par la CI.
- [x] **Dockerfile** de l'API (Node 22 Alpine, dépendances de production, utilisateur non root, healthcheck) + service `api` dans `docker-compose.yml` (`--profile api`).

## RGPD dans l'application (C11)

- [x] Suppression de compte depuis le profil (droit à l'effacement) : pop-up qui demande d'écrire « SUPPRIMER » et le mot de passe actuel ; annonces, favoris et messages supprimés, commandes conservées sans lien avec la personne.
- [x] L'e-mail des vendeurs n'est pas affiché sur leur profil public.
- [x] Pages **Mentions légales** (`/mentions-legales`) et **Politique de confidentialité** (`/confidentialite`), liens dans le pied de page.
- [x] Éditeur, directeur de publication et contact renseignés dans `front/src/data/legalInformation.js`.
- [ ] Renseigner l'hébergeur (nom, adresse, téléphone) dans `front/src/data/legalInformation.js` une fois le site mis en ligne.

## Hygiène du projet et Git

- [x] `README.md` et `.gitignore` à la racine.
- [x] Messages de commit au format **Conventional Commits** (`feat: …`, `fix: …`, `style: …`).
- [ ] Supprimer les anciennes branches déjà fusionnées (`backend`, `cleanup`, `comments`, `front-bloc2`, `mylikestab`, `productdelete`, `productview`, `searchmechanism`, `feat/*`, `fix/*`).
- [ ] Travailler par branche + Pull Request sur GitHub, même seul (ça se montre bien au jury).

---

<!-- hors-progression -->

# Partie 2 — Hors progression

## Dossier écrit

À rédiger dans le dossier de validation. Cocher quand le document existe et est relu.

### Bloc 1 — Concevoir et modéliser (évalué sur dossier uniquement)

- [ ] **E1 / C1–C3** — Synthèse de la demande client : public cible (collectionneurs, vendeurs particuliers), besoins SEO, sécurité, contraintes.
- [ ] **C2** — Prendre du recul sur la demande : proposer des améliorations (éco-conception, accessibilité / inclusion, ex : vendeurs malvoyants, connexion lente).
- [ ] **E2 / C3** — Planning prévisionnel (diagramme de Gantt ou roadmap de sprints) + ébauche de budget (jours × TJM, hébergement, nom de domaine, frais Stripe).
- [ ] **E3** — Note de préconisations techniques : justifier React / Vite / MUI, Node / Express, PostgreSQL, Stripe, l'hébergeur.
- [ ] **E4 / C5** — Procédure d'installation de l'environnement de dev : Git (branches, conventions de commit), IDE (VS Code + extensions), **virtualisation locale avec Docker / docker-compose** (base de données + API).
- [ ] **E5 / C4** — Note justifiant la méthode agile choisie (Scrum ou Kanban adapté à un développeur seul).
- [ ] **E6 / C4** — Trame de compte rendu (ex : modèle de « sprint review » / « daily ») correspondant à la méthode choisie.
- [ ] **E7 / C6** — Maquette wireframe d'au moins une vue (Figma, Balsamiq...), conforme au front.
- [ ] **E8 / C7, C8, C10** — Dossier de conception :
  - [ ] Diagramme de cas d'utilisation (UML) couvrant toutes les fonctionnalités.
  - [ ] Diagramme de classes (analyse + conception).
  - [ ] MCD / MLD (Merise) ou diagramme entité-association : `users`, `products`, `licences`, `tags`, `product_tags`, `likes`, `messages`, `orders`, `order_items` (voir `back/database/schema.sql`).
  - [ ] Schéma d'architecture logicielle (front SPA ↔ API REST ↔ PostgreSQL ↔ Stripe / API Adresse).
- [ ] **C9** — Architecture des données : cycle de vie (collecte → stockage → suppression), sauvegardes et restauration de la base.
- [ ] **E9 / C11** — Audit RGPD (sur le site fourni par l'école).
- [ ] **C11** — Propositions RGPD pour Bazardim : outil de consentement aux cookies (ex : tarteaucitron.js, inutile tant qu'il n'y a que des cookies strictement nécessaires), formulaire de demande d'accès aux données et son traitement, **double opt-in** à l'inscription (e-mail de confirmation).
- [ ] **E10 / C12** — Méthodologie de veille technologique : sources (blogs React, Node, OWASP, newsletters...), fréquence, outil (Feedly, Notion...), exemples concrets appliqués au projet.

### Blocs 2 et 3 — Justifications et preuves

- [ ] **C14** — Charte graphique : couleurs (`front/src/index.css` : `--color-primary`, `--color-accent`, `--color-surface`), typographies, logo, formes « coins arrondis en biais ».
- [ ] **C13 / C16** — Rapports Lighthouse (accessibilité, performance, bonnes pratiques) et score EcoIndex, avec les corrections faites.
- [ ] **C16** — Expliquer la sécurité du front : CSP, HTTPS, en-têtes, CORS.
- [ ] **C17** — Justifier le format choisi (REST + JSON) et la gestion des erreurs réseau (message à l'utilisateur, état de chargement).
- [ ] **C18 / C25** — Plans de tests ([docs/plan-de-tests.md](docs/plan-de-tests.md)) + captures des rapports de couverture front et back.
- [ ] **C20** — Score Lighthouse SEO ; limite d'une SPA (contenu généré en JavaScript) et solution proposée (pré-rendu, ou framework SSR comme Next.js / React Router en mode framework) ; choix de l'outil de mesure d'audience.
- [ ] **C21** — Authentification forte : explication (2FA par code e-mail ou application TOTP), si elle n'est pas implémentée.
- [ ] **C23** — Stratégie de monétisation : frais de service (0,70 € + 5 %, comparaison avec Vinted), pistes (mise en avant payante, abonnement vendeur pro), évolution vers **Stripe Connect** (reversement automatique aux vendeurs) ; captures du paiement de test.
- [ ] **C22** — Évolutions prévues pour la production : stockage des images hors du serveur (stockage objet type S3 / OVH Object Storage), suppression des images inutilisées.
- [ ] Diapositives de la soutenance : 10 min front-end + 10 min back-end, avec démonstration.

### Démarche qualité (à réutiliser dans le dossier)

Nettoyage réalisé en début de projet (branche `cleanup`) :

- **Bugs corrigés** : deux paniers différents coexistaient (`CartProvider` déclaré deux fois) ; une annonce modifiée n'était à jour que sur sa page ; un même produit avait une image différente selon la page ; le mode sombre affichait du texte blanc sur fond blanc ; l'inscription n'enregistrait rien.
- **Architecture** : toutes les données partagées passent par des contextes React et un hook commun `useLocalStorageState`.
- **Duplication supprimée** : un seul formulaire produit (`ProductForm`) pour la vente et la modification ; une seule carte produit ; styles CSS en double supprimés ; couleurs centralisées en variables CSS.
- **Code mort supprimé** : `CategoryBar`, `HeroCarousel`, `categories.json`, champs inutilisés.
- **Accessibilité** : focus clavier de nouveau visible, messages d'erreur dans la page au lieu de `alert()`, libellés ARIA.
- **Qualité** : ESLint installé et configuré (22 problèmes → 0), noms de variables explicites, commentaires et JSDoc.
- **Performance** : images de démonstration de 41 Mo à 2,3 Mo, chargement différé des images (`loading="lazy"`).

## Bloc 4 — Entraînement

L'épreuve (mise en situation de 5 h) porte sur une application **fournie le jour J**, pas sur Bazardim. Déployer Bazardim reste le meilleur entraînement.

- [ ] **C29 / E21** — Choisir un hébergeur cloud (OVH, Scaleway, AWS, Azure...) et argumenter : coûts, dimensionnement, **élasticité** (autoscaling), hébergement des données en UE (RGPD).
- [ ] **C30 / E22** — Environnements **pré-production** et **production** ; un environnement conteneurisé (Docker) ; un **gestionnaire de configuration** (Ansible) ; un **hôte bastion** pour l'accès SSH.
- [ ] **C28 / E23** — Nom de domaine, DNS, certificats **Let's Encrypt** (Certbot ou Caddy) sur les deux environnements.
- [ ] **C31 / E24** — Déploiement automatisé (GitHub Actions → serveur), identique en pré-prod et en prod.
- [ ] **C32 / E25–E26** — Logs centralisés (Loki / ELK), supervision et alertes (Uptime Kuma, Prometheus + Grafana), sauvegardes automatiques de la base testées (restauration).
- [ ] **C32 / E27–E28** — S'entraîner à trouver bugs et failles (OWASP Top 10, `npm audit`, composants obsolètes).
- [ ] **C27 / E29** — Documentation générée depuis le code : commentaires **JSDoc** → générer la doc avec **JSDoc** ou **TypeDoc** ; tenir un **CHANGELOG.md** (versions, du plus récent au plus ancien).
