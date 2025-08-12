/* eslint-disable */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Basic webhook to handle Mercado Pago notifications
// NOTE: For production, validate signatures if configured. Here we will fetch the payment and update order status.

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || url.searchParams.get("topic");
    const id = url.searchParams.get("id") || url.searchParams.get("data.id");

    if (!type || !id) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const supaUrl = Deno.env.get("SUPABASE_URL");
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!mpToken || !supaUrl || !supaKey) {
      console.error("Missing env: MP token or Supabase creds");
      return new Response("Missing env", { status: 500, headers: corsHeaders });
    }

    // Fetch payment info from MP
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });
    const payment = await paymentRes.json();

    // Extract reference (we pass order.id or user.id, prefer order.id)
    const external_reference: string | undefined = payment?.external_reference;
    const status: string = payment?.status || ""; // approved, rejected, pending

    if (external_reference) {
      // Update order status in DB
      const res = await fetch(`${supaUrl}/rest/v1/orders?id=eq.${external_reference}`, {
        method: "PATCH",
        headers: {
          apikey: supaKey,
          Authorization: `Bearer ${supaKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        console.error("Failed to update order status", await res.text());
      }

      // If approved, try sending confirmation email via new email service
      if (status === 'approved') {
        try {
          // Fetch order with user details and items
          const orderRes = await fetch(`${supaUrl}/rest/v1/orders?select=*,profiles(display_name,email)&id=eq.${external_reference}`, {
            headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` },
          });
          const orderArr = await orderRes.json();
          const order = Array.isArray(orderArr) ? orderArr[0] : undefined;

          // Fetch order items with product names
          const itemsRes = await fetch(`${supaUrl}/rest/v1/order_items?select=*,products(name)&order_id=eq.${external_reference}`, {
            headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` },
          });
          const orderItems = await itemsRes.json();

          const customerEmail = order?.profiles?.email || order?.shipping_address?.email;
          const customerName = order?.profiles?.display_name || order?.shipping_address?.name || 'Cliente';
          
          if (customerEmail) {
            // Use the new send-email function
            const emailData = {
              to: customerEmail,
              type: 'payment_approved',
              data: {
                order_id: external_reference,
                customer_name: customerName,
                total_amount: order?.total_amount || 0,
                order_items: orderItems?.map((item: any) => ({
                  product_name: item.products?.name || 'Produto',
                  quantity: item.quantity,
                  price: item.price
                })) || []
              }
            };

            await fetch(`${supaUrl.replace('.supabase.co', '.functions.supabase.co')}/send-email`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supaKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(emailData)
            });
          }
        } catch (mailErr) {
          console.error('Error sending payment confirmation email:', mailErr);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("mp-webhook error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
