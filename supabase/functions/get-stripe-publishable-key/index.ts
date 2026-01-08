import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Prefer STRIPE_PUBLISHABLE_KEY; fallback to VITE_STRIPE_PUBLISHABLE_KEY if that's what exists.
    const key =
      Deno.env.get("STRIPE_PUBLISHABLE_KEY") ??
      Deno.env.get("VITE_STRIPE_PUBLISHABLE_KEY") ??
      "";

    if (!key) {
      throw new Error("Missing STRIPE_PUBLISHABLE_KEY");
    }

    return new Response(JSON.stringify({ publishableKey: key }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
