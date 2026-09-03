// ============================================================
// 🎀 ORGANIZE ATELIÊ - VERCEL SERVERLESS API: VERIFICAÇÃO REAL DE PAGAMENTO
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
      return res.status(500).json({ success: false, error: 'Configuração do Supabase ausente' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, email, plan } = body;

    if (!userId && !email) {
      return res.status(400).json({ success: false, error: 'Identificador do usuário ausente' });
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanUserId = userId ? String(userId).trim() : '';

    // 1. CHECAGEM INICIAL NO BANCO DE DADOS (Se o Webhook já aprovou anteriormente)
    let query = supabaseAdmin.from('profiles').select('*');
    if (cleanUserId && cleanEmail) {
      query = query.or(`id.eq.${cleanUserId},email.ilike.${cleanEmail}`);
    } else if (cleanUserId) {
      query = query.eq('id', cleanUserId);
    } else {
      query = query.ilike('email', cleanEmail);
    }

    const { data: profile } = await query.limit(1).maybeSingle();

    if (profile) {
      // Se for Administrador Master, está sempre liberado
      if (profile.is_admin || profile.email?.toLowerCase() === 'sluccy45@gmail.com') {
        return res.status(200).json({
          verified: true,
          status: 'active',
          plan: 'vitalicio',
          message: 'Acesso Master Vitalício ativo.',
          profile,
        });
      }

      // Se já foi aprovado pelo Webhook do Mercado Pago
      if (profile.subscription_status === 'active') {
        const now = new Date();
        const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
        if (!expiresAt || now <= expiresAt) {
          return res.status(200).json({
            verified: true,
            status: 'active',
            plan: profile.subscription_plan || plan || 'mensal',
            expiresAt: profile.subscription_expires_at,
            message: 'Assinatura ativa e confirmada no banco de dados!',
            profile,
          });
        }
      }
    }

    // 2. CONSULTA DIRETA NA API DO MERCADO PAGO (Se tiver Access Token configurado)
    if (mpAccessToken && (cleanEmail || cleanUserId)) {
      try {
        console.log(`[VerifyPayment API] Consultando Mercado Pago para ${cleanEmail || cleanUserId}...`);
        
        // Busca pagamentos recentes associados ao e-mail ou external_reference
        const searchUrl = cleanEmail
          ? `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=10&payer.email=${encodeURIComponent(cleanEmail)}`
          : `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=10&external_reference=${encodeURIComponent(cleanUserId)}`;

        const mpRes = await fetch(searchUrl, {
          headers: { Authorization: `Bearer ${mpAccessToken}` },
        });

        if (mpRes.ok) {
          const searchData = await mpRes.json();
          const results = searchData.results || [];
          
          // Localiza o pagamento aprovado mais recente
          const approvedPayment = results.find(
            (p: any) => (p.status === 'approved' || p.status === 'authorized')
          );

          if (approvedPayment) {
            console.log(`[VerifyPayment API] ✅ Pagamento ${approvedPayment.id} aprovado encontrado no Mercado Pago!`);
            
            const detectedPlan = approvedPayment.metadata?.plan || plan || 'mensal';
            const daysToAdd = detectedPlan === 'anual' ? 365 : detectedPlan === 'trimestral' ? 90 : 30;
            const newExpiry = new Date();
            newExpiry.setDate(newExpiry.getDate() + daysToAdd);

            const targetId = profile?.id || cleanUserId;

            // Atualiza no Supabase
            const { data: updatedProfile } = await supabaseAdmin
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
              paymentId: approvedPayment.id,
              message: 'Pagamento confirmado e assinatura ativada com sucesso!',
              profile: updatedProfile || profile,
            });
          }
        }
      } catch (mpSearchErr) {
        console.warn('[VerifyPayment API] Erro ao consultar API do Mercado Pago:', mpSearchErr);
      }
    }

    // 3. PAGAMENTO AINDA NÃO CONFIRMADO
    return res.status(200).json({
      verified: false,
      status: profile?.subscription_status || 'trial',
      message: 'Ainda não identificamos a confirmação do seu pagamento no Mercado Pago. Se você acabou de pagar via PIX ou Cartão, aguarde alguns segundos para a compensação e tente novamente.',
    });
  } catch (err: any) {
    console.error('[VerifyPayment API] Erro geral:', err);
    return res.status(500).json({
      verified: false,
      error: err?.message || String(err),
    });
  }
}
