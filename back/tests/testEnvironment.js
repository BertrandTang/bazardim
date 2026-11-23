import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// Variables d'environnement utilisées pendant les tests. Aucun secret n'est écrit ici :
// - l'adresse de la base de test vient de TEST_DATABASE_URL (fichier back/.env en local,
//   variable fournie par GitHub Actions en CI) ;
// - la clé JWT est tirée au hasard à chaque lancement des tests.

const ENV_FILE = new URL('../.env', import.meta.url);
const environmentFromFile = existsSync(ENV_FILE) ? parseEnv(readFileSync(ENV_FILE, 'utf8')) : {};
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? environmentFromFile.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL manquant : ajoutez-le dans back/.env (voir .env.example).');
}

// Garde-fou : les tests vident la base, on refuse donc toute base qui n'est pas une base de test.
if (!testDatabaseUrl.endsWith('_test')) {
  throw new Error('TEST_DATABASE_URL doit désigner une base dont le nom finit par "_test".');
}

export const TEST_ENVIRONMENT = {
  NODE_ENV: 'test',
  DATABASE_URL: testDatabaseUrl,
  JWT_SECRET: randomBytes(32).toString('hex'),
  FRONT_URL: 'http://localhost:5173',
};
