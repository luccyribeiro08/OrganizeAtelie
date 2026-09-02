// ============================================================
// 🎀 ORGANIZE ATELIÊ - SUPABASE EDGE FUNCTION: WEBHOOK DE PAGAMENTO
// Endpoint: POST /functions/v1/payment-webhook
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

interface WebhookPaymentPayload {
  event?: string;
  action?: string;
  type?: string;
  data?: {
    id?: string | number;
    status?: string;
    user_id?: string;
    userId?: string;
    plan?: string;
    payer_email?: string;
    metadata?: {
      user_id?: string;
      userId?: string;
      plan?: string;
    };
  };
  // Campos diretos comuns (Stripe / Mercado Pago / Asaas / Genérico)
  status?: string;
  user_id?: string;
  userId?: string;
  plan?: string;
  external_reference?: string;
}

serve(async (req: Request) => {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };

  // Trata requisição OPTIONS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido. Use POST.' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 🛡️ INSTANCIAÇÃO ADMINISTRATIVA COM SERVICE_ROLE_KEY PARA BURLAR RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const body: WebhookPaymentPayload = await req.json().catch(() => ({}));
    console.log('Webhook payload recebido:', JSON.stringify(body));

    // Extração do status do pagamento
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

    // Extração do plano
    const plan =
      body.plan ||
      body.data?.plan ||
      body.data?.metadata?.plan ||
      'mensal';

    // Se o pagamento NÃO foi aprovado, apenas registra e retorna 200 para o gateway
    if (status !== 'approved' && status !== 'paid' && status !== 'completed') {
      console.log(`Pagamento com status '${status}', nenhuma liberação necessária.`);
      return new Response(
        JSON.stringify({
          received: true,
          status,
          message: 'Status não é aprovado, perfil não alterado.',
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Se aprovado, valida se temos o user_id
    if (!userId) {
      console.warn('Pagamento aprovado, mas user_id não foi encontrado no payload.');
      return new Response(
        JSON.stringify({
          error: 'user_id não identificado no payload de pagamento.',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 🗓️ CÁLCULO DA EXPIRAÇÃO: NOW() + 30 dias (ou 365 para anual)
    const daysToAdd = plan === 'anual' ? 365 : plan === 'trimestral' ? 90 : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);

    // 🔄 ATUALIZAÇÃO NO BANCO DE DADOS (tabela profiles)
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
      console.error('Erro ao atualizar perfil no Supabase:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Falha ao atualizar assinatura do usuário.',
          details: updateError.message,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`✅ Assinatura ativada com sucesso para o usuário ${userId}:`, updatedProfile);

    // Retorna HTTP 200 OK para o gateway
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Assinatura ativada com sucesso!',
        userId,
        plan,
        subscription_status: 'active',
        subscription_expires_at: expiresAt.toISOString(),
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Exceção no processamento do webhook:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro interno no processamento do webhook.',
        message: error?.message || String(error),
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
