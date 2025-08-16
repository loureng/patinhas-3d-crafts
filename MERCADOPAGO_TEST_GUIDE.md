# Guia de Teste - Mercado Pago Checkout Pro
**Como validar o funcionamento completo da integração**

## 🧪 Pré-requisitos para Teste

### 1. Verificar Configurações
- ✅ `.env.local` criado com `VITE_MERCADOPAGO_PUBLIC_KEY`
- ✅ Supabase com `MERCADOPAGO_ACCESS_TOKEN` configurado
- ✅ Servidor de desenvolvimento rodando (`npm run dev`)

### 2. Dados de Teste do Mercado Pago

**Cartões de Teste** (use estes números):
```
✅ Aprovado: 4170 0688 1010 8020
❌ Rejeitado: 4013 5406 8274 6260  
⏳ Pendente: 4009 1895 5557 9995
```

**CVV**: Qualquer 3 dígitos  
**Vencimento**: Qualquer data futura  
**Nome**: Qualquer nome

## 📋 Checklist de Teste Completo

### Fase 1: Preparação do Ambiente
- [ ] 1.1. Executar `npm run dev`
- [ ] 1.2. Acessar `http://localhost:5173`
- [ ] 1.3. Verificar se não há erros no console
- [ ] 1.4. Confirmar carregamento da página inicial

### Fase 2: Navegação e Carrinho
- [ ] 2.1. Adicionar produtos ao carrinho
- [ ] 2.2. Acessar página `/cart`
- [ ] 2.3. Clicar em "Finalizar Compra"
- [ ] 2.4. Navegar para `/checkout`

### Fase 3: Processo de Checkout
- [ ] 3.1. Preencher dados de entrega
- [ ] 3.2. Selecionar opção de frete
- [ ] 3.3. Clicar em "Pagar com Mercado Pago"
- [ ] 3.4. Verificar toast de "Redirecionando..."

### Fase 4: Mercado Pago (Sandbox)
- [ ] 4.1. Confirmar redirecionamento para página MP
- [ ] 4.2. Preencher com cartão de APROVADO
- [ ] 4.3. Completar pagamento
- [ ] 4.4. Retornar para aplicação

### Fase 5: Verificação de Resultados
- [ ] 5.1. Chegar na página `/payment/success`
- [ ] 5.2. Verificar atualização do status do pedido
- [ ] 5.3. Confirmar email de confirmação (se configurado)

## 🔧 Script de Teste Rápido

### Teste Via Console do Navegador
Abra DevTools (F12) e execute:

```javascript
// Teste de criação de preferência MP
async function testMercadoPago() {
  const testItems = [{
    title: "Produto Teste",
    quantity: 1, 
    unit_price: 10.50
  }];
  
  try {
    const response = await fetch('/supabase/functions/create-payment-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        items: testItems,
        external_reference: 'test-' + Date.now()
      })
    });
    
    const result = await response.json();
    console.log('✅ MP Response:', result);
    
    if (result.init_point) {
      console.log('🚀 Redirect URL:', result.init_point);
      return true;
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    return false;
  }
}

// Executar teste
testMercadoPago();
```

## 🕵️ Monitoramento e Debug

### Logs para Acompanhar

1. **Console do Navegador**: Erros de frontend
2. **Network Tab**: Requisições para Edge Functions  
3. **Supabase Logs**: 
   - Functions → Logs → Edge Functions
   - Filtrar por `create-payment-preference` e `mp-webhook`

### Webhooks de Teste

Para testar webhooks localmente, use ngrok:
```bash
# Terminal 1: Subir aplicação
npm run dev

# Terminal 2: Expor webhook 
npx ngrok http 54321

# Configurar URL no MP:
# https://[random].ngrok.io/functions/v1/mp-webhook
```

## ⚠️ Problemas Comuns e Soluções

### Erro: "Mercado Pago token not configured"
**Solução**: Verificar se `MERCADOPAGO_ACCESS_TOKEN` está no Supabase
```bash
# Verificar via Supabase CLI
supabase secrets list
```

### Erro: "Failed to create preference" 
**Possíveis causas**:
- Access token inválido
- Formato de dados incorreto
- Problemas de rede

**Debug**:
```javascript
// Verificar resposta detalhada
fetch('/supabase/functions/create-payment-preference', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [{ title: "Test", quantity: 1, unit_price: 1 }]
  })
}).then(r => r.json()).then(console.log);
```

### Redirecionamento não funciona
**Verificar**:
- URLs de callback configuradas
- CORS habilitado
- Popup blockers desabilitados

## 📊 Métricas de Sucesso

### ✅ Teste APROVADO se:
- [x] Carrinho → Checkout sem erros
- [x] Redirecionamento para MP funciona  
- [x] Pagamento processado com sucesso
- [x] Retorno para `/payment/success`
- [x] Status do pedido atualizado no banco
- [x] Webhook recebido e processado

### ❌ Investigar se:
- Console mostra erros JavaScript
- Network requests falham (status 4xx/5xx)
- Redirecionamento não acontece
- Status do pedido não muda

## 📞 Suporte

Em caso de problemas persistentes:
1. Verificar logs do Supabase
2. Testar credenciais no painel do MP
3. Validar configuração de webhooks
4. Consultar documentação oficial do MP