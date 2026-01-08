import { loadStripe } from "@stripe/stripe-js";

// Stripe publishable key (safe to expose in client-side code)
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey || stripePublishableKey.includes("TU_CLAVE_NUEVA")) {
  throw new Error(
    "Stripe: falta VITE_STRIPE_PUBLISHABLE_KEY (o es un placeholder). Configúrala en las variables de entorno."
  );
}

export const stripePromise = loadStripe(stripePublishableKey);

