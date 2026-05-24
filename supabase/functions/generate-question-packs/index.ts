import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = [
  "biology", "chemistry", "microbiology", "data_science", "medicine",
  "gmat", "gre", "a_level", "gcse", "general_knowledge",
  "physics", "mathematics", "sports",
  "fifa_regulations", "player_transfers", "agent_ethics", "representation_conflicts",
];

// Difficulty bands that match the RPC gating
const BANDS = [
  { label: "easy", min: 1, max: 7, minRequired: 4 },
  { label: "medium", min: 8, max: 12, minRequired: 6 },
  { label: "hard", min: 13, max: 15, minRequired: 5 },
];

interface PackConfig {
  pack_type: "daily" | "weekly" | "weekly_premium";
  questions_per_category: number;
  is_premium: boolean;
  duration_hours: number;
  // Multiplier for how many questions per band (relative to minRequired)
  band_multiplier: number;
}

const PACK_CONFIGS: PackConfig[] = [
  { pack_type: "daily", questions_per_category: 25, is_premium: false, duration_hours: 24, band_multiplier: 1.5 },
  { pack_type: "weekly", questions_per_category: 100, is_premium: false, duration_hours: 168, band_multiplier: 4 },
  { pack_type: "weekly_premium", questions_per_category: 150, is_premium: true, duration_hours: 168, band_multiplier: 6 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let packTypes: string[] = ["daily"];
    try {
      const body = await req.json();
      if (body?.pack_types && Array.isArray(body.pack_types)) {
        packTypes = body.pack_types;
      }
    } catch {
      // Default to daily
    }

    const configs = PACK_CONFIGS.filter((c) => packTypes.includes(c.pack_type));
    const now = new Date();
    const results: { category: string; pack_type: string; count: number; bands: Record<string, number> }[] = [];

    for (const config of configs) {
      const startsAt = now.toISOString();
      const endsAt = new Date(now.getTime() + config.duration_hours * 60 * 60 * 1000).toISOString();

      // Deactivate old packs
      await supabase
        .from("question_packs")
        .update({ active: false })
        .eq("pack_type", config.pack_type)
        .eq("active", true);

      for (const category of CATEGORIES) {
        const allSelected: string[] = [];
        const bandCounts: Record<string, number> = {};

        // Select questions per band to ensure coverage
        for (const band of BANDS) {
          const targetCount = Math.ceil(band.minRequired * config.band_multiplier);

          let query = supabase
            .from("questions")
            .select("id")
            .eq("category", category)
            .eq("is_active", true)
            .gte("difficulty_level", band.min)
            .lte("difficulty_level", band.max);

          if (!config.is_premium) {
            query = query.eq("is_premium", false);
          }

          const { data: questions } = await query.limit(500);

          if (!questions || questions.length === 0) {
            console.log(`No ${band.label} questions for ${category} (${config.pack_type})`);
            bandCounts[band.label] = 0;
            continue;
          }

          const shuffled = questions.sort(() => Math.random() - 0.5);
          const picked = shuffled.slice(0, targetCount);
          picked.forEach((q) => allSelected.push(q.id));
          bandCounts[band.label] = picked.length;
        }

        if (allSelected.length === 0) {
          console.log(`No questions at all for ${category} (${config.pack_type}), skipping`);
          continue;
        }

        // Create pack
        const { data: pack, error: packErr } = await supabase
          .from("question_packs")
          .insert({
            category,
            pack_type: config.pack_type,
            starts_at: startsAt,
            ends_at: endsAt,
            difficulty_min: 1,
            difficulty_max: 15,
            is_premium: config.is_premium,
            active: true,
          })
          .select("id")
          .single();

        if (packErr || !pack) {
          console.error(`Failed to create pack for ${category}:`, packErr);
          continue;
        }

        // Dedupe and insert items
        const uniqueIds = [...new Set(allSelected)];
        const items = uniqueIds.map((qId) => ({
          pack_id: pack.id,
          question_id: qId,
        }));

        const { error: itemsErr } = await supabase
          .from("question_pack_items")
          .insert(items);

        if (itemsErr) {
          console.error(`Failed to insert pack items for ${category}:`, itemsErr);
          continue;
        }

        results.push({ category, pack_type: config.pack_type, count: uniqueIds.length, bands: bandCounts });
      }
    }

    return new Response(
      JSON.stringify({ success: true, packs_generated: results.length, details: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Pack generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
