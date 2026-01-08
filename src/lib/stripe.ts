import { loadStripe } from "@stripe/stripe-js";

// Stripe publishable key (safe to expose in client-side code)
// This key is public and safe to include in source code
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Lazy initialization to avoid throwing during module load
let stripePromiseInstance: ReturnType<typeof loadStripe> | null = null;

export const getStripePromise = () => {
  if (!stripePromiseInstance) {
    if (!stripePublishableKey) {
      console.error("VITE_STRIPE_PUBLISHABLE_KEY not configured");
      return null;
    }
    stripePromiseInstance = loadStripe(stripePublishableKey);
  }
  return stripePromiseInstance;
};

// For backwards compatibility
export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

