import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify token presence (PHP JWT auth)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ") || authHeader.replace("Bearer ", "").trim().length < 10) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getServiceClient();
    const { action, analysisType, resultData, decisions } = await req.json();

    // Load cached results
    if (action === "load_cache") {
      const { data, error } = await supabase
        .from("ai_analysis_results")
        .select("analysis_type, result_data, updated_at");
      if (error) throw error;
      const map: Record<string, any> = {};
      data?.forEach((row: any) => {
        map[row.analysis_type] = { data: row.result_data, updatedAt: row.updated_at };
      });
      return new Response(JSON.stringify(map), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save cached result
    if (action === "save_cache" && analysisType && resultData) {
      const { error } = await supabase
        .from("ai_analysis_results")
        .upsert({ analysis_type: analysisType, result_data: resultData }, { onConflict: "analysis_type" });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load decision log
    if (action === "load_decisions") {
      const { data, error } = await supabase
        .from("ai_decision_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const mapped = (data || []).map((d: any) => ({
        ...d, timestamp: d.created_at, targetName: d.target_name,
        targetType: d.target_type, executedBy: d.executed_by,
      }));
      return new Response(JSON.stringify(mapped), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save decisions
    if (action === "save_decisions" && decisions?.length > 0) {
      const rows = decisions.map((d: any) => ({
        title: d.title || "", description: d.description || "", action: d.action || "",
        severity: d.severity || "info", target_name: d.targetName || "",
        target_type: d.targetType || "", reasoning: d.reasoning || "", executed_by: "AI",
      }));
      const { error } = await supabase.from("ai_decision_log").insert(rows);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-cache error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
