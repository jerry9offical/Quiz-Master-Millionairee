import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  "https://id-preview--a6243a77-80a7-4ccb-8524-b934274988bf.lovable.app",
  "https://quiz-master-millionaireonline.lovable.app",
  "https://quiz-master-millionaire.online",
  "http://localhost:5173",
  "http://localhost:8080",
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o.replace(/\/$/, '')))
    ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
};

const TIERS: Record<string, { amount: number; name: string }> = {
  standard: { amount: 500000, name: "QuizMaster Standard" },  // ₦5,000 in kobo
  premium: { amount: 1000000, name: "QuizMaster Premium" },   // ₦10,000 in kobo
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[CREATE-PAYSTACK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { tier } = await req.json();
    if (!tier || !TIERS[tier]) throw new Error(`Invalid tier: ${tier}`);

    const selectedTier = TIERS[tier];
    logStep("Selected tier", { tier, amount: selectedTier.amount });

    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Paystack transaction
    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) throw new Error("PAYSTACK_SECRET_KEY is not set");

    const redirectOrigin = origin || ALLOWED_ORIGINS[0];
    const callbackUrl = `${redirectOrigin}/payment-success?tier=${tier}&gateway=paystack`;

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: selectedTier.amount,
        currency: "NGN",
        callback_url: callbackUrl,
        metadata: {
          user_id: user.id,
          tier: tier,
          custom_fields: [
            { display_name: "Plan", variable_name: "plan", value: selectedTier.name },
          ],
        },
      }),
    });

    const result = await response.json();
    logStep("Paystack response", { status: result.status, message: result.message });

    if (!result.status) {
      throw new Error(result.message || "Paystack initialization failed");
    }

    return new Response(JSON.stringify({
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference,
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
