import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key - this is safe to expose in client-side code
const stripePublishableKey = 'pk_test_51SmxFvA18R9LygVKFSmvPnmOORt2Ec6hVFl2XJYjAVeMzh1ZoW8S2fVmS5EXlqy5wbSv4J4F5DqFwj5hSt1cIeYN00MPhY0dQ6';

export const stripePromise = loadStripe(stripePublishableKey);
