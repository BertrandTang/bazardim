import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Variables d'environnement attendues (fichier .env, voir .env.example).
// On les valide dès le démarrage : si l'une d'elles manque ou est invalide, le serveur
// refuse de démarrer avec un message clair, plutôt que de planter plus tard.
const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().startsWith('postgres', 'doit être une URL PostgreSQL (postgres://...)'),
  JWT_SECRET: z.string().min(32, 'doit contenir au moins 32 caractères aléatoires'),
  // Adresse du front-end : seule origine autorisée à appeler l'API (CORS).
  FRONT_URL: z.string().default('http://localhost:5173'),
  // Dossier où sont enregistrées les images envoyées (par défaut : back/uploads/).
  UPLOAD_DIRECTORY: z.string().default(fileURLToPath(new URL('../../uploads/', import.meta.url))),
  // Clé secrète Stripe. Seules les clés de TEST sont acceptées : aucun vrai paiement possible.
  STRIPE_SECRET_KEY: z.string().startsWith('sk_test_', 'doit être une clé de test Stripe (sk_test_...)'),
  // Secret du webhook Stripe (facultatif en local : voir back/README.md).
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'doit commencer par whsec_').optional(),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const problems = parsedEnvironment.error.issues.map((issue) => `  - ${issue.path.join('.')} : ${issue.message}`);
  throw new Error(`Configuration invalide (fichier .env) :\n${problems.join('\n')}`);
}

export const config = {
  ...parsedEnvironment.data,
  isProduction: parsedEnvironment.data.NODE_ENV === 'production',
  isTest: parsedEnvironment.data.NODE_ENV === 'test',
};
