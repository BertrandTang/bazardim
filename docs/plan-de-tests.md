# Plan de tests — Bazardim

Ce plan relie chaque fonctionnalité de l'application aux tests automatiques qui la vérifient.
Tous les tests sont lancés à chaque push par la CI GitHub Actions (`.github/workflows/ci.yml`),
qui échoue si un test échoue ou si la couverture du code passe sous 50 % (le minimum exigé par la certification).

| | Front-end | Back-end |
| --- | --- | --- |
| Outils | Vitest + React Testing Library (navigateur simulé : jsdom) | Vitest + supertest, sur une vraie base PostgreSQL de test |
| Lancer | `cd front && npm run test:coverage` | `cd back && npm run test:coverage` |
| Nombre de tests | 85 | 59 |
| Couverture des lignes | 89 % | 95 % |
| Emplacement | `front/tests/*.test.js(x)` | `back/tests/*.test.js` |

Types de tests :

- **Unitaire** : une fonction isolée (calcul du prix, image d'un produit...).
- **Composant** : un composant React affiché seul ; on simule les actions de l'utilisateur (clic, saisie).
- **Intégration** : plusieurs couches ensemble (page + contextes + routeur, ou route API + base de données).

Les tests du front n'appellent pas le vrai serveur : `front/tests/fakeApi.js` remplace `src/services/api.js`
par une fausse API qui garde ses données en mémoire (mêmes fonctions, mêmes messages d'erreur).
Le vrai `api.js` est testé à part (`api.test.js`) en simulant `fetch`, et la vraie API est testée côté back.
Le parcours complet (connexion, favoris, message au vendeur, vente, modification, suppression, réponse)
a aussi été vérifié une fois dans un vrai navigateur, avec l'API et le front lancés (navigateur piloté par un script, non inclus dans le projet).

---

## Front-end

| Fonctionnalité | Scénario | Résultat attendu | Type | Fichier |
| --- | --- | --- | --- | --- |
| Catalogue | Ouvrir l'accueil | Tous les produits du catalogue et un titre `<h1>` | Intégration | `pages.test.jsx` |
| Catalogue | Ouvrir une catégorie (Statues) | Toutes les statues, et seulement elles | Intégration | `pages.test.jsx` |
| Catalogue | Une annonce est vendue | Elle n'apparaît plus sur l'accueil | Intégration | `pages.test.jsx` |
| Fiche produit | Annonce vendue (page et carte) | Bandeau « Vendu », pas de bouton AJOUTER | Intégration / Composant | `pages.test.jsx`, `components.test.jsx` |
| Fiche produit | Le vendeur ouvre son annonce vendue en mode modification | Pas de formulaire ni de bouton Modifier | Intégration | `pages.test.jsx` |
| Mes produits | Une de mes annonces est vendue | « Vendu à *pseudo* » (lien vers son profil), pas de bouton Modifier | Intégration | `pages.test.jsx` |
| Panier | Annonce vendue entre-temps | Retirée du panier | Intégration | `pages.test.jsx` |
| Recherche | Taper « luffy » + Entrée dans la barre | Adresse `/?q=luffy` | Composant | `components.test.jsx` |
| Recherche | Ouvrir `/?q=vegeta` | « 1 résultat(s) pour « vegeta » » | Intégration | `pages.test.jsx` |
| Recherche | Licence inconnue | Message « Aucun produit ne correspond » | Intégration | `pages.test.jsx` |
| Navigation | Menu Catégories : Entrée puis Échap | Menu ouvert puis fermé, focus rendu au bouton | Composant | `components.test.jsx` |
| Navigation | Adresse inexistante | Page 404 avec lien vers l'accueil | Composant | `pages.test.jsx` |
| Connexion | Mauvais mot de passe | Message d'erreur renvoyé par l'API | Intégration | `pages.test.jsx` |
| Connexion | Utilisateur déjà connecté (cookie) au chargement | Il est reconnu | Unitaire | `contexts.test.jsx` |
| Connexion | Bons identifiants | Redirection vers le profil | Intégration | `pages.test.jsx` |
| Connexion | Page privée sans être connecté | Redirection vers `/auth` | Composant | `components.test.jsx` |
| Inscription | Mot de passe < 8 caractères / différent / email déjà pris (refus de l'API) | Message d'erreur adapté | Intégration | `pages.test.jsx` |
| Inscription | Formulaire valide | Compte créé, redirection vers le profil | Intégration | `pages.test.jsx` |
| Fiche produit | Ouvrir `/product/1` | Caractéristiques + données structurées schema.org | Intégration | `pages.test.jsx` |
| Fiche produit | Identifiant inconnu | « Produit introuvable » | Intégration | `pages.test.jsx` |
| Vente | Formulaire vide / prix nul / sans photo | Message d'erreur, rien n'est envoyé | Composant | `components.test.jsx` |
| Images | Fichier PDF, image de plus de 2 Mo, visiteur non connecté | Message d'erreur, rien n'est enregistré | Composant | `components.test.jsx` |
| Images | Choisir une photo (annonce, profil) | Aperçu affiché, adresse `/uploads/...` enregistrée | Composant / Intégration | `components.test.jsx`, `pages.test.jsx` |
| Vente | Formulaire valide | Annonce créée, ouverture de sa page | Intégration | `pages.test.jsx` |
| Vente / modification | L'API refuse les données | Message de l'API affiché, bouton réactivé | Composant | `components.test.jsx` |
| Modification | Le propriétaire modifie le titre | Nouveau titre affiché | Intégration | `pages.test.jsx` |
| Suppression | Le propriétaire supprime son annonce | Retour au profil | Intégration | `pages.test.jsx` |
| Suppression | Supprimer l'annonce d'un autre | Refusé, l'annonce reste | Unitaire | `contexts.test.jsx` |
| Favoris | Clic sur le cœur (connecté) | Bouton « Retirer des favoris » activé | Composant | `components.test.jsx` |
| Favoris | Clic sur le cœur (visiteur) | Redirection vers `/auth` | Composant | `components.test.jsx` |
| Favoris | Changement d'utilisateur | Chaque utilisateur retrouve ses propres favoris | Unitaire | `contexts.test.jsx` |
| Messagerie | Contacter le vendeur depuis la fiche produit (vide puis rempli) | Erreur « message vide », puis « Message envoyé. » | Intégration | `pages.test.jsx` |
| Messagerie | Visiteur sur la fiche produit | Lien « Connectez-vous » | Intégration | `pages.test.jsx` |
| Messagerie | 2 messages non lus | Pastille « 2 » à côté de MESSAGES, lue « Messages (2 non lus) » | Composant | `components.test.jsx` |
| Messagerie | Répondre à un message reçu | Réponse envoyée, message marqué lu, visible dans « Envoyés » | Intégration | `pages.test.jsx` |
| Messagerie | Annonce supprimée, boîte vide | « annonce supprimée », « Aucun message. » | Intégration | `pages.test.jsx` |
| Commande | Visiteur dans le panier | Lien « Se connecter pour commander » | Intégration | `pages.test.jsx` |
| Commande | Sans adresse, puis avec adresse | Bouton désactivé, puis redirection vers la page de paiement Stripe | Intégration | `pages.test.jsx` |
| Commande | Acheter sa propre annonce | Message de refus de l'API | Intégration | `pages.test.jsx` |
| Paiement | Retour de Stripe : en attente puis payé | « Vérifier à nouveau », puis « Merci », panier vidé | Intégration | `pages.test.jsx` |
| Commande | Commande inconnue / onglet « Mes commandes » | « Commande introuvable » / liste avec le total | Intégration | `pages.test.jsx` |
| Appels à l'API | Erreur de validation, réponse vide, serveur injoignable, visiteur non connecté | Message lisible, pas de plantage ; visiteur = `null` | Unitaire | `api.test.js` |
| Panier | Ajouter deux fois la même annonce | Ajoutée une seule fois, bouton « DANS LE PANIER » (pièce unique) | Unitaire / Composant | `contexts.test.jsx`, `components.test.jsx` |
| Panier | Afficher, retirer une annonce, vider | Détail articles / frais de service / total recalculé, pas de boutons de quantité | Intégration | `pages.test.jsx` |
| Frais de service | 40 €, 0 €, 55,50 €, 134,98 € d'articles | 0,70 € + 5 %, arrondi au centime (même calcul que l'API) | Unitaire | `serviceFee.test.js` |
| Panier | Produit supprimé entre-temps | Il disparaît du panier | Unitaire | `contexts.test.jsx` |
| Livraison (API tierce) | Taper une adresse | Suggestions de l'API Adresse (BAN), adresse choisie enregistrée | Composant | `AddressAutocomplete.test.jsx` |
| Livraison (API tierce) | API indisponible | Message d'erreur, saisie libre possible | Composant | `AddressAutocomplete.test.jsx` |
| Livraison (API tierce) | Moins de 3 caractères | Aucun appel à l'API | Composant | `AddressAutocomplete.test.jsx` |
| Profil | Modifier son pseudo | « Profil mis à jour » | Intégration | `pages.test.jsx` |
| Profil | Changer d'email sans le mot de passe actuel | « Mot de passe actuel incorrect. » | Intégration | `pages.test.jsx` |
| Suppression du compte (RGPD) | Pop-up : mot mal recopié, mauvais mot de passe, puis tout correct | Bouton désactivé, refus de l'API, puis compte supprimé et retour à l'accueil | Intégration | `pages.test.jsx` |
| Suppression du compte (RGPD) | Bouton « Annuler » | Pop-up fermée, compte intact | Intégration | `pages.test.jsx` |
| Profil | Onglets produits / likes | Bonnes listes affichées | Intégration | `pages.test.jsx` |
| RGPD | Profil public d'un vendeur | L'email n'est pas affiché | Intégration | `pages.test.jsx` |
| Pages légales | Pied de page, mentions légales, politique de confidentialité, conditions générales | Liens vers les trois pages (et vers les CGV dans le panier) ; éditeur et hébergeur ; tableau des données, cookies et droits RGPD ; barème des frais de service | Intégration | `pages.test.jsx` |
| Outils | Sauvegarde locale, prix, images | Valeurs attendues, y compris sauvegarde corrompue | Unitaire | `useLocalStorageState.test.js`, `productHelpers.test.js` |

## Back-end (API)

| Fonctionnalité | Scénario | Résultat attendu | Fichier |
| --- | --- | --- | --- |
| Inscription | Données valides | 201, cookie `httpOnly`, pas de mot de passe renvoyé | `auth.test.js` |
| Inscription | Email ou pseudo déjà pris | 409 avec message clair | `auth.test.js` |
| Inscription | Champs invalides | 400 avec la liste des champs en erreur | `auth.test.js` |
| Connexion | Bon / mauvais mot de passe, email inconnu | 200 / 401 (même message dans les deux cas d'échec) | `auth.test.js` |
| Session | Sans cookie, jeton falsifié, après déconnexion | `GET /api/auth/me` renvoie `null` (un visiteur n'est pas une erreur) ; une route protégée répond 401 | `auth.test.js` |
| Produits | Créer une annonce | 201, appartient à l'utilisateur connecté | `products.test.js` |
| Produits | Prix négatif, catégorie inconnue, image `javascript:` | 400 | `products.test.js` |
| Produits | Filtres catégorie, licence, recherche, vendeur, pagination | Seuls les bons produits | `products.test.js` |
| Produits | Modifier / supprimer l'annonce d'un autre | 403 | `products.test.js` |
| Produits | Un administrateur supprime une annonce | 204 (modération) | `products.test.js` |
| Favoris | Liker deux fois, retirer | Pas de doublon, retrait effectif | `likes.test.js` |
| Messagerie | Écrire au vendeur d'une annonce | 201, visible dans ses reçus et dans les envoyés de l'expéditeur | `messages.test.js` |
| Messagerie | Message vide, à soi-même, à un inconnu, produit inexistant | 400 / 400 / 404 / 404 | `messages.test.js` |
| Messagerie | Marquer comme lu un message qui ne nous est pas destiné | 403 | `messages.test.js` |
| Images | Envoyer une image PNG | 201, nom aléatoire, image servie avec le bon type | `uploads.test.js` |
| Images | Fichier HTML, image > 2 Mo, envoi vide, visiteur | 400 / 400 / 400 / 401 | `uploads.test.js` |
| Annonce | Sans photo, ou avec un lien vers un autre site | 400 | `uploads.test.js` |
| Messagerie | Nombre de messages non lus | Compte exact, baisse après lecture, 401 sans connexion | `messages.test.js` |
| Messagerie (confidentialité) | Un autre utilisateur, même administrateur, consulte ses messages | Il ne voit pas les messages des autres (403 s'il tente d'agir dessus) | `messages.test.js` |
| Messagerie | Annonce supprimée | Le message est conservé (`product_id` vide) | `messages.test.js` |
| Commande | Créer une commande | 201, total calculé avec les prix de la base + frais de service (0,70 € + 5 %), montants en centimes envoyés à Stripe avec une ligne « Frais de service Bazardim » | `orders.test.js` |
| Commande | Prix ou frais envoyés par le navigateur | Ignorés : le total et les frais sont calculés par le serveur | `orders.test.js` |
| Commande | Panier vide, adresse manquante, même annonce deux fois, produit inexistant, sa propre annonce | 400 / 400 / 400 / 404 / 400, Stripe jamais appelé | `orders.test.js` |
| Commande | Stripe indisponible | 502 et commande supprimée | `orders.test.js` |
| Paiement | Relire une commande en attente | Payée si Stripe confirme le paiement | `orders.test.js` |
| Paiement | Webhook avec une signature invalide / valide | 400 / commande payée et produits marqués vendus | `orders.test.js` |
| Annonce vendue | Paiement confirmé, puis nouvelle commande du même produit | `sold_at` rempli, puis 409 « vient d'être vendu » | `orders.test.js` |
| Annonce vendue | Le vendeur consulte ses ventes, puis tente de modifier l'annonce | Pseudo de l'acheteur (l'acheteur, lui, n'a aucune vente) ; modification refusée (409) | `orders.test.js` |
| Commande (confidentialité) | Un autre utilisateur consulte la commande | 404, n'apparaît pas dans sa liste | `orders.test.js` |
| Compte | Changer de mot de passe ou d'email sans le mot de passe actuel | 403 | `users.test.js` |
| Compte | Envoyer `role: admin` | 400 (champ refusé) | `users.test.js` |
| Compte (RGPD) | Supprimer son compte | Compte, annonces et session supprimés | `users.test.js` |
| Documentation | `/api/docs.json` et `/api/docs/` | Description OpenAPI 3 (routes principales présentes) et page Swagger UI | `docs.test.js` |
| SEO | `/sitemap.xml` | XML avec les pages fixes et les annonces en vente, sans les annonces vendues, dates au format AAAA-MM-JJ | `sitemap.test.js` |
| Sécurité | En-têtes HTTP, CORS | `nosniff`, origine autorisée = front uniquement | `users.test.js` |

## Vérification manuelle de l'affichage (responsive)

Chaque page (accueil, fiche produit, connexion, inscription, panier, messagerie, vente, profil et ses onglets, profil public, page 404) est ouverte dans Chrome à **320 px** (petit téléphone), **375 px** (iPhone) et **1280 px** (ordinateur) de large.

| Vérification | Résultat attendu |
| --- | --- |
| Largeur de la page | Aucun défilement horizontal, rien ne dépasse de l'écran |
| Barre de navigation | Tous les liens visibles et cliquables, sur plusieurs lignes si besoin |
| Textes longs (titre de produit, pseudo) | Passent à la ligne ; les prix restent sur une seule ligne |

## Vérification manuelle de la sauvegarde

| Étape | Résultat attendu | Résultat obtenu (23/11/2026) |
| --- | --- | --- |
| `./scripts/backup-database.sh` | Fichier `backups/bazardim-<date>.dump` créé | ✅ fichier de 32 Ko |
| Restauration dans une base d'essai | Mêmes nombres d'utilisateurs, d'annonces et de commandes que la base d'origine | ✅ 8 / 11 / 13 des deux côtés |
| Restauration une deuxième fois dans la même base | Aucune erreur (`--clean` remplace les tables) | ✅ |
| Restauration de la vraie base sans écrire RESTAURER | Annulée, base intacte | ✅ |

## Ce qui n'est pas (encore) couvert

- Tests d'accessibilité avec un lecteur d'écran (VoiceOver, NVDA) : à faire manuellement.
- Le paiement réel sur la page de Stripe (carte de test) : à faire à la main, la page de Stripe est protégée contre les robots.
