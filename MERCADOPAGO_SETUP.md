# Configuração do Mercado Pago - Checkout Pro
**Guia completo para configurar o gateway de pagamento**

## 📋 Credenciais Obtidas

Você já possui as credenciais necessárias:
- **Public Key**: `APP_USR-611b7cc6-fba0-4d84-9953-7462c48aa16e` 
- **Access Token**: `APP_USR-2014421121157734-062012-6d8cbc1de879fca0b0323bd796eee309-227979218`
- **Client ID**: `2014421121157734`
- **Client Secret**: `JdNAvLoiNaryEYmkWbcE7MLnHo1z7whR`

## ⚙️ Configuração no Supabase

### 1. Configurar Variáveis de Ambiente das Edge Functions

Acesse o dashboard do Supabase e configure as seguintes variáveis de ambiente para as Edge Functions:

**Dashboard Supabase → Settings → Edge Functions → Environment Variables**

| Nome da Variável | Valor |
|------------------|-------|
| `MERCADOPAGO_ACCESS_TOKEN` | `APP_USR-2014421121157734-062012-6d8cbc1de879fca0b0323bd796eee309-227979218` |

### 2. Frontend já Configurado

O arquivo `.env.local` já foi criado com:
```env
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-611b7cc6-fba0-4d84-9953-7462c48aa16e
```

## 🏗️ Arquitetura Implementada

### Edge Functions Ativas
1. **create-payment-preference**: Cria preferências de pagamento
2. **mp-webhook**: Processa notificações do Mercado Pago
3. **send-email**: Envia confirmações por email

### Fluxo de Pagamento
1. Cliente finaliza compra → `handleMercadoPago()`
2. Chama `create-payment-preference` → Cria preferência no MP
3. Redireciona para Checkout Pro
4. Cliente paga → MP envia webhook
5. `mp-webhook` atualiza status do pedido
6. Email de confirmação enviado

## 🧪 Como Testar

### Ambiente de Desenvolvimento
O sistema está configurado para funcionar em modo desenvolvimento com as credenciais fornecidas.

### URLs de Teste
- **Sucesso**: `/payment/success`
- **Falha**: `/payment/failure` 
- **Pendente**: `/payment/pending`

## 🚀 Deploy em Produção

### Variáveis Obrigatórias no Supabase:
```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-2014421121157734-062012-6d8cbc1de879fca0b0323bd796eee309-227979218
SUPABASE_URL=sua_url_do_projeto
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### URLs de Callback
Configure no painel do Mercado Pago:
- **Success URL**: `https://seudominio.com/payment/success`
- **Failure URL**: `https://seudominio.com/payment/failure`
- **Pending URL**: `https://seudominio.com/payment/pending`
- **Webhook URL**: `https://[project].functions.supabase.co/mp-webhook`

## ✅ Status da Implementação

- ✅ **Checkout Pro** - Implementado
- ✅ **Webhook Handler** - Implementado  
- ✅ **Email Notifications** - Implementado
- ✅ **Order Management** - Implementado
- ✅ **Error Handling** - Implementado
- ✅ **Frontend Integration** - Implementado

## 🔧 Troubleshooting

### Erros Comuns
1. **"Mercado Pago token not configured"**
   - Verifique se `MERCADOPAGO_ACCESS_TOKEN` está configurado no Supabase

2. **"Failed to create preference"**
   - Valide se o access token está correto
   - Verifique se os dados do carrinho são válidos

3. **Webhook não funciona**
   - Confirme se a URL do webhook está acessível
   - Verifique logs das Edge Functions no Supabase