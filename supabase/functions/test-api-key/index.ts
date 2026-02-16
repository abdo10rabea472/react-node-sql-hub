import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { provider, apiKey, endpoint, model } = await req.json();
    if (!provider || !apiKey) {
      return new Response(JSON.stringify({ success: false, message: "Missing provider or apiKey" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const p = provider.toLowerCase();
    let testEndpoint = "";
    let headers: Record<string, string> = { "Content-Type": "application/json" };
    let body: any = {};
    let method = "POST";

    if (p === "openai" || p.includes("openai")) {
      // Use models list endpoint (GET, lightweight)
      testEndpoint = "https://api.openai.com/v1/models";
      headers["Authorization"] = `Bearer ${apiKey}`;
      method = "GET";
      body = null;
    } else if (p === "google" || p.includes("gemini")) {
      const m = model || "gemini-2.5-flash";
      testEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      body = { contents: [{ parts: [{ text: "Say hi" }] }], generationConfig: { maxOutputTokens: 5 } };
    } else if (p === "anthropic" || p.includes("claude")) {
      testEndpoint = endpoint || "https://api.anthropic.com/v1/messages";
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
      body = { model: model || "claude-sonnet-4-5-20250929", max_tokens: 5, messages: [{ role: "user", content: "Hi" }] };
    } else {
      // Custom / OpenAI-compatible
      testEndpoint = endpoint || "https://api.openai.com/v1/models";
      headers["Authorization"] = `Bearer ${apiKey}`;
      if (!endpoint) { method = "GET"; body = null; }
      else { body = { model: model || "gpt-4o-mini", messages: [{ role: "user", content: "Hi" }], max_tokens: 5 }; }
    }

    console.log(`Testing API key for provider: ${p}, endpoint: ${testEndpoint}`);

    const response = await fetch(testEndpoint, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (response.ok) {
      return new Response(JSON.stringify({ success: true, message: "API key is valid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const errText = await response.text();
    let errorMsg = "Invalid API key";
    if (response.status === 401 || response.status === 403) {
      errorMsg = "Invalid or expired API key";
    } else if (response.status === 429) {
      errorMsg = "Rate limited - key may be valid but quota exceeded";
    } else if (response.status === 402) {
      errorMsg = "No credits on this API key";
    }
    console.error(`Test failed (${response.status}): ${errText}`);

    return new Response(JSON.stringify({ success: false, message: errorMsg, status: response.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("test-api-key error:", e);
    return new Response(JSON.stringify({ success: false, message: e instanceof Error ? e.message : "Connection failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
