// Script lancé par `npm run db:reset` : recrée toutes les tables puis insère les données de démo.
// ⚠️ Toutes les données de la base de développement sont effacées.
import { closeDatabase, query } from '../src/database.js';
import { recreateSchema } from './recreateSchema.js';
import { seedDatabase } from './seed.js';

try {
  await recreateSchema(query);
  const { userCount, productCount } = await seedDatabase();
  console.log(`Base réinitialisée : ${userCount} utilisateurs et ${productCount} produits insérés.`);
} catch (error) {
  console.error('Échec de la réinitialisation de la base :', error.message);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
