import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Stack } from '@mui/material';
import MessageForm from '../../components/MessageForm/MessageForm.jsx';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import { useMessages } from '../../context/MessagesContext.jsx';
import { fetchReceivedMessages, fetchSentMessages, markMessageAsRead, sendMessage } from '../../services/api.js';
import './Messages.css';

// Les deux onglets de la messagerie, et la fonction de l'API qui charge chacun d'eux.
const BOXES = [
  { id: 'received', label: 'Reçus', fetchMessages: fetchReceivedMessages },
  { id: 'sent', label: 'Envoyés', fetchMessages: fetchSentMessages },
];

/** Formate une date de l'API ("2026-11-23T10:15:00Z") en texte français : "23/11/2026 11:15". */
function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * Page Messagerie (adresse : /messages, réservée aux utilisateurs connectés).
 * Pas de discussion en direct : une boîte de réception et la liste des messages envoyés.
 */
export default function Messages() {
  const [activeBoxId, setActiveBoxId] = useState('received');
  // Messages chargés, avec l'onglet auquel ils correspondent (null = rien de chargé).
  const [loadedBox, setLoadedBox] = useState({ boxId: null, messages: [], errorMessage: '' });

  const activeBox = BOXES.find((box) => box.id === activeBoxId);

  // Charge les messages de l'onglet actif, à chaque changement d'onglet.
  useEffect(() => {
    activeBox
      .fetchMessages()
      .then((messages) => setLoadedBox({ boxId: activeBox.id, messages, errorMessage: '' }))
      .catch((error) => setLoadedBox({ boxId: activeBox.id, messages: [], errorMessage: error.message }));
  }, [activeBox]);

  /** Met à jour un message de la liste affichée (ex : il vient d'être lu). */
  function replaceMessage(updatedMessage) {
    setLoadedBox((previousBox) => ({
      ...previousBox,
      messages: previousBox.messages.map((message) => (message.id === updatedMessage.id ? updatedMessage : message)),
    }));
  }

  const isLoading = loadedBox.boxId !== activeBoxId;

  return (
    <section className="messages-page">
      <PageMetadata title="Messagerie" noIndex />
      <h1>Messagerie</h1>

      <Stack direction="row" spacing={1} className="messages-tabs">
        {BOXES.map((box) => (
          <Button
            key={box.id}
            variant={box.id === activeBoxId ? 'contained' : 'text'}
            aria-current={box.id === activeBoxId ? 'page' : undefined}
            onClick={() => setActiveBoxId(box.id)}
          >
            {box.label}
          </Button>
        ))}
      </Stack>

      {isLoading && <p>Chargement…</p>}
      {!isLoading && loadedBox.errorMessage && <Alert severity="error">{loadedBox.errorMessage}</Alert>}
      {!isLoading && !loadedBox.errorMessage && loadedBox.messages.length === 0 && (
        <p className="messages-empty">Aucun message.</p>
      )}

      {!isLoading && (
        <ul className="messages-list">
          {loadedBox.messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isReceived={activeBoxId === 'received'}
              onMessageUpdated={replaceMessage}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Un message de la liste. Pour un message reçu : bouton "Marquer comme lu"
 * et formulaire de réponse (la réponse concerne la même annonce).
 */
function MessageItem({ message, isReceived, onMessageUpdated }) {
  const { refreshUnreadCount } = useMessages();
  const [isReplying, setIsReplying] = useState(false);
  const isUnread = isReceived && !message.is_read;

  async function handleMarkAsRead() {
    await markMessageAsRead(message.id);
    onMessageUpdated({ ...message, is_read: true });
    // Met à jour la pastille de la barre de navigation.
    refreshUnreadCount();
  }

  async function handleReply(content) {
    await sendMessage({ recipient_id: message.sender_id, product_id: message.product_id, content });
    // Répondre à un message revient à l'avoir lu.
    if (isUnread) {
      await handleMarkAsRead();
    }
  }

  return (
    <li className={isUnread ? 'message-item unread' : 'message-item'}>
      <div className="message-header">
        <span>
          {isReceived ? 'De' : 'À'}{' '}
          <Link to={`/user/${isReceived ? message.sender_id : message.recipient_id}`}>
            {isReceived ? message.sender_username : message.recipient_username}
          </Link>
          {isUnread && <span className="message-new-badge">Nouveau</span>}
        </span>
        <time dateTime={message.created_at}>{formatDate(message.created_at)}</time>
      </div>

      <p className="message-product">
        Annonce :{' '}
        {message.product_id ? (
          <Link to={`/product/${message.product_id}`}>{message.product_title}</Link>
        ) : (
          <em>annonce supprimée</em>
        )}
      </p>

      {/* white-space: pre-line (voir le CSS) conserve les retours à la ligne du message. */}
      <p className="message-content">{message.content}</p>

      {isReceived && (
        <div className="message-actions">
          <Button size="small" onClick={() => setIsReplying(!isReplying)}>
            {isReplying ? 'Fermer' : 'Répondre'}
          </Button>
          {isUnread && (
            <Button size="small" onClick={handleMarkAsRead}>
              Marquer comme lu
            </Button>
          )}
        </div>
      )}

      {isReplying && (
        <MessageForm label={`Votre réponse à ${message.sender_username}`} submitLabel="Envoyer" onSend={handleReply} />
      )}
    </li>
  );
}
