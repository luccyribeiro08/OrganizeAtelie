// ============================================================
// 🎀 ORGANIZE ATELIÊ - VERCEL / SERVERLESS API ROUTE: WEBHOOK DE PAGAMENTO
// Endpoint: POST /api/webhooks/payment
// ============================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-signature, x-request-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Mercado Pago pode ocasionalmente enviar GET de validação
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'Webhook endpoint online' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      '';
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      '';
    const mpAccessToken =
      process.env.MERCADO_PAGO_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN ||
      '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[Webhook MP] ⚠️ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.');
      return res.status(500).json({
        error: 'Configuração do servidor incompleta. Verifique as variáveis de ambiente na Vercel.',
      });
    }

    // 🛡️ INSTANCIAÇÃO ADMINISTRATIVA (Bypass de RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const body = req.body || {};
    const query = req.query || {};
    console.log('[Webhook MP] Notificação recebida:', JSON.stringify({ body, query }));

    let status = '';
    let userId = '';
    let plan = 'mensal';
    let paymentId = body.data?.id || body.id || query.id || query['data.id'];

    // 1. SE RECEBER ID DO MERCADO PAGO E TIVER TOKEN DE ACESSO CONFIGURADO:
    // Consulta os dados completos da transação diretamente na API do Mercado Pago
    if (paymentId && mpAccessToken) {
      try {
        console.log(`[Webhook MP] Consultando pagamento ${paymentId} na API do Mercado Pago...`);
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${mpAccessToken}`,
          },
        });

        if (mpRes.ok) {
          const mpData = await mpRes.json();
          console.log('[Webhook MP] Dados obtidos do Mercado Pago:', {
            id: mpData.id,
            status: mpData.status,
            external_reference: mpData.external_reference,
            payer_email: mpData.payer?.email,
          });

          status = (mpData.status || '').toLowerCase();
          userId = mpData.external_reference || '';
          plan = mpData.metadata?.plan || 'mensal';

          // Se external_reference não estiver preenchido, tenta buscar o perfil pelo email do pagador
          if (!userId && mpData.payer?.email) {
            const { data: profileByEmail } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .ilike('email', mpData.payer.email.trim())
              .maybeSingle();

            if (profileByEmail?.id) {
              userId = profileByEmail.id;
              console.log(`[Webhook MP] Usuário localizado pelo e-mail do pagador: ${userId}`);
            }
          }
        }
      } catch (mpFetchErr) {
        console.error('[Webhook MP] Erro ao consultar API Mercado Pago:', mpFetchErr);
      }
    }

    // 2. EXTRAÇÃO DIRETA DO CORPO DA REQUISIÇÃO (Caso não use API do MP ou venha payload direto)
    if (!status) {
      status = (
        body.status ||
        body.data?.status ||
        (body.action === 'payment.created' ? 'approved' : '') ||
        (body.event === 'payment.approved' ? 'approved' : '') ||
        ''
      ).toLowerCase();
    }

    if (!userId) {
      userId =
        body.user_id ||
        body.userId ||
        body.data?.user_id ||
        body.data?.userId ||
        body.data?.metadata?.user_id ||
        body.data?.metadata?.userId ||
        body.external_reference ||
        '';
    }

    if (!plan || plan === 'mensal') {
      plan =
        body.plan ||
        body.data?.plan ||
        body.data?.metadata?.plan ||
        'mensal';
    }

    // 3. SE O PAGAMENTO AINDA NÃO FOI APROVADO (ex: pendente, em processamento, rejeitado)
    if (status !== 'approved' && status !== 'paid' && status !== 'completed') {
      console.log(`[Webhook MP] Status '${status || 'desconhecido'}'. Nenhuma liberação executada.`);
      return res.status(200).json({
        received: true,
        status: status || 'pending',
        message: 'Notificação recebida com sucesso.',
      });
    }

    // 4. SE APROVADO, MAS NÃO TEMOS O USER_ID
    if (!userId) {
      console.warn('[Webhook MP] ⚠️ Pagamento aprovado, mas user_id / external_reference não foi identificado.');
      return res.status(200).json({
        received: true,
        warning: 'user_id não identificado na notificação.',
      });
    }

    // 5. 🗓️ CÁLCULO DA DATA DE EXPIRAÇÃO (+30 dias ou +365 dias para anual)
    const daysToAdd = plan === 'anual' ? 365 : plan === 'trimestral' ? 90 : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);

    // 6. 🔄 ATUALIZAÇÃO NO SUPABASE NA TABELA PROFILES
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, name, email, subscription_status, subscription_plan, subscription_expires_at')
      .maybeSingle();

    if (updateError) {
      console.error('[Webhook MP] ❌ Erro ao atualizar perfil no Supabase:', updateError);
      return res.status(500).json({
        error: 'Falha ao atualizar registro do usuário no banco.',
        details: updateError.message,
      });
    }

    console.log(`[Webhook MP] 🎉 SUCESSO! Assinatura liberada para usuário ${userId}:`, updatedProfile);

    // 7. Retorna HTTP 200 OK para o Mercado Pago
    return res.status(200).json({
      success: true,
      message: 'Assinatura ativada com sucesso no Organize Ateliê!',
      userId,
      plan,
      subscription_status: 'active',
      subscription_expires_at: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[Webhook MP] Exceção crítica:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar webhook.',
      message: error?.message || String(error),
    });
  }
}
