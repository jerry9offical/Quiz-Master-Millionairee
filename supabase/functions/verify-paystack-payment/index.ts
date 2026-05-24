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

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[VERIFY-PAYSTACK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { reference } = await req.json();
    if (!reference) throw new Error("reference is required");
    logStep("Received reference", { reference });

    // Auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Verify with Paystack
    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) throw new Error("PAYSTACK_SECRET_KEY is not set");

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { "Authorization": `Bearer ${paystackKey}` },
    });

    const result = await response.json();
    logStep("Paystack verification", { status: result.data?.status, gateway_response: result.data?.gateway_response });

    if (!result.status || result.data?.status !== "success") {
      return new Response(JSON.stringify({
        success: false,
        message: "Payment not completed",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify user matches
    const metadata = result.data.metadata;
    if (metadata?.user_id !== user.id) {
      throw new Error("Transaction does not belong to this user");
    }

    const tier = metadata?.tier;
    if (!tier || (tier !== "standard" && tier !== "premium")) {
      throw new Error("Invalid tier in transaction metadata");
    }
    logStep("Tier verified", { tier });

    // Update profile
    const updateData: Record<string, unknown> = { access_tier: tier };
    if (tier === "standard") {
      updateData.standard_purchased_at = new Date().toISOString();
    } else if (tier === "premium") {
      updateData.premium_purchased_at = new Date().toISOString();
      updateData.standard_purchased_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update(updateData)
      .eq("user_id", user.id);

    if (updateError) throw new Error(`Profile update failed: ${updateError.message}`);
    logStep("Profile updated", { tier, userId: user.id });

    return new Response(JSON.stringify({
      success: true,
      tier,
      message: `Successfully upgraded to ${tier}!`,
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
