import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  type: 'order_confirmation' | 'payment_approved' | 'order_shipped' | 'order_delivered';
  data: {
    order_id: string;
    customer_name?: string;
    total_amount?: number;
    order_items?: Array<{
      product_name: string;
      quantity: number;
      price: number;
    }>;
    tracking_code?: string;
    estimated_delivery?: string;
  };
}

const getEmailTemplate = (type: string, data: any) => {
  const baseTemplate = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Jardim das Patinhas</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
        .header p { color: #FFF3E0; margin: 8px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .order-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-items { margin: 20px 0; }
        .item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee; }
        .item:last-child { border-bottom: none; }
        .total { font-size: 18px; font-weight: bold; color: #2196F3; text-align: right; margin-top: 15px; }
        .status-badge { display: inline-block; padding: 8px 16px; background-color: #4CAF50; color: white; border-radius: 20px; font-size: 14px; font-weight: 500; }
        .cta-button { display: inline-block; background-color: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { background-color: #263238; color: white; padding: 30px; text-align: center; }
        .footer a { color: #4CAF50; text-decoration: none; }
        .tracking-box { background-color: #E3F2FD; border: 1px solid #2196F3; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐾 Jardim das Patinhas</h1>
          <p>Produtos personalizados para pets, casa e jardim</p>
        </div>
        <div class="content">
  `;

  const footerTemplate = `
        </div>
        <div class="footer">
          <p><strong>Jardim das Patinhas</strong></p>
          <p>Produtos únicos e personalizados para seus pets</p>
          <p>
            <a href="mailto:contato@jardimdaspatinhas.com">contato@jardimdaspatinhas.com</a> |
            <a href="https://api.whatsapp.com/send?phone=5511999999999">WhatsApp</a>
          </p>
          <p style="font-size: 12px; color: #90A4AE; margin-top: 20px;">
            Este é um email automático, por favor não responda.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  switch (type) {
    case 'order_confirmation':
      return baseTemplate + `
        <h2 style="color: #2196F3; margin-bottom: 20px;">Pedido Confirmado! 🎉</h2>
        <p>Olá ${data.customer_name || 'Cliente'},</p>
        <p>Recebemos seu pedido e ele já está sendo processado. Abaixo estão os detalhes:</p>
        
        <div class="order-info">
          <h3 style="margin-top: 0; color: #333;">Pedido #${data.order_id.slice(0, 8)}</h3>
          <div class="order-items">
            ${data.order_items?.map((item: any) => `
              <div class="item">
                <div>
                  <strong>${item.product_name}</strong><br>
                  <small>Quantidade: ${item.quantity}</small>
                </div>
                <div>R$ ${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            `).join('') || ''}
          </div>
          <div class="total">Total: R$ ${data.total_amount?.toFixed(2) || '0.00'}</div>
        </div>

        <p><span class="status-badge">Pedido Confirmado</span></p>
        
        <p>Começaremos a preparar seu pedido em até 1 dia útil. Você receberá atualizações por email conforme o status for alterado.</p>
        
        <a href="${Deno.env.get('SITE_URL') || 'https://jardimdaspatinhas.com'}/account/orders" class="cta-button">
          Acompanhar Pedido
        </a>
      ` + footerTemplate;

    case 'payment_approved':
      return baseTemplate + `
        <h2 style="color: #4CAF50; margin-bottom: 20px;">Pagamento Aprovado! ✅</h2>
        <p>Olá ${data.customer_name || 'Cliente'},</p>
        <p>Ótimas notícias! Seu pagamento foi aprovado e seu pedido já está sendo preparado.</p>
        
        <div class="order-info">
          <h3 style="margin-top: 0; color: #333;">Pedido #${data.order_id.slice(0, 8)}</h3>
          <p><strong>Valor pago:</strong> R$ ${data.total_amount?.toFixed(2) || '0.00'}</p>
          <p><span class="status-badge" style="background-color: #4CAF50;">Pagamento Aprovado</span></p>
        </div>
        
        <p>Agora vamos começar a produzir seus itens personalizados com todo carinho! Você receberá uma notificação quando o pedido for enviado.</p>
        
        <a href="${Deno.env.get('SITE_URL') || 'https://jardimdaspatinhas.com'}/account/orders" class="cta-button">
          Acompanhar Pedido
        </a>
      ` + footerTemplate;

    case 'order_shipped':
      return baseTemplate + `
        <h2 style="color: #2196F3; margin-bottom: 20px;">Pedido Enviado! 📦</h2>
        <p>Olá ${data.customer_name || 'Cliente'},</p>
        <p>Seu pedido foi enviado e está a caminho! Confira os detalhes do envio:</p>
        
        <div class="order-info">
          <h3 style="margin-top: 0; color: #333;">Pedido #${data.order_id.slice(0, 8)}</h3>
          <p><span class="status-badge" style="background-color: #2196F3;">Enviado</span></p>
        </div>

        ${data.tracking_code ? `
          <div class="tracking-box">
            <h3 style="margin-top: 0; color: #1976D2;">Código de Rastreamento</h3>
            <p style="font-size: 18px; font-weight: bold; margin: 10px 0;">${data.tracking_code}</p>
            <a href="https://www.correios.com.br/precisa-de-ajuda/rastear-objeto" target="_blank" style="color: #1976D2;">
              Rastrear no site dos Correios
            </a>
          </div>
        ` : ''}
        
        <p><strong>Previsão de entrega:</strong> ${data.estimated_delivery || 'Em breve'}</p>
        
        <a href="${Deno.env.get('SITE_URL') || 'https://jardimdaspatinhas.com'}/account/orders" class="cta-button">
          Acompanhar Pedido
        </a>
      ` + footerTemplate;

    case 'order_delivered':
      return baseTemplate + `
        <h2 style="color: #4CAF50; margin-bottom: 20px;">Pedido Entregue! 🎁</h2>
        <p>Olá ${data.customer_name || 'Cliente'},</p>
        <p>Seu pedido foi entregue com sucesso! Esperamos que você adore seus novos produtos personalizados.</p>
        
        <div class="order-info">
          <h3 style="margin-top: 0; color: #333;">Pedido #${data.order_id.slice(0, 8)}</h3>
          <p><span class="status-badge" style="background-color: #4CAF50;">Entregue</span></p>
        </div>
        
        <p>Se você ficou satisfeito com sua compra, que tal deixar uma avaliação? Sua opinião é muito importante para nós!</p>
        
        <a href="${Deno.env.get('SITE_URL') || 'https://jardimdaspatinhas.com'}/account/orders" class="cta-button">
          Avaliar Pedido
        </a>
        
        <p style="margin-top: 30px; padding: 20px; background-color: #FFF3E0; border-radius: 8px;">
          <strong>💡 Dica:</strong> Que tal personalizar mais produtos para seus pets? 
          Temos sempre novidades no nosso catálogo!
        </p>
      ` + footerTemplate;

    default:
      return baseTemplate + `
        <h2>Atualização do Pedido</h2>
        <p>Olá! Há uma atualização sobre seu pedido #${data.order_id.slice(0, 8)}.</p>
      ` + footerTemplate;
  }
};

const getEmailSubject = (type: string, orderId: string) => {
  switch (type) {
    case 'order_confirmation':
      return `🎉 Pedido confirmado #${orderId.slice(0, 8)} - Jardim das Patinhas`;
    case 'payment_approved':
      return `✅ Pagamento aprovado #${orderId.slice(0, 8)} - Jardim das Patinhas`;
    case 'order_shipped':
      return `📦 Pedido enviado #${orderId.slice(0, 8)} - Jardim das Patinhas`;
    case 'order_delivered':
      return `🎁 Pedido entregue #${orderId.slice(0, 8)} - Jardim das Patinhas`;
    default:
      return `Atualização do pedido #${orderId.slice(0, 8)} - Jardim das Patinhas`;
  }
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = Deno.env.get('STORE_FROM_EMAIL') || 'onboarding@resend.dev';
    
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body: EmailRequest = await req.json();
    
    if (!body.to || !body.type || !body.data) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, type, data" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const htmlContent = getEmailTemplate(body.type, body.data);
    const subject = getEmailSubject(body.type, body.data.order_id);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Jardim das Patinhas <${FROM_EMAIL}>`,
        to: [body.to],
        subject: subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Resend API error:', emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailResult.id,
        message: "Email sent successfully"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("send-email error:", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});