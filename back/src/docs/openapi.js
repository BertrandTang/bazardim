/**
 * Documentation de l'API au format OpenAPI 3 (anciennement « Swagger »).
 *
 * OpenAPI est un format standard et ouvert pour décrire une API REST : routes, paramètres,
 * corps attendus, réponses possibles. À partir de cet objet, swagger-ui-express génère une page
 * de documentation interactive : http://localhost:3000/api/docs (voir app.js).
 * Un service tiers peut ainsi découvrir et tester l'API sans lire notre code.
 *
 * ⚠️ À mettre à jour quand une route change. Les règles de validation détaillées sont
 * dans src/validators/ (c'est zod qui fait foi).
 */

// ----- Petits raccourcis pour ne pas répéter les mêmes blocs -----

/** Référence vers un schéma décrit plus bas, dans components.schemas. */
const reference = (name) => ({ $ref: `#/components/schemas/${name}` });

/** Réponse JSON avec un schéma donné. */
const jsonResponse = (description, schema) => ({ description, content: { 'application/json': { schema } } });

/** Réponse d'erreur : toutes les erreurs de l'API ont la forme { error: "message" }. */
const errorResponse = (description) => jsonResponse(description, reference('Error'));

/** Corps de requête JSON obligatoire. */
const jsonBody = (schema) => ({ required: true, content: { 'application/json': { schema } } });

/** Paramètre d'URL numérique, ex : /products/{id}. */
const idParameter = (name, description) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer', minimum: 1 },
});

// Routes qui demandent d'être connecté : le cookie de connexion doit être envoyé.
const requiresLogin = [{ cookieAuth: [] }];

