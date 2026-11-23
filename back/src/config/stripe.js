import Stripe from 'stripe';
import { config } from './config.js';

// Client Stripe : il sert à créer les pages de paiement et à vérifier les webhooks.
// Il utilise la clé SECRÈTE, qui ne doit jamais être envoyée au navigateur.
// Pendant les tests, ce fichier est remplacé par une version simulée (voir tests/orders.test.js).
export const stripe = new Stripe(config.STRIPE_SECRET_KEY);
