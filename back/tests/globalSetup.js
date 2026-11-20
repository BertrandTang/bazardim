import pg from 'pg';
import { recreateSchema } from '../database/recreateSchema.js';
import { TEST_ENVIRONMENT } from './testEnvironment.js';

/** Exécuté une seule fois avant tous les tests : recrée les tables de la base de test. */
export default async function setup() {
  const client = new pg.Client({ connectionString: TEST_ENVIRONMENT.DATABASE_URL });
  await client.connect();
  try {
    await recreateSchema((sql) => client.query(sql));
  } finally {
    await client.end();
  }
}
