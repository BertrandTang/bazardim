import nodemailer from 'nodemailer';
import { config } from './config.js';

/**
 * Envoi des e-mails de l'application avec nodemailer, par le protocole SMTP.
 *
 * - En développement, les e-mails partent vers Mailpit (conteneur Docker) : ils ne quittent
 *   jamais l'ordinateur et s'affichent sur http://localhost:8025.
 * - En production, les variables SMTP_* du fichier .env désignent un vrai service d'envoi.
 */
const transport = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  // Le port 465 utilise une connexion chiffrée dès le départ ; les autres la négocient ensuite.
  secure: config.SMTP_PORT === 465,
  // Identifiants seulement s'ils sont fournis (Mailpit n'en demande pas).
  auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined,
});

/**
 * Envoie un e-mail en texte simple.
 *
 * @param {object} email
 * @param {string} email.to - Adresse du destinataire.
 * @param {string} email.subject - Objet de l'e-mail.
 * @param {string} email.text - Contenu de l'e-mail.
 */
export async function sendEmail({ to, subject, text }) {
  await transport.sendMail({ from: config.MAIL_FROM, to, subject, text });
}
