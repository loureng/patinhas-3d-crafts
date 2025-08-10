// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MPItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

interface PreferenceBody {
  items: MPItem[];
  back_urls?: { success: string; failure: string; pending: string };
  auto_return?: string;
  external_reference?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!token) {
      return new Response(JSON.stringify({ error: "Mercado Pago token not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: PreferenceBody = await req.json();
    if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid items" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const items = body.items.map((i) => ({
      title: i.title,
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
      currency_id: i.currency_id || "BRL",
    }));

  // Compute notification URL for webhook
  const supaUrl = Deno.env.get("SUPABASE_URL") ?? "https://znvctabjuloliuzxzwya.supabase.co";
  const functionsBase = supaUrl.replace(".supabase.co", ".functions.supabase.co");
  const notification_url = `${functionsBase}/mp-webhook`;

  const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
        back_urls: body.back_urls,
        auto_return: body.auto_return ?? "approved",
    external_reference: body.external_reference,
    notification_url,
      }),
    });

    const mpJson = await mpRes.json();
    if (!mpRes.ok) {
      console.error("Mercado Pago error:", mpJson);
      return new Response(
        JSON.stringify({ error: "Failed to create preference", details: mpJson }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    return new Response(JSON.stringify(mpJson), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("create-payment-preference error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});