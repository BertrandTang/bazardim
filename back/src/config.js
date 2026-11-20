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
