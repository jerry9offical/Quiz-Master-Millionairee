import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://id-preview--a6243a77-80a7-4ccb-8524-b934274988bf.lovable.app",
  "https://quiz-master-millionaireonline.lovable.app",
  "https://quiz-master-millionaire.online",
  "http://localhost:5173",
  "http://localhost:8080",
];

const getCorsHeaders = (origin: string | null) => {
  // Check if the origin is allowed, default to first allowed origin
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o.replace(/\/$/, '')))
    ? origin
    : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
};

// Product/Price configuration - LIVE MODE
const TIERS = {
  standard: {
    price_id: "price_1Sw7ENRsiGz4HkfodLbZDzL4",
    product_id: "prod_Ttv40fjUYUsNxr",
    name: "QuizMaster Standard",
    amount: 1000, // $10
  },
  premium: {
    price_id: "price_1Sw7EORsiGz4Hkfoovj5ONgb",
    product_id: "prod_Ttv44EXaALJzf2",
    name: "QuizMaster Premium",
    amount: 2000, // $20
  },
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Parse request body for tier selection
    const { tier } = await req.json();
    logStep("Received tier", { tier });

    if (!tier || !TIERS[tier as keyof typeof TIERS]) {
      throw new Error(`Invalid tier: ${tier}. Must be 'standard' or 'premium'.`);
    }

    const selectedTier = TIERS[tier as keyof typeof TIERS];
    logStep("Selected tier", { tierName: selectedTier.name, priceId: selectedTier.price_id });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });
    logStep("Stripe initialized");

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer, will create new one during checkout");
    }

    // Get origin for redirect URLs
    const redirectOrigin = origin || ALLOWED_ORIGINS[0];
    logStep("Using origin", { redirectOrigin });

    // Create embedded checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id, // Store user ID for verification
      line_items: [
        {
          price: selectedTier.price_id,
          quantity: 1,
        },
      ],
      mode: "payment",
      ui_mode: "embedded",
      return_url: `${redirectOrigin}/payment-success?tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        user_id: user.id,
        tier: tier,
      },
    });
    
    logStep("Embedded checkout session created", { sessionId: session.id, clientSecret: session.client_secret ? "present" : "missing" });

    return new Response(JSON.stringify({ 
      clientSecret: session.client_secret,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
