import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-2014421121157734-062012-6d8cbc1de879fca0b0323bd796eee309-227979218'
});

export async function createPaymentPreference(orderData: any) {
  const preference = new Preference(client);
  
  const response = await preference.create({
    body: {
      items: orderData.items.map((item: any) => ({
        title: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: 'BRL'
      })),
      payer: {
        email: orderData.userEmail
      },
      back_urls: {
        success: `${window.location.origin}/pedido-confirmado`,
        failure: `${window.location.origin}/pagamento-falhou`,
        pending: `${window.location.origin}/pagamento-pendente`
      },
      auto_return: 'approved',
      external_reference: orderData.orderId
    }
  });
  
  return response;
}
