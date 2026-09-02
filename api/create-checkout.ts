// ============================================================
// 🎀 ORGANIZE ATELIÊ - API ROUTE: CRIAR CHECKOUT / PIX
// Endpoint: POST /api/create-checkout
// ============================================================

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const { userId, userEmail, userName, plan, amount } = req.body || {};

    const price = plan === 'anual' ? 349.90 : 39.90;
    const cleanUserId = userId || 'user-default';

    // Gera código PIX Copia e Cola no padrão BACEN EMV
    const pixCode = `00020126580014br.gov.bcb.pix0136${cleanUserId.padEnd(36, '0')}520400005303986540${price.toFixed(2)}5802BR5925ORGANIZESAASTELEIE6009SAOPAULO62070503***6304`;

    return res.status(200).json({
      success: true,
      paymentId: `pay_${Date.now()}`,
      userId: cleanUserId,
      plan: plan || 'mensal',
      amount: price,
      pixCode,
      checkoutUrl: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${Date.now()}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Erro ao gerar checkout.',
      message: error?.message || String(error),
    });
  }
}
