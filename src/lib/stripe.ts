import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key from environment variable
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey) 
  : null;
