-- =====================================================================
-- Schéma de la base de données Bazardim (PostgreSQL)
--
-- Ce fichier est la traduction SQL du modèle logique de données (MLD).
-- Il est rejoué entièrement par `npm run db:reset` et avant les tests.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Comptes utilisateurs
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username          VARCHAR(30)  NOT NULL UNIQUE,
  email             VARCHAR(255) NOT NULL UNIQUE,
  -- On ne stocke JAMAIS le mot de passe : uniquement son empreinte (hash bcrypt).
  password_hash     VARCHAR(255) NOT NULL,
  profile_image_url VARCHAR(500),
  role              VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Licences ("One Piece", "Naruto"...) : une table à part évite de répéter
-- le même texte dans chaque produit (normalisation, moins de redondance).
-- ---------------------------------------------------------------------
CREATE TABLE licences (
  id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- Annonces de produits
-- ---------------------------------------------------------------------
CREATE TABLE products (
  id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Supprimer un compte supprime ses annonces (ON DELETE CASCADE).
  owner_id            INTEGER       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  licence_id          INTEGER       REFERENCES licences (id) ON DELETE SET NULL,
  category            VARCHAR(30)   NOT NULL CHECK (category IN ('FIGURINE', 'FIGURINE ARTICULÉE', 'STATUE')),
  title               VARCHAR(150)  NOT NULL,
  description         TEXT          NOT NULL,
  -- NUMERIC (et non FLOAT) : calcul exact, indispensable pour de l'argent.
  price               NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  character_name      VARCHAR(100),
  manufacturer        VARCHAR(100),
  version             VARCHAR(100),
  material            VARCHAR(100),
  state_of_wear       VARCHAR(50),
  has_box             BOOLEAN       NOT NULL DEFAULT FALSE,
  state_of_box        VARCHAR(50),
  ean_code            VARCHAR(13),
  year_of_acquisition SMALLINT,
  height_cm           NUMERIC(6, 1),
  width_cm            NUMERIC(6, 1),
  scale               VARCHAR(20),
  image_url           VARCHAR(500),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Tags libres ("shf", "bandai"...) : relation plusieurs-à-plusieurs
-- (un produit a plusieurs tags, un tag concerne plusieurs produits).
-- ---------------------------------------------------------------------
CREATE TABLE tags (
  id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE product_tags (
  product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  tag_id     INTEGER NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- ---------------------------------------------------------------------
-- Favoris ("likes") : un utilisateur aime un produit au plus une fois
-- (la clé primaire composée l'empêche).
-- ---------------------------------------------------------------------
CREATE TABLE likes (
  user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  product_id INTEGER     NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- ---------------------------------------------------------------------
-- Messagerie : un utilisateur (sender) écrit à un autre (recipient),
-- en général à propos d'une annonce (product).
-- ---------------------------------------------------------------------
CREATE TABLE messages (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sender_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  recipient_id INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- Si l'annonce est supprimée, on garde le message (product_id devient NULL).
  product_id   INTEGER     REFERENCES products (id) ON DELETE SET NULL,
  content      TEXT        NOT NULL,
  is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Règle métier vérifiée aussi par la base : on ne s'écrit pas à soi-même.
  CHECK (sender_id <> recipient_id)
);

-- ---------------------------------------------------------------------
-- Commandes : une commande regroupe plusieurs lignes (order_items).
-- Elle est créée "pending" (en attente), puis passe à "paid" quand Stripe
-- confirme le paiement.
-- ---------------------------------------------------------------------
CREATE TABLE orders (
  id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Si l'acheteur supprime son compte, la commande est gardée sans lui (comptabilité),
  -- mais elle n'est plus reliée à une personne (RGPD).
  buyer_id          INTEGER        REFERENCES users (id) ON DELETE SET NULL,
  status            VARCHAR(20)    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  total_price       NUMERIC(10, 2) NOT NULL CHECK (total_price > 0),
  shipping_address  VARCHAR(300)   NOT NULL,
  -- Identifiant de la session de paiement chez Stripe (cs_test_...).
  stripe_session_id VARCHAR(255)   UNIQUE,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
  paid_at           TIMESTAMPTZ
);

CREATE TABLE order_items (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id      INTEGER        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  -- Si l'annonce est supprimée plus tard, la ligne de commande reste (product_id devient NULL).
  product_id    INTEGER        REFERENCES products (id) ON DELETE SET NULL,
  -- Titre et prix COPIÉS au moment de l'achat : la commande ne change pas
  -- si le vendeur modifie son annonce ensuite.
  product_title VARCHAR(150)   NOT NULL,
  unit_price    NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
  quantity      INTEGER        NOT NULL CHECK (quantity > 0)
);

-- ---------------------------------------------------------------------
-- Index : PostgreSQL n'indexe pas automatiquement les clés étrangères.
-- Ces index accélèrent les recherches et jointures les plus fréquentes.
-- ---------------------------------------------------------------------
CREATE INDEX products_owner_id_index    ON products (owner_id);
CREATE INDEX products_licence_id_index  ON products (licence_id);
CREATE INDEX products_category_index    ON products (category);
CREATE INDEX product_tags_tag_id_index  ON product_tags (tag_id);
CREATE INDEX likes_product_id_index     ON likes (product_id);
CREATE INDEX messages_recipient_id_index ON messages (recipient_id);
CREATE INDEX messages_sender_id_index    ON messages (sender_id);
CREATE INDEX orders_buyer_id_index       ON orders (buyer_id);
CREATE INDEX order_items_order_id_index  ON order_items (order_id);

-- ---------------------------------------------------------------------
-- Vue "product_details" : un produit avec le nom de sa licence, le pseudo
-- du vendeur et la liste de ses tags. Les requêtes de lecture utilisent
-- cette vue pour ne pas répéter ces jointures partout.
-- ---------------------------------------------------------------------
CREATE VIEW product_details AS
SELECT
  products.id,
  products.title,
  products.description,
  products.price,
  products.category,
  licences.name AS licence_name,
  products.character_name,
  products.manufacturer,
  products.version,
  products.material,
  products.state_of_wear,
  products.has_box,
  products.state_of_box,
  products.ean_code,
  products.year_of_acquisition,
  products.height_cm,
  products.width_cm,
  products.scale,
  products.image_url,
  products.owner_id,
  users.username AS owner_username,
  -- array_agg regroupe les tags en un tableau ; FILTER ignore les produits sans tag.
  COALESCE(
    array_agg(tags.name ORDER BY tags.name) FILTER (WHERE tags.name IS NOT NULL),
    '{}'
  ) AS tags,
  products.created_at,
  products.updated_at
FROM products
JOIN users ON users.id = products.owner_id
LEFT JOIN licences ON licences.id = products.licence_id
LEFT JOIN product_tags ON product_tags.product_id = products.id
LEFT JOIN tags ON tags.id = product_tags.tag_id
GROUP BY products.id, licences.name, users.username;
