# TODO — Certification Développeur Full Stack (RNCP 38606)

Projet fil rouge : **Bazardim**, marketplace de figurines entre collectionneurs.

<!-- progression:debut -->
**Progression globale : `██████████░░░░░░░░░░` 50 % (52 / 105 tâches)**

| Partie | Progression | Tâches |
| --- | --- | --- |
| Bloc 1 — Concevoir et modéliser | `░░░░░░░░░░░░░░░░░░░░` 0 % | 0 / 16 |
| Bloc 2 — Front-end | `██████████████░░░░░░` 68 % | 26 / 38 |
| Bloc 3 — Back-end | `█████████████░░░░░░░` 63 % | 25 / 40 |
| Bloc 4 — Déploiement et maintien en production | `░░░░░░░░░░░░░░░░░░░░` 0 % | 0 / 7 |
| Hygiène du projet et Git | `█████░░░░░░░░░░░░░░░` 25 % | 1 / 4 |

_Calcul automatique : chaque case compte pour une tâche, quelle que soit sa taille._
_Après avoir coché des cases : `node scripts/update-todo-progress.mjs`_
<!-- progression:fin -->

## État des lieux (20/11/2026)

| Partie | État |
| --- | --- |
| Front-end (React) | ✅ Branché sur l'API : catalogue, filtres, recherche, fiche produit, panier, favoris, vente / modification / suppression d'annonce, profil, inscription / connexion, messagerie. |
| Back-end | ✅ API REST Express + PostgreSQL (Docker) : authentification, comptes, produits, favoris, messagerie. commandes et paiement Stripe (mode test). |
| Tests | ✅ Back : 54 tests, 95 % de couverture. ✅ Front : 81 tests, 89 % de couverture. Plan de tests : [docs/plan-de-tests.md](docs/plan-de-tests.md). |
| CI / industrialisation | ✅ GitHub Actions : lint, formatage (Prettier), audit, tests avec couverture et build, front et back. |
| Dossier écrit (bloc 1) | ❓ À vérifier / produire (voir plus bas). |

Périmètre fonctionnel retenu : comptes, annonces (création, modification, suppression), recherche et filtres,
favoris, panier, messagerie simple (boîte de réception, sans discussion en direct), commande et paiement.

### Les 4 priorités

1. **Conformité RGPD** : bannière cookies, politique de confidentialité, mentions légales, demande d'accès aux données, double opt-in (C11).
2. **Stratégie de monétisation et CGV** à rédiger (C23).
3. **Audits Lighthouse** (accessibilité, SEO, performance) à lancer et à mettre dans le dossier — commande dans la section C13.
4. **Dossier écrit du bloc 1** : rien n'est encore coché.

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
  - [ ] MCD / MLD (Merise) ou diagramme entité-association + schéma de la base. Entités : `User`, `Product`, `Licence`, `Tag`, `Like`, `Message` (déjà en base, voir `back/database/schema.sql`) + `Order`, `OrderItem`, `Payment` (à venir).
  - [ ] Schéma d'architecture logicielle (front SPA ↔ API REST ↔ base de données ↔ Stripe).
