import bcrypt from 'bcryptjs';
import { config } from '../config/config.js';

// Coût du hachage : plus il est élevé, plus il est long de tester des millions de mots de passe
// en cas de vol de la base. 12 est une valeur recommandée aujourd'hui (≈ 0,2 s par hachage).
// Pendant les tests on utilise le minimum (4) pour qu'ils restent rapides.
const HASH_ROUNDS = config.isTest ? 4 : 12;

/** Calcule l'empreinte (hash) d'un mot de passe, à stocker en base à la place du mot de passe. */
export function hashPassword(password) {
  return bcrypt.hash(password, HASH_ROUNDS);
}

/** Vérifie qu'un mot de passe correspond à l'empreinte enregistrée. */
export function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
