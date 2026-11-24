import { query } from '../src/config/database.js';
import { insertProduct } from '../src/models/products.model.js';
import { normalizeText } from '../src/utils/normalizeText.js';
import { productSchema } from '../src/validators/products.validator.js';
import { insertUser } from '../src/models/users.model.js';
import { hashPassword } from '../src/utils/passwords.js';
import figuresData from './seed-data/figures.json' with { type: 'json' };
import profilesData from './seed-data/profiles.json' with { type: 'json' };

// Synonymes de démonstration : [synonyme, nom de la licence].
const DEMO_LICENCE_ALIASES = [
  ['DBZ', 'Dragon Ball Z'],
  ['Kimetsu no Yaiba', 'Demon Slayer'],
  ['Boku no Hero Academia', 'My Hero Academia'],
  ['Bishoujo Senshi Sailor Moon', 'Sailor Moon'],
];

// Nombre d'images de démonstration dans front/public/img (img_1.jpg à img_11.jpg).
const DEMO_IMAGE_COUNT = 11;

/**
 * Mot de passe commun à tous les comptes de démonstration, lu dans back/.env.
 * Il n'est jamais écrit dans le code : un compte administrateur avec un mot de passe
 * connu de tous serait une faille si ces données étaient chargées sur un vrai serveur.
 */
function getDemoPassword() {
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!demoPassword || demoPassword.length < 8) {
    throw new Error('Définissez SEED_DEMO_PASSWORD (8 caractères minimum) dans back/.env : voir .env.example.');
  }
  return demoPassword;
}

/**
 * Remplit la base avec les données de démonstration (seed-data/*.json).
 * On réutilise les fonctions de l'API (validation + insertion) : les données de démo
 * respectent donc exactement les mêmes règles que celles saisies par les utilisateurs.
 */
export async function seedDatabase() {
  // Les fichiers JSON ont leurs propres identifiants (101, 102...) : on retient
  // à quel nouvel identifiant de la base chacun correspond.
  const userIdByOldId = new Map();
  // Le hachage bcrypt est volontairement lent : on ne le calcule qu'une fois pour tous les comptes.
  const demoPasswordHash = await hashPassword(getDemoPassword());

  for (const profile of profilesData.profiles) {
    const user = await insertUser({
      username: profile.username,
      email: profile.email,
      passwordHash: demoPasswordHash,
      role: profile.email === 'admin@example.com' ? 'admin' : 'user',
      profileImageUrl: profile.profile_img,
    });
    userIdByOldId.set(profile.user_id, user.id);
  }

  for (const [index, figure] of figuresData.figures.entries()) {
    const productFields = productSchema.parse({
      // Pas de titre : il est calculé par le validateur (« Figurine – Roronoa Zoro (Wano Ver.) »).
      // La photo est obligatoire : on donne à chaque produit de démo une des images de front/public/img.
      image_url: `/img/img_${((index + 1) % DEMO_IMAGE_COUNT) + 1}.jpg`,
      description: figure.description,
      price: figure.price,
      category: figure.category,
      licence_name: figure.licence_name,
      character_name: figure.character_name,
      manufacturer: figure.manufacturer,
      version: figure.version,
      material: figure.material,
      state_of_wear: figure.state_of_wear,
      has_box: figure.box,
      state_of_box: figure.state_of_box,
      ean_code: figure.EAN_number,
      year_of_acquisition: figure.year_of_acquisition,
      height_cm: figure.size?.height,
      width_cm: figure.size?.width,
      scale: figure.size?.scale,
      tags: figure.tags,
    });
    await insertProduct(userIdByOldId.get(figure.owner_user_id), productFields);
  }

  // Les licences des données de démo sont des licences officielles : on les valide directement
  // (une licence saisie par un vendeur, elle, reste « en attente » jusqu'à la validation d'un admin).
  await query("UPDATE licences SET status = 'approved'");
  // Quelques synonymes d'exemple : un vendeur qui tape "DBZ" ou "Kimetsu no Yaiba"
  // est rangé automatiquement dans la bonne licence.
  for (const [alias, licenceName] of DEMO_LICENCE_ALIASES) {
    await query(
      `INSERT INTO licence_aliases (normalized_alias, licence_id)
       SELECT $1, id FROM licences WHERE name = $2`,
      [normalizeText(alias), licenceName],
    );
  }

  return { userCount: profilesData.profiles.length, productCount: figuresData.figures.length };
}
