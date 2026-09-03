// ============================================================
// 🎀 ORGANIZE ATELIÊ - VERCEL SERVERLESS API: VERIFICAÇÃO REAL E SEGURA DE PAGAMENTO
// Endpoint: POST /api/subscription/verify-payment
// ============================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
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
      return res.status(500).json({ success: false, error: 'Configuração do Supabase ausente no servidor.' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, email, plan = 'trimestral', paymentId } = body;

    if (!userId && !email) {
      return res.status(400).json({ success: false, error: 'Identificador do usuário ausente' });
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanUserId = userId ? String(userId).trim() : '';

    // 1. CHECAGEM DO PERFIL NO SUPABASE
    let query = supabaseAdmin.from('profiles').select('*');
    if (cleanUserId && cleanEmail) {
      query = query.or(`id.eq.${cleanUserId},email.ilike.${cleanEmail}`);
    } else if (cleanUserId) {
      query = query.eq('id', cleanUserId);
    } else {
      query = query.ilike('email', cleanEmail);
    }

    const { data: profile } = await query.limit(1).maybeSingle();

    // Se for Administrador Master, está sempre liberado
    if (profile && (profile.is_admin || profile.email?.toLowerCase() === 'sluccy45@gmail.com')) {
      return res.status(200).json({
        verified: true,
        status: 'active',
        plan: 'vitalicio',
        message: 'Acesso Master Vitalício Permanente.',
        profile,
      });
    }

    // Se o webhook do Mercado Pago já aprovou e a assinatura está ativa e no prazo
    if (profile && profile.subscription_status === 'active') {
      const now = new Date();
      const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
      if (!expiresAt || now <= expiresAt) {
        return res.status(200).json({
          verified: true,
          status: 'active',
          plan: profile.subscription_plan || plan || 'mensal',
          expiresAt: profile.subscription_expires_at,
          message: '🎉 Assinatura ativa confirmada pelo Mercado Pago!',
          profile,
        });
      }
    }

    // 2. CONSULTA REAL NA API DO MERCADO PAGO
    let verifiedViaMp = false;
    let detectedPlan = plan || 'mensal';
    let matchedPayment: any = null;

    if (mpAccessToken) {
      try {
        // A) Se tiver ID específico do pagamento (informado pelo cliente ou link)
        if (paymentId) {
          const pRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${mpAccessToken}` },
          });
          if (pRes.ok) {
            const pData = await pRes.json();
            if (pData.status === 'approved' || pData.status === 'authorized') {
              verifiedViaMp = true;
              matchedPayment = pData;
            }
          }
        }

        // B) Busca pagamentos recentes associados ao e-mail do pagador
        if (!verifiedViaMp && cleanEmail) {
          const searchUrl = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=10&payer.email=${encodeURIComponent(cleanEmail)}`;
          const mpRes = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${mpAccessToken}` },
          });
          if (mpRes.ok) {
            const searchData = await mpRes.json();
            const results = searchData.results || [];
            const approved = results.find((p: any) => p.status === 'approved' || p.status === 'authorized');
            if (approved) {
              verifiedViaMp = true;
              matchedPayment = approved;
            }
          }
        }

        // C) Busca pagamentos recentes associados ao external_reference (ID do usuário)
        if (!verifiedViaMp && cleanUserId) {
          const searchUrl = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=10&external_reference=${encodeURIComponent(cleanUserId)}`;
          const mpRes = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${mpAccessToken}` },
          });
          if (mpRes.ok) {
            const searchData = await mpRes.json();
            const results = searchData.results || [];
            const approved = results.find((p: any) => p.status === 'approved' || p.status === 'authorized');
            if (approved) {
              verifiedViaMp = true;
              matchedPayment = approved;
            }
          }
        }

        // Determina o plano exato a partir do valor pago ou metadata
        if (matchedPayment) {
          const amount = matchedPayment.transaction_amount || 0;
          if (amount >= 200) {
            detectedPlan = 'anual';
          } else if (amount >= 60) {
            detectedPlan = 'trimestral';
          } else if (amount >= 20) {
            detectedPlan = 'mensal';
          } else {
            detectedPlan = matchedPayment.metadata?.plan || plan || 'mensal';
          }
        }
      } catch (mpErr) {
        console.warn('[VerifyPayment API] Erro ao consultar API do Mercado Pago:', mpErr);
      }
    }

    // 3. SE O PAGAMENTO FOI REALMENTE COMPROVADO NO MERCADO PAGO -> ATIVA O PLANO
    if (verifiedViaMp) {
      const daysToAdd = detectedPlan === 'anual' ? 365 : detectedPlan === 'trimestral' ? 90 : 30;
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + daysToAdd);

      const targetId = profile?.id || cleanUserId;

      const { data: updatedProfile, error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_plan: detectedPlan,
          subscription_expires_at: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .select('*')
        .maybeSingle();

      return res.status(200).json({
        verified: true,
        status: 'active',
        plan: detectedPlan,
        expiresAt: newExpiry.toISOString(),
        paymentId: matchedPayment?.id,
        message: '🎉 Pagamento aprovado no Mercado Pago! Sua assinatura foi ativada.',
        profile: updatedProfile || profile,
      });
    }

    // 4. SE NÃO HOUVER PAGAMENTO APROVADO NO MERCADO PAGO -> NÃO LIBERA
    return res.status(200).json({
      verified: false,
      status: profile?.subscription_status || 'trial',
      message: 'Ainda não identificamos nenhum pagamento aprovado no Mercado Pago para esta conta. Se você acabou de pagar, aguarde alguns instantes para a compensação ou envie o comprovante no WhatsApp.',
    });
  } catch (err: any) {
    console.error('[VerifyPayment API] Erro geral:', err);
    return res.status(500).json({
      verified: false,
      error: err?.message || String(err),
    });
  }
}
