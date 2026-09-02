// ============================================================
// 🎀 ORGANIZE ATELIÊ - VERCEL / SERVERLESS API ROUTE: WEBHOOK DE PAGAMENTO
// Endpoint: POST /api/webhooks/payment
// ============================================================

import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // CORS Headers
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
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      '';
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas no servidor.');
      return res.status(500).json({
        error: 'Configuração do servidor incompleta (chaves de ambiente ausentes).',
      });
    }

    // 🛡️ BURLA O RLS COM A SERVICE_ROLE_KEY PARA OPERAÇÃO ADMINISTRATIVA
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const body = req.body || {};
    console.log('[Webhook Pagamento] Payload recebido:', JSON.stringify(body));

    // Extração do status
    const status = (
      body.status ||
      body.data?.status ||
      (body.action === 'payment.created' ? 'approved' : '') ||
      (body.event === 'payment.approved' ? 'approved' : '') ||
      ''
    ).toLowerCase();

    // Extração do user_id atrelado ao pagamento
    const userId =
      body.user_id ||
      body.userId ||
      body.data?.user_id ||
      body.data?.userId ||
      body.data?.metadata?.user_id ||
      body.data?.metadata?.userId ||
      body.external_reference;

    // Extração do plano (mensal, trimestral, anual)
    const plan =
      body.plan ||
      body.data?.plan ||
      body.data?.metadata?.plan ||
      'mensal';

    // Se o pagamento NÃO foi aprovado (ex: pendente, rejeitado), responde 200 OK sem alterar perfil
    if (status !== 'approved' && status !== 'paid' && status !== 'completed') {
      console.log(`[Webhook Pagamento] Status '${status}' não requer liberação.`);
      return res.status(200).json({
        received: true,
        status,
        message: 'Status não é aprovado, perfil inalterado.',
      });
    }

    // Se aprovado, valida existência do user_id
    if (!userId) {
      console.warn('[Webhook Pagamento] user_id não informado no payload.');
      return res.status(400).json({
        error: 'user_id não identificado no payload do gateway.',
      });
    }

    // 🗓️ CÁLCULO DA EXPIRAÇÃO: NOW() + 30 dias (ou 365 para anual)
    const daysToAdd = plan === 'anual' ? 365 : plan === 'trimestral' ? 90 : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);

    // 🔄 ATUALIZAÇÃO NO SUPABASE NA TABELA PROFILES
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
      console.error('[Webhook Pagamento] Erro no update do Supabase:', updateError);
      return res.status(500).json({
        error: 'Falha ao atualizar registro do usuário.',
        details: updateError.message,
      });
    }

    console.log(`[Webhook Pagamento] ✅ Assinatura ativada para ${userId}:`, updatedProfile);

    // Retorna HTTP 200 OK para o gateway
    return res.status(200).json({
      success: true,
      message: 'Assinatura ativada com sucesso no Organize Ateliê!',
      userId,
      plan,
      subscription_status: 'active',
      subscription_expires_at: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[Webhook Pagamento] Exceção:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar webhook de pagamento.',
      message: error?.message || String(error),
    });
  }
}
