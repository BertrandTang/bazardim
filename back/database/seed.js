import { insertProduct } from '../src/models/products.model.js';
import { productSchema } from '../src/validators/products.validator.js';
import { insertUser } from '../src/models/users.model.js';
import { hashPassword } from '../src/utils/passwords.js';
import figuresData from './seed-data/figures.json' with { type: 'json' };
import profilesData from './seed-data/profiles.json' with { type: 'json' };

/**
 * Remplit la base avec les données de démonstration (seed-data/*.json).
 * On réutilise les fonctions de l'API (validation + insertion) : les données de démo
 * respectent donc exactement les mêmes règles que celles saisies par les utilisateurs.
 */
export async function seedDatabase() {
  // Les fichiers JSON ont leurs propres identifiants (101, 102...) : on retient
  // à quel nouvel identifiant de la base chacun correspond.
  const userIdByOldId = new Map();

  for (const profile of profilesData.profiles) {
    const user = await insertUser({
      username: profile.username,
      email: profile.email,
      passwordHash: await hashPassword(profile.password),
      role: profile.email === 'admin@example.com' ? 'admin' : 'user',
      profileImageUrl: profile.profile_img,
    });
    userIdByOldId.set(profile.user_id, user.id);
  }

  for (const figure of figuresData.figures) {
    const productFields = productSchema.parse({
      title: figure.title,
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

  return { userCount: profilesData.profiles.length, productCount: figuresData.figures.length };
}
