import { randomInt } from 'node:crypto';
import { sendEmail } from '../config/mailer.js';
import { saveTwoFactorCode } from '../models/twoFactorCodes.model.js';
import { hashPassword } from './passwords.js';

/**
 * Double authentification (« authentification forte ») par code envoyé par e-mail.
 *
 * Pour se connecter, il faut alors deux preuves :
 * 1. quelque chose que l'on SAIT : le mot de passe ;
 * 2. quelque chose que l'on POSSÈDE : l'accès à sa boîte mail, où arrive un code à 6 chiffres.
 * Un mot de passe volé ne suffit donc plus pour entrer dans le compte.
 */

// Durée de validité d'un code, en minutes.
export const CODE_VALIDITY_IN_MINUTES = 10;

// Nombre de mauvais codes acceptés avant d'annuler le code (contre les essais au hasard :
// 5 essais sur 1 000 000 de codes possibles, la chance de deviner est infime).
export const MAXIMUM_CODE_ATTEMPTS = 5;

/** Vrai si l'utilisateur doit saisir un code : il l'a activé, ou c'est un administrateur. */
export function requiresTwoFactor(user) {
  return user.two_factor_enabled || user.role === 'admin';
}

/**
 * Crée un nouveau code, l'enregistre (haché) et l'envoie par e-mail à l'utilisateur.
 * randomInt de node:crypto donne un nombre réellement imprévisible (contrairement à Math.random).
 */
export async function sendTwoFactorCode(user) {
  // padStart : 42 devient "000042", le code a toujours 6 chiffres.
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await saveTwoFactorCode(user.id, await hashPassword(code), CODE_VALIDITY_IN_MINUTES);

  await sendEmail({
    to: user.email,
    subject: `${code} est votre code de connexion Bazardim`,
    text: [
      `Bonjour ${user.username},`,
      '',
      `Votre code de connexion Bazardim : ${code}`,
      '',
      `Il est valable ${CODE_VALIDITY_IN_MINUTES} minutes et ne peut servir qu’une seule fois.`,
      'Si vous n’êtes pas à l’origine de cette connexion, changez votre mot de passe :',
      'quelqu’un le connaît, mais il ne peut pas entrer dans votre compte sans ce code.',
      '',
      'L’équipe Bazardim',
    ].join('\n'),
  });
}
