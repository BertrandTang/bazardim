import { HttpError } from '../utils/errors.js';
import { idSchema } from '../validators/common.validator.js';
import { sendMessageSchema } from '../validators/messages.validator.js';
import {
  countUnreadMessages,
  findMessageById,
  findReceivedMessages,
  findSentMessages,
  insertMessage,
  markMessageAsRead,
} from '../models/messages.model.js';
import { findProductById } from '../models/products.model.js';
import { findUserById } from '../models/users.model.js';

/** GET /api/messages/received — boîte de réception de l'utilisateur connecté. */
export async function listReceivedMessages(request, response) {
  response.json(await findReceivedMessages(request.user.id));
}

/** GET /api/messages/unread-count — nombre de messages non lus : { count: 2 }. */
export async function getUnreadCount(request, response) {
  response.json({ count: await countUnreadMessages(request.user.id) });
}

/** GET /api/messages/sent — messages envoyés par l'utilisateur connecté. */
export async function listSentMessages(request, response) {
  response.json(await findSentMessages(request.user.id));
}

/** POST /api/messages — envoie un message à un autre utilisateur, à propos d'une annonce. */
export async function sendMessage(request, response) {
  const { recipient_id: recipientId, product_id: productId, content } = sendMessageSchema.parse(request.body);

  if (recipientId === request.user.id) {
    throw new HttpError(400, 'Vous ne pouvez pas vous envoyer un message.');
  }
  if (!(await findUserById(recipientId))) {
    throw new HttpError(404, 'Destinataire introuvable.');
  }
  if (productId !== null && !(await findProductById(productId))) {
    throw new HttpError(404, 'Produit introuvable.');
  }

  const messageId = await insertMessage({ senderId: request.user.id, recipientId, productId, content });
  response.status(201).json(await findMessageById(messageId));
}

/** PATCH /api/messages/:id/read — marque un message reçu comme lu. */
export async function markAsRead(request, response) {
  const messageId = idSchema.parse(request.params.id);
  const message = await findMessageById(messageId);
  if (!message) {
    throw new HttpError(404, 'Message introuvable.');
  }
  // Seul le destinataire peut marquer le message comme lu.
  if (message.recipient_id !== request.user.id) {
    throw new HttpError(403, 'Ce message ne vous est pas destiné.');
  }
  await markMessageAsRead(messageId);
  response.status(204).end();
}
