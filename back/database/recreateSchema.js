import { readFile } from 'node:fs/promises';

/**
 * Supprime TOUTES les tables puis recrée le schéma à partir de schema.sql.
 * ⚠️ Efface toutes les données : à n'utiliser qu'en développement et pour les tests.
 *
 * @param {(sql: string) => Promise<*>} executeSql - Fonction qui exécute du SQL sur la bonne base.
 */
export async function recreateSchema(executeSql) {
  const schemaSql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await executeSql('DROP SCHEMA IF EXISTS public CASCADE');
  await executeSql('CREATE SCHEMA public');
  await executeSql(schemaSql);
}
