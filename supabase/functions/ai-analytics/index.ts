import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { businessData, analysisType } = await req.json();

    const systemPrompts: Record<string, string> = {
      "full-analysis": `أنت محلل أعمال ذكي متخصص في استوديوهات التصوير. قم بتحليل البيانات المقدمة وأرجع تحليلاً شاملاً بصيغة JSON فقط (بدون أي نص إضافي). يجب أن يكون الرد JSON صالح يحتوي على:
{
  "salesAnalysis": { "trend": "up|down|stable", "summary": "ملخص قصير", "growthRate": number, "bestMonth": "string", "worstMonth": "string" },
  "customerAnalysis": { "totalActive": number, "newThisMonth": number, "topCustomers": ["name1","name2"], "retentionRate": number, "summary": "string" },
  "employeeAnalysis": [{ "name": "string", "score": number (0-100), "status": "excellent|good|warning|critical", "notes": "string" }],
  "inventoryAnalysis": { "lowStockItems": number, "totalValue": number, "summary": "string", "alerts": ["string"] },
  "fraudAlerts": [{ "type": "string", "severity": "low|medium|high", "description": "string", "recommendation": "string" }],
  "forecasting": { "nextMonthRevenue": number, "trend": "string", "confidence": number, "summary": "string" },
  "recommendations": [{ "title": "string", "description": "string", "impact": "high|medium|low", "category": "pricing|marketing|operations|hr" }],
  "overallScore": number (0-100),
  "overallSummary": "string"
}`,
      "decisions": `أنت مركز اتخاذ قرارات ذكي لاستوديو تصوير. بناءً على البيانات، قم بإنشاء قرارات وإجراءات تلقائية. أرجع JSON فقط:
{
  "decisions": [{ "id": "string", "title": "string", "description": "string", "action": "alert|reduce_permissions|suspend|price_change|restock|reactivate", "targetType": "employee|customer|inventory|pricing", "targetName": "string", "severity": "info|warning|critical", "autoExecute": boolean, "reasoning": "string" }],
  "employeeScores": [{ "name": "string", "performanceScore": number, "attendanceScore": number, "overallScore": number, "recommendation": "promote|maintain|warn|review" }],
  "strategicActions": [{ "title": "string", "category": "string", "expectedImpact": "string", "priority": "high|medium|low" }]
}`,
      "monitoring": `أنت نظام مراقبة أمني ذكي لاستوديو تصوير. حلل الأنشطة واكتشف أي سلوك مشبوه. أرجع JSON فقط:
{
  "riskLevel": "low|medium|high|critical",
  "activities": [{ "type": "string", "user": "string", "action": "string", "riskScore": number (0-100), "timestamp": "string", "details": "string" }],
  "anomalies": [{ "type": "string", "description": "string", "severity": "low|medium|high", "suggestedAction": "string" }],
  "systemHealth": { "score": number, "uptime": "string", "activeUsers": number, "summary": "string" }
}`
    };

    const systemPrompt = systemPrompts[analysisType] || systemPrompts["full-analysis"];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `هذه بيانات الاستوديو الحالية:\n${JSON.stringify(businessData, null, 2)}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    jsonStr = jsonStr.trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { overallSummary: content, overallScore: 75 };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-analytics error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