// Réponses d'erreur que l'on retrouve sur beaucoup de routes.
const notLoggedIn = errorResponse('Non connecté (cookie absent ou expiré)');
const invalidData = errorResponse('Données invalides (le détail par champ est dans "details")');
const notFound = errorResponse('Ressource introuvable');
const noContent = { description: 'Succès, sans contenu' };

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'API Bazardim',
    version: '1.0.0',
    description: [
      'API REST de **Bazardim**, marketplace de figurines entre collectionneurs.',
      '',
      '- Format d’échange : **JSON** (sauf l’envoi d’images : `multipart/form-data`).',
      '- Authentification : un **cookie httpOnly** `bazardim_token` (jeton JWT) est déposé par',
      '  `POST /api/auth/login`. Pour essayer les routes protégées ici, appelez d’abord cette route',
      '  avec « Try it out » : le navigateur enverra ensuite le cookie automatiquement.',
      '- Erreurs : toujours `{ "error": "message" }`, avec le code HTTP adapté.',
      '- Les connexions et inscriptions sont limitées à 20 tentatives par quart d’heure (429 au-delà).',
    ].join('\n'),
  },
  servers: [{ url: '/', description: 'Ce serveur' }],
  tags: [
    { name: 'Authentification' },
    { name: 'Comptes' },
    { name: 'Annonces' },
    { name: 'Favoris' },
    { name: 'Messagerie' },
    { name: 'Commandes' },
    { name: 'Images' },
    { name: 'Supervision' },
    { name: 'Administration' },
  ],

  paths: {
    // ----- Authentification -----
    '/api/auth/register': {
      post: {
        tags: ['Authentification'],
        summary: 'Créer un compte (et se connecter)',
        requestBody: jsonBody(reference('RegisterInput')),
        responses: {
          201: jsonResponse('Compte créé, cookie de connexion déposé', reference('Account')),
          400: invalidData,
          409: errorResponse('Email ou pseudo déjà utilisé'),
          429: errorResponse('Trop de tentatives'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentification'],
        summary: 'Se connecter',
        requestBody: jsonBody(reference('LoginInput')),
        responses: {
          200: jsonResponse('Connecté, cookie de connexion déposé', reference('Account')),
          401: errorResponse('Email ou mot de passe incorrect'),
          429: errorResponse('Trop de tentatives'),
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentification'],
        summary: 'Se déconnecter (supprime le cookie)',
        responses: { 204: noContent },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentification'],
        summary: 'Compte de l’utilisateur connecté (null pour un visiteur)',
        responses: {
          200: jsonResponse('Compte de l’utilisateur connecté, ou null si personne n’est connecté', {
            allOf: [reference('Account')],
            nullable: true,
          }),
        },
      },
    },

    // ----- Comptes -----
    '/api/users/{id}': {
      get: {
        tags: ['Comptes'],
        summary: 'Profil public d’un vendeur (sans son email)',
        parameters: [idParameter('id', 'Identifiant de l’utilisateur')],
        responses: { 200: jsonResponse('Profil public', reference('PublicProfile')), 404: notFound },
      },
    },
    '/api/users/me': {
      patch: {
        tags: ['Comptes'],
        summary: 'Modifier son compte',
        description:
          'Le mot de passe actuel (`current_password`) est obligatoire pour changer d’email ou de mot de passe.',
        security: requiresLogin,
        requestBody: jsonBody(reference('UpdateAccountInput')),
        responses: {
          200: jsonResponse('Compte mis à jour', reference('Account')),
          400: invalidData,
          401: notLoggedIn,
          403: errorResponse('Mot de passe actuel incorrect'),
          409: errorResponse('Email ou pseudo déjà utilisé'),
        },
      },
      delete: {
        tags: ['Comptes'],
        summary: 'Supprimer définitivement son compte (droit à l’effacement, RGPD)',
        description:
          'Supprime le compte, ses annonces, favoris et messages. Les commandes sont gardées sans lien avec la personne.',
        security: requiresLogin,
        requestBody: jsonBody({
          type: 'object',
          required: ['current_password'],
          properties: { current_password: { type: 'string' } },
        }),
        responses: { 204: noContent, 401: notLoggedIn, 403: errorResponse('Mot de passe actuel incorrect') },
      },
    },

    // ----- Annonces -----
    '/api/products': {
      get: {
        tags: ['Annonces'],
        summary: 'Lister les annonces (filtres, recherche, pagination)',
        parameters: [
          { name: 'category', in: 'query', schema: reference('Category') },
          { name: 'licence', in: 'query', description: 'Nom exact de la licence', schema: { type: 'string' } },
          {
            name: 'search',
            in: 'query',
            description: 'Recherche dans le titre, la description et les tags',
            schema: { type: 'string' },
          },
          { name: 'owner_id', in: 'query', description: 'Annonces d’un vendeur', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } },
        ],
        responses: {
          200: jsonResponse('Annonces, de la plus récente à la plus ancienne', {
            type: 'array',
            items: reference('Product'),
          }),
          400: invalidData,
        },
      },
      post: {
        tags: ['Annonces'],
        summary: 'Publier une annonce',
        security: requiresLogin,
        requestBody: jsonBody(reference('ProductInput')),
        responses: { 201: jsonResponse('Annonce créée', reference('Product')), 400: invalidData, 401: notLoggedIn },
      },
    },
    '/api/products/{id}': {
      parameters: [idParameter('id', 'Identifiant de l’annonce')],
      get: {
        tags: ['Annonces'],
        summary: 'Détail d’une annonce',
        responses: { 200: jsonResponse('Annonce', reference('Product')), 404: notFound },
      },
      put: {
        tags: ['Annonces'],
        summary: 'Modifier une annonce (propriétaire ou administrateur)',
        security: requiresLogin,
        requestBody: jsonBody(reference('ProductInput')),
        responses: {
          200: jsonResponse('Annonce modifiée', reference('Product')),
          400: invalidData,
          401: notLoggedIn,
          403: errorResponse('Ce n’est pas votre annonce'),
          404: notFound,
          409: errorResponse('Annonce vendue : elle ne peut plus être modifiée'),
        },
      },
      delete: {
        tags: ['Annonces'],
        summary: 'Supprimer une annonce (propriétaire ou administrateur)',
        security: requiresLogin,
        responses: {
          204: noContent,
          401: notLoggedIn,
          403: errorResponse('Ce n’est pas votre annonce'),
          404: notFound,
        },
      },
    },
    '/api/licences': {
      get: {
        tags: ['Annonces'],
        summary: 'Licences validées utilisées par les annonces (One Piece, Naruto…)',
        responses: { 200: jsonResponse('Noms des licences', { type: 'array', items: { type: 'string' } }) },
      },
    },

    // ----- Favoris -----
    '/api/likes': {
      get: {
        tags: ['Favoris'],
        summary: 'Mes annonces favorites',
        security: requiresLogin,
        responses: {
          200: jsonResponse('Annonces aimées', { type: 'array', items: reference('Product') }),
          401: notLoggedIn,
        },
      },
    },
    '/api/likes/{productId}': {
      parameters: [idParameter('productId', 'Identifiant de l’annonce')],
      put: {
        tags: ['Favoris'],
        summary: 'Ajouter aux favoris (sans effet si déjà présent)',
        security: requiresLogin,
        responses: { 204: noContent, 401: notLoggedIn, 404: notFound },
      },
      delete: {
        tags: ['Favoris'],
        summary: 'Retirer des favoris',
        security: requiresLogin,
        responses: { 204: noContent, 401: notLoggedIn },
      },
    },

    // ----- Messagerie -----
    '/api/messages': {
      post: {
        tags: ['Messagerie'],
        summary: 'Envoyer un message à un autre utilisateur',
        security: requiresLogin,
        requestBody: jsonBody(reference('MessageInput')),
        responses: {
          201: jsonResponse('Message envoyé', reference('Message')),
          400: invalidData,
          401: notLoggedIn,
          404: notFound,
        },
      },
    },
    '/api/messages/received': {
      get: {
        tags: ['Messagerie'],
        summary: 'Messages reçus (boîte de réception)',
        security: requiresLogin,
        responses: {
          200: jsonResponse('Messages, du plus récent au plus ancien', { type: 'array', items: reference('Message') }),
          401: notLoggedIn,
        },
      },
    },
    '/api/messages/sent': {
      get: {
        tags: ['Messagerie'],
        summary: 'Messages envoyés',
        security: requiresLogin,
        responses: {
          200: jsonResponse('Messages, du plus récent au plus ancien', { type: 'array', items: reference('Message') }),
          401: notLoggedIn,
        },
      },
    },
    '/api/messages/unread-count': {
      get: {
        tags: ['Messagerie'],
        summary: 'Nombre de messages non lus',
        security: requiresLogin,
        responses: {
          200: jsonResponse('Compteur', { type: 'object', properties: { count: { type: 'integer', example: 2 } } }),
          401: notLoggedIn,
        },
      },
    },
    '/api/messages/{id}/read': {
      patch: {
        tags: ['Messagerie'],
        summary: 'Marquer un message reçu comme lu (destinataire uniquement)',
        security: requiresLogin,
        parameters: [idParameter('id', 'Identifiant du message')],
        responses: { 204: noContent, 401: notLoggedIn, 404: notFound },
      },
    },

    // ----- Commandes -----
    '/api/orders': {
      get: {
        tags: ['Commandes'],
        summary: 'Mes commandes',
        security: requiresLogin,
        responses: {
          200: jsonResponse('Commandes, de la plus récente à la plus ancienne', {
            type: 'array',
            items: reference('Order'),
          }),
          401: notLoggedIn,
        },
      },
      post: {
        tags: ['Commandes'],
        summary: 'Commander et obtenir la page de paiement Stripe',
        description:
          'On n’envoie que les identifiants des annonces : les prix et les frais de service (0,70 € + 5 %) sont calculés par le serveur.',
        security: requiresLogin,
        requestBody: jsonBody(reference('OrderInput')),
        responses: {
          201: jsonResponse('Commande créée (en attente de paiement)', {
            type: 'object',
            properties: {
              order_id: { type: 'integer', example: 12 },
              checkout_url: { type: 'string', example: 'https://checkout.stripe.com/c/pay/cs_test_...' },
            },
          }),
          400: errorResponse('Panier vide, adresse manquante ou achat de sa propre annonce'),
          401: notLoggedIn,
          404: errorResponse('Une annonce n’existe plus'),
          409: errorResponse('Une annonce vient d’être vendue'),
          502: errorResponse('Stripe est indisponible'),
        },
      },
    },
    '/api/orders/sales': {
      get: {
        tags: ['Commandes'],
        summary: 'Mes ventes : acheteur, adresse de livraison et expédition de chacune de mes annonces vendues',
        security: requiresLogin,
        responses: { 200: jsonResponse('Ventes', { type: 'array', items: reference('Sale') }), 401: notLoggedIn },
      },
    },
    '/api/orders/items/{id}/shipped': {
      patch: {
        tags: ['Commandes'],
        summary: 'Marquer un article vendu comme expédié (vendeur de l’annonce uniquement)',
        security: requiresLogin,
        parameters: [idParameter('id', 'Identifiant de la ligne de commande (order_item_id dans /api/orders/sales)')],
        responses: {
          200: jsonResponse('Article expédié', {
            type: 'object',
            properties: {
              order_item_id: { type: 'integer' },
              shipped_at: { type: 'string', format: 'date-time' },
            },
          }),
          401: notLoggedIn,
          404: errorResponse('Vente introuvable (ou ce n’est pas votre annonce)'),
          409: errorResponse('Commande pas encore payée, ou article déjà expédié'),
        },
      },
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Commandes'],
        summary: 'Une de mes commandes (vérifie le paiement auprès de Stripe si elle est en attente)',
        security: requiresLogin,
        parameters: [idParameter('id', 'Identifiant de la commande')],
        responses: { 200: jsonResponse('Commande', reference('Order')), 401: notLoggedIn, 404: notFound },
      },
    },
    '/api/stripe/webhook': {
      post: {
        tags: ['Commandes'],
        summary: 'Réservée à Stripe : confirmation d’un paiement',
        description: 'Appelée par Stripe, jamais par le front. La signature (en-tête `Stripe-Signature`) est vérifiée.',
        responses: {
          200: jsonResponse('Événement reçu', { type: 'object', properties: { received: { type: 'boolean' } } }),
          400: errorResponse('Signature invalide'),
        },
      },
    },

    // ----- Images -----
    '/api/uploads': {
      post: {
        tags: ['Images'],
        summary: 'Envoyer une image (photo d’annonce ou de profil)',
        description: 'JPEG, PNG ou WebP, 2 Mo maximum. Le fichier est renommé avec un nom aléatoire.',
        security: requiresLogin,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: { image: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          201: jsonResponse('Adresse de l’image, à mettre dans image_url ou profile_image_url', {
            type: 'object',
            properties: { image_url: { type: 'string', example: '/uploads/4f1c2a9e-7b3d.jpg' } },
          }),
          400: errorResponse('Aucune image, format refusé ou fichier trop lourd'),
          401: notLoggedIn,
        },
      },
    },

    // ----- Administration : modération des licences -----
    '/api/admin/licences': {
      get: {
        tags: ['Administration'],
        summary: 'Toutes les licences (en attente d’abord), avec leur nombre d’annonces et leurs synonymes',
        security: requiresLogin,
        responses: {
          200: jsonResponse('Licences', { type: 'array', items: reference('AdminLicence') }),
          401: notLoggedIn,
          403: errorResponse('Réservé aux administrateurs'),
        },
      },
    },
    '/api/admin/licences/{id}': {
      patch: {
        tags: ['Administration'],
        summary: 'Renommer et/ou valider une licence (l’ancien nom devient un synonyme)',
        security: requiresLogin,
        parameters: [idParameter('id', 'Identifiant de la licence')],
        requestBody: jsonBody({
          type: 'object',
          properties: {
            name: { type: 'string', maxLength: 100, example: 'Dragon Ball Super' },
            status: { type: 'string', enum: ['approved'] },
          },
        }),
        responses: {
          200: jsonResponse('Licence modifiée', {
            type: 'object',
            properties: { id: { type: 'integer' }, name: { type: 'string' }, status: { type: 'string' } },
          }),
          400: invalidData,
          401: notLoggedIn,
          403: errorResponse('Réservé aux administrateurs'),
          404: notFound,
          409: errorResponse('Nom déjà utilisé par une autre licence ou un synonyme'),
        },
      },
    },
    '/api/admin/licences/{id}/merge': {
      post: {
        tags: ['Administration'],
        summary: 'Fusionner un doublon dans une autre licence (annonces déplacées, nom gardé comme synonyme)',
        security: requiresLogin,
        parameters: [idParameter('id', 'Licence en double, qui sera supprimée')],
        requestBody: jsonBody({
          type: 'object',
          required: ['target_licence_id'],
          properties: { target_licence_id: { type: 'integer' } },
        }),
        responses: {
          204: noContent,
          400: errorResponse('Fusion d’une licence avec elle-même'),
          401: notLoggedIn,
          403: errorResponse('Réservé aux administrateurs'),
          404: notFound,
        },
      },
    },
    '/api/admin/licences/{id}/aliases': {
      post: {
        tags: ['Administration'],
        summary: 'Ajouter un synonyme à une licence (traduction, abréviation)',
        security: requiresLogin,
        parameters: [idParameter('id', 'Identifiant de la licence')],
        requestBody: jsonBody({
          type: 'object',
          required: ['alias'],
          properties: { alias: { type: 'string', maxLength: 100, example: 'Kimetsu no Yaiba' } },
        }),
        responses: {
          201: jsonResponse('Synonyme ajouté (enregistré normalisé)', {
            type: 'object',
            properties: { normalized_alias: { type: 'string' }, licence_id: { type: 'integer' } },
          }),
          401: notLoggedIn,
          403: errorResponse('Réservé aux administrateurs'),
          404: notFound,
          409: errorResponse('Synonyme ou nom déjà utilisé'),
        },
      },
    },
    '/api/admin/licences/{id}/aliases/{alias}': {
      delete: {
        tags: ['Administration'],
        summary: 'Supprimer un synonyme',
        security: requiresLogin,
        parameters: [
          idParameter('id', 'Identifiant de la licence'),
          { name: 'alias', in: 'path', required: true, schema: { type: 'string' }, example: 'kimetsu no yaiba' },
        ],
        responses: {
          204: noContent,
          401: notLoggedIn,
          403: errorResponse('Réservé aux administrateurs'),
          404: notFound,
        },
      },
    },

    // ----- Supervision -----
    '/api/health': {
      get: {
        tags: ['Supervision'],
        summary: 'L’API et la base de données répondent-elles ?',
        responses: {
          200: jsonResponse('Tout fonctionne', {
            type: 'object',
            properties: { status: { type: 'string', example: 'ok' } },
          }),
        },
      },
    },
  },

  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'bazardim_token' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Produit introuvable.' },
          details: {
            type: 'array',
            description: 'Seulement pour les données invalides (400) : un message par champ',
            items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } },
          },
        },
      },
      Category: { type: 'string', enum: ['FIGURINE', 'FIGURINE ARTICULÉE', 'STATUE'] },
      ImageUrl: {
        type: 'string',
        description: 'Image du site : renvoyée par POST /api/uploads (les liens vers d’autres sites sont refusés)',
        pattern: '^/(uploads|img)/[\\w.-]+$',
        example: '/uploads/4f1c2a9e-7b3d.jpg',
      },
      RegisterInput: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 30, example: 'CollectionneurDu92' },
          email: { type: 'string', format: 'email', example: 'collectionneur@example.com' },
          password: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
      },
      Account: {
        type: 'object',
        description: 'Compte de l’utilisateur connecté (jamais de mot de passe)',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          email: { type: 'string' },
          profile_image_url: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['user', 'admin'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      PublicProfile: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          profile_image_url: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      UpdateAccountInput: {
        type: 'object',
        additionalProperties: false,
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 30 },
          email: { type: 'string', format: 'email' },
          profile_image_url: reference('ImageUrl'),
          current_password: { type: 'string' },
          new_password: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },
      ProductInput: {
        type: 'object',
        description:
          'Pas de titre : il est calculé par l’API (<Type> – <Personnage> (<Édition> Ver.), ou le fabricant entre parenthèses sans édition).',
        required: ['description', 'price', 'category', 'character_name', 'image_url'],
        properties: {
          description: { type: 'string', maxLength: 5000 },
          price: { type: 'number', minimum: 0, exclusiveMinimum: true, example: 74.99 },
          category: reference('Category'),
          image_url: reference('ImageUrl'),
          licence_name: { type: 'string', maxLength: 100, example: 'One Piece' },
          character_name: { type: 'string', minLength: 1, maxLength: 100, example: 'Monkey D. Luffy' },
          manufacturer: { type: 'string', maxLength: 100, example: 'Bandai' },
          version: { type: 'string', maxLength: 100 },
          material: { type: 'string', maxLength: 100 },
          state_of_wear: { type: 'string', maxLength: 50 },
          has_box: { type: 'boolean', default: false },
          state_of_box: { type: 'string', maxLength: 50 },
          ean_code: { type: 'string', description: '8 ou 13 chiffres', example: '4573102711298' },
          year_of_acquisition: { type: 'integer', minimum: 1900, nullable: true },
          height_cm: { type: 'number', nullable: true },
          width_cm: { type: 'number', nullable: true },
          scale: { type: 'string', maxLength: 20, example: '1/8' },
          tags: { type: 'array', maxItems: 10, items: { type: 'string', maxLength: 30 }, example: ['shf', 'bandai'] },
        },
      },
      Product: {
        allOf: [
          reference('ProductInput'),
          {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              title: {
                type: 'string',
                description: 'Calculé par l’API',
                example: 'Figurine articulée – Monkey D. Luffy (Gear 5 Ver.)',
              },
              owner_id: { type: 'integer' },
              owner_username: { type: 'string' },
              sold_at: {
                type: 'string',
                format: 'date-time',
                nullable: true,
                description: 'Date de vente, null si en vente',
              },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      MessageInput: {
        type: 'object',
        required: ['recipient_id', 'content'],
        properties: {
          recipient_id: { type: 'integer' },
          product_id: { type: 'integer', nullable: true, description: 'Annonce concernée (facultative)' },
          content: { type: 'string', minLength: 1, maxLength: 2000 },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          content: { type: 'string' },
          is_read: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          product_id: { type: 'integer', nullable: true },
          product_title: { type: 'string', nullable: true },
          sender_id: { type: 'integer' },
          sender_username: { type: 'string' },
          recipient_id: { type: 'integer' },
          recipient_username: { type: 'string' },
        },
      },
      OrderInput: {
        type: 'object',
        required: ['product_ids', 'shipping_address'],
        properties: {
          product_ids: { type: 'array', minItems: 1, maxItems: 50, items: { type: 'integer' }, example: [3, 8] },
          shipping_address: { type: 'string', minLength: 5, maxLength: 300, example: '10 Rue de Rivoli 75004 Paris' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          buyer_id: { type: 'integer', nullable: true },
          status: { type: 'string', enum: ['pending', 'paid'] },
          total_price: { type: 'number', description: 'Montant payé : articles + frais de service', example: 58.98 },
          service_fee: { type: 'number', example: 3.48 },
          shipping_address: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          paid_at: { type: 'string', format: 'date-time', nullable: true },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_id: {
                  type: 'integer',
                  nullable: true,
                  description: 'null si l’annonce a été supprimée depuis',
                },
                product_title: { type: 'string' },
                price: { type: 'number' },
                shipped_at: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                  description: 'null tant que non expédié',
                },
              },
            },
          },
        },
      },
      AdminLicence: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string', example: 'Tensura' },
          status: { type: 'string', enum: ['pending', 'approved'] },
          product_count: { type: 'integer', description: 'Nombre d’annonces de cette licence' },
          aliases: { type: 'array', items: { type: 'string' }, example: ['tensei shitara slime datta ken'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Sale: {
        type: 'object',
        properties: {
          order_item_id: { type: 'integer', description: 'À utiliser pour marquer l’article comme expédié' },
          product_id: { type: 'integer' },
          buyer_id: { type: 'integer', nullable: true },
          buyer_username: { type: 'string', nullable: true, description: 'null si l’acheteur a supprimé son compte' },
          shipping_address: { type: 'string', description: 'Adresse où expédier l’article' },
          paid_at: { type: 'string', format: 'date-time' },
          shipped_at: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  },
};
