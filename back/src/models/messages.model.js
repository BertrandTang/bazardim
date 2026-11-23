import { query } from '../config/database.js';

// Colonnes renvoyées pour un message : en plus du message lui-même, on joint le pseudo
// de l'expéditeur, celui du destinataire et le titre de l'annonce concernée.
// La table users apparaît deux fois : on lui donne deux alias (senders, recipients).
const MESSAGE_SELECT = `
  SELECT
    messages.id,
    messages.content,
    messages.is_read,
    messages.created_at,
    messages.product_id,
    products.title AS product_title,
    messages.sender_id,
    senders.username AS sender_username,
    messages.recipient_id,
    recipients.username AS recipient_username
  FROM messages
  JOIN users AS senders ON senders.id = messages.sender_id
  JOIN users AS recipients ON recipients.id = messages.recipient_id
  LEFT JOIN products ON products.id = messages.product_id`;

/** Messages reçus par un utilisateur (boîte de réception), du plus récent au plus ancien. */
export async function findReceivedMessages(userId) {
  return query(
    `${MESSAGE_SELECT} WHERE messages.recipient_id = $1 ORDER BY messages.created_at DESC, messages.id DESC`,
    [userId],
  );
}

/** Messages envoyés par un utilisateur, du plus récent au plus ancien. */
export async function findSentMessages(userId) {
  return query(`${MESSAGE_SELECT} WHERE messages.sender_id = $1 ORDER BY messages.created_at DESC, messages.id DESC`, [
    userId,
  ]);
}

export async function findMessageById(messageId) {
  const rows = await query(`${MESSAGE_SELECT} WHERE messages.id = $1`, [messageId]);
  return rows[0] ?? null;
}

/** Enregistre un message et retourne son id. */
export async function insertMessage({ senderId, recipientId, productId, content }) {
  const rows = await query(
    `INSERT INTO messages (sender_id, recipient_id, product_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [senderId, recipientId, productId, content],
  );
  return rows[0].id;
}

export async function markMessageAsRead(messageId) {
  await query('UPDATE messages SET is_read = TRUE WHERE id = $1', [messageId]);
}
