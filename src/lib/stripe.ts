import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key (safe to expose in client-side code)
export const stripePromise = loadStripe('pk_test_51SmxFvA18R9LygVKkNvQhichv7L5YuWboV6HS3Fe2LisWetleD5qE4Vh81Fxuh14FGznGhHyEIYt88Nj9NxBkmSd0001BkhGHc');
