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

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
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

    // Parse request body
    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");
    logStep("Received session_id", { session_id });

    // Initialize Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Session retrieved", { 
      status: session.payment_status,
      clientRefId: session.client_reference_id,
      metadata: session.metadata 
    });

    // Verify this session belongs to the current user
    if (session.client_reference_id !== user.id) {
      throw new Error("Session does not belong to this user");
    }

    // Check payment status
    if (session.payment_status !== "paid") {
      logStep("Payment not completed", { status: session.payment_status });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get tier from session metadata
    const tier = session.metadata?.tier;
    if (!tier || (tier !== "standard" && tier !== "premium")) {
      throw new Error("Invalid tier in session metadata");
    }
    logStep("Tier verified", { tier });

    // Update user's profile with new access tier
    const updateData: Record<string, unknown> = {
      access_tier: tier,
    };

    // Set purchase timestamp
    if (tier === "standard") {
      updateData.standard_purchased_at = new Date().toISOString();
    } else if (tier === "premium") {
      updateData.premium_purchased_at = new Date().toISOString();
      // Premium also includes standard benefits
      if (!updateData.standard_purchased_at) {
        updateData.standard_purchased_at = new Date().toISOString();
      }
    }

    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update(updateData)
      .eq("user_id", user.id);

    if (updateError) {
      logStep("Profile update error", { error: updateError.message });
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    logStep("Profile updated successfully", { tier, userId: user.id });

    return new Response(JSON.stringify({ 
      success: true, 
      tier,
      message: `Successfully upgraded to ${tier}!`
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
