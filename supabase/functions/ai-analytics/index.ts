import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompts: Record<string, string> = {
  "full-analysis": `أنت محلل أعمال ذكي متخصص في استوديوهات التصوير. قم بتحليل البيانات المقدمة وأرجع تحليلاً شاملاً بصيغة JSON فقط (بدون أي نص إضافي). يجب أن يكون الرد JSON صالح يحتوي على:
{
  "salesAnalysis": { "trend": "up|down|stable", "summary": "ملخص قصير", "growthRate": 0, "bestMonth": "string", "worstMonth": "string" },
  "customerAnalysis": { "totalActive": 0, "newThisMonth": 0, "topCustomers": ["name1","name2"], "retentionRate": 0, "summary": "string" },
  "employeeAnalysis": [{ "name": "string", "score": 0, "status": "excellent|good|warning|critical", "notes": "string" }],
  "inventoryAnalysis": { "lowStockItems": 0, "totalValue": 0, "summary": "string", "alerts": ["string"] },
  "fraudAlerts": [{ "type": "string", "severity": "low|medium|high", "description": "string", "recommendation": "string" }],
  "forecasting": { "nextMonthRevenue": 0, "trend": "string", "confidence": 0, "summary": "string" },
  "recommendations": [{ "title": "string", "description": "string", "impact": "high|medium|low", "category": "pricing|marketing|operations|hr" }],
  "overallScore": 75,
  "overallSummary": "string"
}`,
  "decisions": `أنت مركز اتخاذ قرارات ذكي لاستوديو تصوير. بناءً على البيانات، قم بإنشاء قرارات وإجراءات تلقائية. أرجع JSON فقط:
{
  "decisions": [{ "id": "string", "title": "string", "description": "string", "action": "alert|reduce_permissions|suspend|price_change|restock|reactivate", "targetType": "employee|customer|inventory|pricing", "targetName": "string", "severity": "info|warning|critical", "autoExecute": false, "reasoning": "string" }],
  "employeeScores": [{ "name": "string", "performanceScore": 0, "attendanceScore": 0, "overallScore": 0, "recommendation": "promote|maintain|warn|review" }],
  "strategicActions": [{ "title": "string", "category": "string", "expectedImpact": "string", "priority": "high|medium|low" }]
}`,
  "monitoring": `أنت نظام مراقبة أمني ذكي لاستوديو تصوير. حلل الأنشطة واكتشف أي سلوك مشبوه. أرجع JSON فقط:
{
  "riskLevel": "low|medium|high|critical",
  "activities": [{ "type": "string", "user": "string", "action": "string", "riskScore": 0, "timestamp": "string", "details": "string" }],
  "anomalies": [{ "type": "string", "description": "string", "severity": "low|medium|high", "suggestedAction": "string" }],
  "systemHealth": { "score": 75, "uptime": "string", "activeUsers": 0, "summary": "string" }
}`
};

interface ExternalModel {
  provider: string;
  apiKey: string;
  model?: string;
  endpoint?: string;
}

async function callLovableAI(systemPrompt: string, userContent: string): Promise<{ ok: boolean; data?: any; status?: number }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return { ok: false, status: 500 };

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }],
    }),
  });

  if (!response.ok) return { ok: false, status: response.status };
  const data = await response.json();
  return { ok: true, data };
}

async function callExternalAI(model: ExternalModel, systemPrompt: string, userContent: string): Promise<{ ok: boolean; data?: any; status?: number }> {
  let endpoint = "";
  let headers: Record<string, string> = { "Content-Type": "application/json" };
  let body: any = {};

  const provider = model.provider?.toLowerCase() || "";

  if (provider === "openai" || provider.includes("openai")) {
    endpoint = model.endpoint || "https://api.openai.com/v1/chat/completions";
    headers["Authorization"] = `Bearer ${model.apiKey}`;
    body = { model: model.model || "gpt-4o-mini", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }] };
  } else if (provider === "google" || provider.includes("gemini")) {
    const m = model.model || "gemini-2.5-flash";
    endpoint = model.endpoint || `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${model.apiKey}`;
    headers = { "Content-Type": "application/json" };
    body = { contents: [{ parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }] };
  } else if (provider === "anthropic" || provider.includes("claude")) {
    endpoint = model.endpoint || "https://api.anthropic.com/v1/messages";
    headers["x-api-key"] = model.apiKey;
    headers["anthropic-version"] = "2023-06-01";
    body = { model: model.model || "claude-sonnet-4-5-20250929", max_tokens: 4096, system: systemPrompt, messages: [{ role: "user", content: userContent }] };
  } else {
    // Generic OpenAI-compatible endpoint
    endpoint = model.endpoint || "https://api.openai.com/v1/chat/completions";
    headers["Authorization"] = `Bearer ${model.apiKey}`;
    body = { model: model.model || "gpt-4o-mini", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }] };
  }

  try {
    const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });
    if (!response.ok) return { ok: false, status: response.status };
    const data = await response.json();

    // Normalize response to OpenAI format
    if (provider === "google" || provider.includes("gemini")) {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return { ok: true, data: { choices: [{ message: { content: text } }] } };
    }
    if (provider === "anthropic" || provider.includes("claude")) {
      const text = data.content?.[0]?.text || "{}";
      return { ok: true, data: { choices: [{ message: { content: text } }] } };
    }
    return { ok: true, data };
  } catch (e) {
    console.error(`External AI (${provider}) error:`, e);
    return { ok: false, status: 500 };
  }
}

function extractJSON(content: string): any {
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];
  jsonStr = jsonStr.trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    return { overallSummary: content, overallScore: 75 };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { businessData, analysisType, externalModels } = await req.json();
    const systemPrompt = systemPrompts[analysisType] || systemPrompts["full-analysis"];
    const userContent = `هذه بيانات الاستوديو الحالية:\n${JSON.stringify(businessData, null, 2)}`;

    // Try Lovable AI first
    let result = await callLovableAI(systemPrompt, userContent);

    // If Lovable AI fails with 402/429, try external models
    if (!result.ok && (result.status === 402 || result.status === 429) && externalModels?.length > 0) {
      console.log(`Lovable AI returned ${result.status}, trying external models...`);
      for (const model of externalModels) {
        if (!model.apiKey) continue;
        result = await callExternalAI(model, systemPrompt, userContent);
        if (result.ok) {
          console.log(`External AI (${model.provider}) succeeded`);
          break;
        }
      }
    }

    if (!result.ok) {
      const status = result.status || 500;
      const errorMessages: Record<number, string> = {
        402: "رصيد الذكاء الاصطناعي غير كافٍ. أضف رصيد من الإعدادات أو أضف نموذج AI خارجي من إعدادات التطبيق",
        429: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً",
      };
      return new Response(JSON.stringify({ error: errorMessages[status] || "خطأ في خدمة الذكاء الاصطناعي" }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = result.data?.choices?.[0]?.message?.content || "{}";
    const parsed = extractJSON(content);

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