- [ ] **C9** — Architecture des données : cycle de vie (collecte → stockage → suppression), sauvegardes et restauration de la base.
- [ ] **E9 / C11** — Audit RGPD (sur le site fourni par l'école).
- [ ] **E10 / C12** — Méthodologie de veille technologique : sources (blogs React, Node, OWASP, newsletters...), fréquence, outil (Feedly, Notion...), exemples concrets appliqués au projet.

---

## Bloc 2 — Front-end (dossier + soutenance 10 min)

### C13 / C15 — Interface, UX et accessibilité

- [ ] Faire un audit d'accessibilité (Lighthouse, extension **axe DevTools** ou **WAVE**) et viser 0 erreur bloquante ; mettre le rapport dans le dossier. Commande prête (build lancé avec `npm run build && npm run preview` dans `front/`) :
  `npx lighthouse http://localhost:4173 --view --only-categories=performance,accessibility,best-practices,seo`
- [x] Contrastes conformes WCAG AA (≥ 4,5:1) : violet `#5b2be0`, rose `#d6005a`, étiquettes et boutons de suppression foncés ; textes de 11 px passés à 12-13 px.
- [x] Menus CATEGORIES / LICENCES utilisables à la souris, au doigt et au clavier (Entrée, Échap, `aria-expanded`) : `components/NavBar/NavBarDropdown.jsx`.
- [x] Page **404** (route `path="*"`).
- [x] Un `<h1>` sur chaque page (accueil : adapté à la catégorie / licence) + lien « Aller au contenu » pour le clavier.
- [x] Navigation au clavier testée automatiquement (menus, lien d'évitement, formulaires).
- [ ] Tester avec un lecteur d'écran (VoiceOver sur Mac : Cmd + F5) et noter les résultats dans le dossier.
- [ ] Vérifier que **tous les cas d'utilisation** du dossier de conception sont implémentés (le périmètre est en haut de ce fichier).

### C14 — Charte graphique

- [ ] Documenter la charte dans le dossier (couleurs, typographies, logo, formes « coins arrondis en biais »). Les couleurs sont centralisées dans `front/src/index.css` (`--color-primary`, `--color-accent`, `--color-surface`).

### C16 — Qualité, sécurité, éco-conception

- [x] Analyse statique : ESLint (`npm run lint`).
- [x] **Prettier** (front et back) : `npm run format`, vérifié par la CI.
- [ ] Sécurité (à configurer au déploiement) : HTTPS / certificat SSL, en-têtes HTTP de sécurité (CSP, `X-Content-Type-Options`, `Strict-Transport-Security`...), CORS côté API. Vérifier avec securityheaders.com et Mozilla Observatory.
- [x] `npm audit` sans vulnérabilité (vérifié par la CI).
- [x] Plus aucun mot de passe ni donnée de compte dans le localStorage : la connexion passe par un cookie `httpOnly` déposé par l'API (illisible par le JavaScript de la page).
- [x] Éco-conception : pages chargées à la demande (`React.lazy`), Material UI n'est plus chargé sur la page d'accueil : JavaScript initial de 163 Ko → 91 Ko compressés (−44 %).
- [ ] Mesurer avec **EcoIndex** / GreenIT-Analysis et mettre le score dans le dossier.
- [x] Images de démonstration redimensionnées (41 Mo → 2,3 Mo).
- [ ] Tester sur Chrome, Firefox, Safari et sur mobile (compatibilité navigateurs).

### C17 / E12 — Consommer une API

- [x] Consommer **votre propre API** (back-end) avec `fetch` + authentification (JWT dans un cookie `httpOnly`) : `front/src/services/api.js`. Messages d'erreur de l'API affichés dans les formulaires, états de chargement, serveur injoignable géré.
- [x] Consommer **une API tierce** : autocomplétion de l'adresse de livraison dans le panier avec l'**API Adresse (Base Adresse Nationale)**, API officielle de l'État produite par l'IGN ([fiche data.gouv.fr](https://www.data.gouv.fr/dataservices/api-adresse-base-adresse-nationale-ban)), `services/addressApi.js` + `components/AddressAutocomplete/`. Gestion du délai de frappe, de l'annulation des requêtes, du chargement et des erreurs.
- [ ] Justifier dans le dossier le format choisi (REST + JSON) et la gestion des erreurs réseau (message à l'utilisateur, état de chargement).

### C18 / E13 — Tests front ⚠️ couverture ≥ 50 % obligatoire

- [x] **Vitest** + **React Testing Library** + couverture (`npm test`, `npm run test:coverage`) : 52 tests, 91 % des lignes, seuil bloquant à 50 % (le minimum exigé).
- [x] **Plan de tests** front et back : [docs/plan-de-tests.md](docs/plan-de-tests.md) (à relire et à compléter avec tes cas d'utilisation).
- [x] Tests unitaires : utilitaires, hook `useLocalStorageState`, contextes, service d'adresses.
- [x] Tests de composants et de pages : cartes, formulaires, barre de navigation, toutes les pages.
- [ ] Capture du rapport de couverture (≥ 50 %) dans le dossier.

### C19 / E14 — Industrialisation front

- [x] **GitHub Actions** : lint + build à chaque push (`.github/workflows/ci.yml`).
- [x] Tests du front (avec couverture) et vérification du formatage dans la CI.
- [x] Gestion des dépendances : `package.json` + `package-lock.json` (outils de build rangés dans `devDependencies`).
- [x] Optimisation du build : chaque page est chargée à la demande (`React.lazy`).

### C20 — SEO ⚠️ ≥ 70 % des critères techniques

- [x] `lang="fr"`, `<title>` et `<meta name="description">` dans `index.html`.
- [x] Titre, description et `og:title` **propres à chaque page** (`components/PageMetadata`), `noindex` sur les pages privées.
- [x] `robots.txt` et `sitemap.xml` dans `front/public/` (⚠️ remplacer `www.bazardim.fr` par le vrai domaine ; les pages produits devront être ajoutées au sitemap par le back).
- [x] Données structurées **schema.org `Product`** (JSON-LD) sur la fiche produit : prix, état, vendeur, EAN.
- [x] Balises Open Graph (titre, description, image par page).
- [ ] Limite d'une SPA : le contenu est généré en JavaScript. L'expliquer au jury et proposer une solution (pré-rendu, ou migration vers un framework SSR comme Next.js / React Router en mode framework).
- [ ] Outils de mesure d'audience **respectueux du RGPD** : **Matomo** ou **Plausible** (pas de bannière nécessaire avec Matomo en mode exempté). Intégration fonctionnelle à montrer.
- [ ] Score **Lighthouse SEO** dans le dossier.

---

## Bloc 3 — Back-end (dossier + soutenance 10 min)

Stack retenue : **Node.js + Express 5 + PostgreSQL (Docker) + SQL écrit à la main (`pg`)**.
Détails et liste des routes : [back/README.md](back/README.md). À justifier dans la note E3.

### C21 / E15 — Couche de persistance et sécurité en profondeur

- [x] Base PostgreSQL dans Docker (`docker-compose.yml`) + base de test séparée.
- [x] Schéma normalisé (`back/database/schema.sql`) : tables `users`, `products`, `licences`, `tags`, `product_tags`, `likes`, `messages`, contraintes `CHECK` / `UNIQUE` / clés étrangères, index, vue `product_details`.
- [x] Données de démo (`npm run db:reset`) importées depuis les anciens JSON, en passant par la même validation que l'API.
- [x] Mots de passe hachés avec **bcrypt** ; jamais renvoyés par l'API.
- [x] Validation de toutes les entrées avec **zod** ; requêtes SQL paramétrées (anti-injection).
- [x] Authentification : JWT dans un cookie `httpOnly` + `SameSite=Lax` (+ `secure` en production).
- [x] Contrôle d'accès : propriétaire ou admin pour modifier / supprimer une annonce.
- [x] Journal des requêtes avec un middleware maison (`src/middlewares/requestLogger.js`), route `/api/health` pour la supervision.
- [x] Configuration validée au démarrage (`src/config/config.js`), `.env` ignoré par Git, `.env.example` fourni.
- [ ] Stratégie de **sauvegarde / restauration** de la base (`pg_dump` planifié) à décrire et tester (C9, C32).
- [ ] **Authentification forte** (citée dans la C21) : au minimum, savoir l'expliquer au jury (2FA par code e-mail ou application TOTP) ; idéalement, l'implémenter pour les administrateurs.

### C22 / E16 — Développement de l'API

- [x] Routes REST : auth, comptes, produits (filtres + pagination), licences, favoris, messagerie.
- [x] Organisation MVC : `routes/` → `controllers/` → `validators/` (données reçues) et `models/` (requêtes SQL).
- [x] **Front branché sur l'API** (`front/src/services/api.js`, proxy Vite `/api` → `http://localhost:3000`). Le panier reste dans le localStorage jusqu'à la création des commandes.
- [x] **Messagerie** : contacter le vendeur depuis la fiche produit, boîte de réception / messages envoyés, réponse, marquer comme lu (`/api/messages`, page `/messages`), pastille du nombre de messages non lus dans la barre de navigation.
- [ ] Upload d'images d'annonces (**multer**) au lieu d'une URL saisie à la main.

### C23 / E17 — Paiement et monétisation

- [x] Tables `orders` / `order_items` (titre et prix copiés à l'achat) + routes `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`.
- [x] **Stripe Checkout** en mode test : bouton « Commander et payer » du panier, page de confirmation, onglet « Mes commandes » du profil. Total recalculé côté back (le front n'envoie aucun prix).
- [x] Webhook Stripe (`POST /api/stripe/webhook`, signature vérifiée) + vérification du paiement à l'affichage de la confirmation.
- [x] Modèle « pièce unique » (comme Vinted) : chaque annonce est ajoutée une seule fois au panier, sans quantité ; une commande = une liste d'annonces.
- [x] Annonce **vendue** après paiement (`products.sold_at`) : retirée de l'accueil, du profil public et des paniers, badge « Vendu » sur sa page et dans « Mes produits » ; une annonce vendue ne peut plus être commandée (409).
- [ ] Faire un vrai paiement de test à la main (carte `4242 4242 4242 4242`) et garder des captures pour le dossier.
- [ ] Marketplace entre particuliers → étudier **Stripe Connect** (reversement aux vendeurs).
- [ ] Rédiger la stratégie de monétisation : commission sur chaque vente (ex : 5 %), mise en avant payante d'annonces, abonnement vendeur pro...
- [ ] CGV / conditions générales d'utilisation (contraintes légales de la vente en ligne).

### C24 / E18 — API sécurisée pour des services tiers

- [x] Authentification + autorisation (rôles `user` / `admin`), **helmet**, **CORS** limité au front, **limitation des tentatives** de connexion (`express-rate-limit`).
- [x] Toutes les entrées validées ; mots de passe hachés.
- [ ] HTTPS en production (données chiffrées en transit).
- [ ] Documentation **OpenAPI / Swagger** (`swagger-ui-express`) — aussi demandée en C27. Une liste des routes existe déjà dans `back/README.md`.

### C25 / E19 — Tests back

- [x] 36 tests d'intégration (Vitest + supertest) sur une vraie base PostgreSQL de test, **94 % de couverture** (seuil bloquant à 50 %, le minimum exigé).
- [ ] Rédiger le **plan de tests** (tableau scénario / résultat attendu) à partir des fichiers `back/tests/*.test.js` et le mettre dans le dossier avec la capture du rapport de couverture.

### C26 / E20 — Industrialisation back

- [x] CI GitHub Actions : lint, `npm audit`, tests avec couverture (base PostgreSQL fournie par la CI).
- [ ] `Dockerfile` pour l'API (et l'ajouter à `docker-compose.yml`).
- [x] **Prettier** vérifié par la CI.

### RGPD dans l'application (C11, à implémenter)

- [ ] Bannière de consentement aux cookies (**tarteaucitron.js**, open source) si un traceur non exempté est utilisé.
- [ ] Pages **Politique de confidentialité** et **Mentions légales** (liens dans le footer).
- [ ] Formulaire de **demande d'accès / export / suppression** des données personnelles + traitement côté back.
- [ ] **Double opt-in** à l'inscription : e-mail de confirmation avec lien de validation avant d'activer le compte.
- [x] Suppression de compte depuis le profil (droit à l'effacement) : pop-up qui demande d'écrire « SUPPRIMER » et le mot de passe actuel ; annonces, favoris et messages supprimés, commandes conservées sans lien avec la personne.
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
- [x] `README.md` et `.gitignore` à la racine.

---

## Nettoyage déjà réalisé (branche `cleanup`)

À réutiliser dans le dossier pour montrer la démarche qualité :

- **Bugs corrigés** : deux paniers différents coexistaient (`CartProvider` déclaré deux fois) ; une annonce modifiée n'était à jour que sur sa page (pas sur l'accueil ni le profil) ; un même produit avait une image différente selon la page ; le mode sombre affichait du texte blanc sur fond blanc ; l'inscription n'enregistrait rien.
- **Architecture** : toutes les données partagées passent par des contextes React (`Products` ajouté) et un hook commun `useLocalStorageState`. Les compteurs `productsVersion` et les événements personnalisés ont été supprimés.
- **Duplication supprimée** : un seul formulaire produit (`ProductForm`) pour la vente et la modification ; une seule carte produit (fusion avec `ProductCardOwner`) ; styles CSS en double supprimés ; couleurs centralisées en variables CSS.
- **Code mort supprimé** : `CategoryBar`, `HeroCarousel`, `categories.json`, champs alternatifs inutilisés (`product_title`, `product_price`...).
- **Accessibilité** : le focus clavier est de nouveau visible (il était masqué partout), messages d'erreur dans la page au lieu de `alert()`, libellés ARIA sur la recherche, le panier et les boutons +/−.
- **Qualité** : ESLint installé et configuré (22 problèmes → 0), noms de variables explicites, commentaires et JSDoc.
- **Performance** : images de démonstration de 41 Mo à 2,3 Mo, chargement différé des images (`loading="lazy"`).

> Note : les nouvelles clés du localStorage (`products`, `users`, `cartItems`...) remplacent les anciennes.
> Les produits et le panier créés pendant vos tests précédents n'apparaîtront plus.
