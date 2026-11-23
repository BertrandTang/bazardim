import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// Variables d'environnement utilisées pendant les tests. Aucun secret n'est écrit ici :
// - l'adresse de la base de test vient de TEST_DATABASE_URL (fichier back/.env en local,
//   variable fournie par GitHub Actions en CI) ;
// - la clé JWT est tirée au hasard à chaque lancement des tests ;
// - les clés Stripe sont fausses : Stripe n'est jamais appelé pendant les tests.

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
  // Les images envoyées pendant les tests vont dans un dossier temporaire, pas dans back/uploads/.
  UPLOAD_DIRECTORY: join(tmpdir(), 'bazardim-tests-uploads'),
  // Fausses clés : pendant les tests, Stripe est simulé (voir tests/orders.test.js).
  STRIPE_SECRET_KEY: 'sk_test_fausse_cle_pour_les_tests',
  STRIPE_WEBHOOK_SECRET: 'whsec_faux_secret_pour_les_tests',
};
