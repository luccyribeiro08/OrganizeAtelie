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

  // Mercado Pago ou desenvolvedor enviando GET para testar se a rota está online
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      message: 'Webhook Organize Ateliê ativo e pronto para receber notificações do Mercado Pago.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(200).json({
      status: 'ignored',
      message: 'Método aceito apenas para ping. Use POST para eventos de pagamento.',
    });
  }

  try {
    // 1. PARSING SEGURO DO CORPO E QUERY
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    const query = req.query || {};

    console.log('[Webhook MP] Notificação recebida:', JSON.stringify({ body, query }));

    // 2. DETECÇÃO DE TESTE DO PAINEL DO MERCADO PAGO
    // O Mercado Pago envia id "123456", entity "preapproval", action "updated" ao clicar no botão "Testar"
    const paymentId = String(body.data?.id || body.id || query.id || query['data.id'] || '').trim();
    const entityType = String(body.entity || body.type || query.type || query.topic || '').toLowerCase();

    if (paymentId === '123456' || body.action === 'test' || paymentId.startsWith('test_')) {
      console.log('[Webhook MP] ✅ Notificação de TESTE do Mercado Pago validada com sucesso.');
      return res.status(200).json({
        received: true,
        status: 'test_success',
        message: 'Teste do Mercado Pago recebido e validado com sucesso pelo Organize Ateliê!',
      });
    }

    // 3. VARIÁVEIS DE AMBIENTE
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      '';
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';
    const mpAccessToken =
      process.env.MERCADO_PAGO_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN ||
      '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.warn('[Webhook MP] ⚠️ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas na Vercel.');
      // Retornamos 200 com aviso para não fazer o Mercado Pago reenviar indefinidamente
      return res.status(200).json({
        received: true,
        warning: 'Variáveis de ambiente do Supabase não configuradas.',
      });
    }

    // 4. INSTANCIAÇÃO ADMINISTRATIVA SUPABASE
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    let status = '';
    let userId = '';
    let plan = 'mensal';

    // 5. CONSULTA NA API DO MERCADO PAGO (Se tiver paymentId e token configurado)
    if (paymentId && mpAccessToken && paymentId !== '123456') {
      try {
        const isPreapproval = entityType.includes('preapproval') || entityType.includes('subscription');
        const mpUrl = isPreapproval
          ? `https://api.mercadopago.com/preapproval/${paymentId}`
          : `https://api.mercadopago.com/v1/payments/${paymentId}`;

        console.log(`[Webhook MP] Consultando ${isPreapproval ? 'assinatura' : 'pagamento'} ${paymentId} no Mercado Pago...`);
        const mpRes = await fetch(mpUrl, {
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
            payer_email: mpData.payer?.email || mpData.payer_email,
          });

          status = (mpData.status || '').toLowerCase();
          userId = mpData.external_reference || '';
          plan = mpData.metadata?.plan || (mpData.auto_recurring?.frequency_type === 'years' ? 'anual' : 'mensal');

          // Fallback: se external_reference não estiver preenchido, busca pelo e-mail
          const payerEmail = mpData.payer?.email || mpData.payer_email;
          if (!userId && payerEmail) {
            const { data: profileByEmail } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .ilike('email', payerEmail.trim())
              .maybeSingle();

            if (profileByEmail?.id) {
              userId = profileByEmail.id;
              console.log(`[Webhook MP] Usuário localizado pelo e-mail do pagador: ${userId}`);
            }
          }
        } else {
          console.warn(`[Webhook MP] API Mercado Pago retornou status ${mpRes.status} para o ID ${paymentId}`);
        }
      } catch (mpFetchErr) {
        console.error('[Webhook MP] Erro ao consultar API Mercado Pago:', mpFetchErr);
      }
    }

    // 6. EXTRAÇÃO DIRETA DO CORPO DA REQUISIÇÃO (Fallback)
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

    // 7. SE O PAGAMENTO NÃO FOI APROVADO / AUTORIZADO (ex: pending, in_process, rejected)
    if (status !== 'approved' && status !== 'paid' && status !== 'authorized' && status !== 'completed') {
      console.log(`[Webhook MP] Status '${status || 'desconhecido/não-aprovado'}'. Nenhuma alteração no perfil.`);
      return res.status(200).json({
        received: true,
        status: status || 'pending',
        message: 'Notificação recebida com sucesso.',
      });
    }

    if (!userId) {
      const userEmail =
        body.user_email ||
        body.email ||
        body.data?.user_email ||
        body.data?.email ||
        body.data?.payer_email;

      if (userEmail) {
        const { data: profileByEmail } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .ilike('email', String(userEmail).trim())
          .maybeSingle();

        if (profileByEmail?.id) {
          userId = profileByEmail.id;
        }
      }
    }

    // 8. SE APROVADO, MAS NÃO TEMOS O USER_ID
    if (!userId) {
      console.warn('[Webhook MP] ⚠️ Pagamento aprovado, mas user_id / external_reference não foi identificado.');
      return res.status(200).json({
        received: true,
        warning: 'user_id não identificado na notificação.',
      });
    }

    // 9. CÁLCULO DA DATA DE EXPIRAÇÃO (+30 dias mensal, +90 trimestral ou +365 anual)
    const daysToAdd = plan === 'anual' ? 365 : plan === 'trimestral' ? 90 : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);

    // 10. ATUALIZAÇÃO NO SUPABASE NA TABELA PROFILES (por ID ou por e-mail)
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${userId},email.ilike.${userId}`)
      .select('id, name, email, subscription_status, subscription_plan, subscription_expires_at')
      .maybeSingle();

    if (updateError) {
      console.error('[Webhook MP] ❌ Erro ao atualizar perfil no Supabase:', updateError);
      return res.status(200).json({
        received: true,
        error: 'Falha ao atualizar perfil no banco de dados.',
        details: updateError.message,
      });
    }

    console.log(`[Webhook MP] 🎉 SUCESSO! Assinatura ativada para usuário ${userId}:`, updatedProfile);

    // 11. RETORNO DE SUCESSO 200 OK
    return res.status(200).json({
      success: true,
      message: 'Assinatura ativada com sucesso no Organize Ateliê!',
      userId,
      plan,
      subscription_status: 'active',
      subscription_expires_at: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[Webhook MP] Exceção capturada:', error);
    // Sempre responder 200 para evitar que o Mercado Pago desative o webhook
    return res.status(200).json({
      received: true,
      error: 'Exceção interna ao processar notificação.',
      message: error?.message || String(error),
    });
  }
}
