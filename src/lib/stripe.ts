import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key (safe to expose in client-side code)
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('Missing VITE_STRIPE_PUBLISHABLE_KEY');
}

export const stripePromise = loadStripe(stripePublishableKey);

