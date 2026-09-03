// ============================================================
// 🎀 ORGANIZE ATELIÊ - VERCEL SERVERLESS API: VALIDAÇÃO ESTRITA E BLINDADA DE PAGAMENTOS
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
    const supabaseUrl = (
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      ''
    ).trim();

    const supabaseServiceRoleKey = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      ''
    ).trim();

    const rawMpToken = (
      process.env.MERCADO_PAGO_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN ||
      ''
    ).trim().replace(/^['"]|['"]$/g, '');

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

    // Se a assinatura já foi ativada e está válida para ESTA conta
    if (profile && profile.subscription_status === 'active' && profile.subscription_plan !== 'free_trial') {
      const now = new Date();
      const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
      if (!expiresAt || now <= expiresAt) {
        return res.status(200).json({
          verified: true,
          status: 'active',
          plan: profile.subscription_plan || plan || 'mensal',
          expiresAt: profile.subscription_expires_at,
          message: '🎉 Assinatura ativa confirmada para sua conta!',
          profile,
        });
      }
    }

    // 2. CONSULTA RIGOROSA E EXCLUSIVA NO MERCADO PAGO
    let verifiedViaMp = false;
    let detectedPlan = plan || 'mensal';
    let matchedPayment: any = null;
    let mpDiagnostic = '';

    if (!rawMpToken) {
      mpDiagnostic = 'Token do Mercado Pago não configurado na Vercel.';
    } else {
      try {
        // Obter todas as transações já consumidas por outros usuários no Supabase para impedir reuso
        const { data: allProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, email, mercado_pago_links');

        const claimedPaymentMap = new Map<string, string>(); // paymentId -> userId
        (allProfiles || []).forEach((p: any) => {
          const pLinks = p.mercado_pago_links || {};
          if (pLinks.claimed_payment_id) {
            claimedPaymentMap.set(String(pLinks.claimed_payment_id), String(p.id));
          }
        });

        // A) Validação por ID específico do comprovante informado pelo cliente
        if (paymentId) {
          const cleanPid = String(paymentId).replace(/\D/g, '').trim();
          if (cleanPid) {
            const alreadyClaimedBy = claimedPaymentMap.get(cleanPid);
            if (alreadyClaimedBy && alreadyClaimedBy !== profile?.id) {
              return res.status(200).json({
                verified: false,
                status: profile?.subscription_status || 'trial',
                message: `O comprovante de pagamento #${cleanPid} já foi utilizado para ativar outra conta do Organize Ateliê.`,
              });
            }

            const pRes = await fetch(`https://api.mercadopago.com/v1/payments/${cleanPid}`, {
              headers: { Authorization: `Bearer ${rawMpToken}` },
            });
            if (pRes.ok) {
              const pData = await pRes.json();
              if (pData.status === 'approved' || pData.status === 'authorized') {
                verifiedViaMp = true;
                matchedPayment = pData;
              } else {
                mpDiagnostic = `Pagamento #${cleanPid} localizado no Mercado Pago, mas o status é '${pData.status}'.`;
              }
            } else {
              mpDiagnostic = `Comprovante #${cleanPid} não localizado no Mercado Pago. Verifique o número digitado.`;
            }
          }
        }

        // B) Validação estrita por e-mail do pagador (se não foi informado paymentId)
        if (!verifiedViaMp && cleanEmail) {
          const searchUrl = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=15&payer.email=${encodeURIComponent(cleanEmail)}`;
          const mpRes = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${rawMpToken}` },
          });
          if (mpRes.ok) {
            const searchData = await mpRes.json();
            const results = searchData.results || [];
            
            // Procura pagamentos aprovados deste e-mail que não tenham sido consumidos por outro usuário
            const approvedForEmail = results.find((p: any) => {
              const isApproved = p.status === 'approved' || p.status === 'authorized';
              if (!isApproved) return false;
              const claimedBy = claimedPaymentMap.get(String(p.id));
              if (claimedBy && claimedBy !== profile?.id) return false;
              return true;
            });

            if (approvedForEmail) {
              verifiedViaMp = true;
              matchedPayment = approvedForEmail;
            }
          }
        }

        // C) Validação estrita por external_reference (ID do usuário)
        if (!verifiedViaMp && cleanUserId) {
          const searchUrl = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=15&external_reference=${encodeURIComponent(cleanUserId)}`;
          const mpRes = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${rawMpToken}` },
          });
          if (mpRes.ok) {
            const searchData = await mpRes.json();
            const results = searchData.results || [];
            const approvedForUser = results.find((p: any) => {
              const isApproved = p.status === 'approved' || p.status === 'authorized';
              if (!isApproved) return false;
              const claimedBy = claimedPaymentMap.get(String(p.id));
              if (claimedBy && claimedBy !== profile?.id) return false;
              return true;
            });

            if (approvedForUser) {
              verifiedViaMp = true;
              matchedPayment = approvedForUser;
            }
          }
        }

        // Determina o plano exato a partir do valor pago ou metadados
        if (matchedPayment) {
          const amount = Number(matchedPayment.transaction_amount || 0);
          if (amount >= 200) {
            detectedPlan = 'anual';
          } else if (amount >= 34) {
            detectedPlan = 'trimestral';
          } else if (amount >= 14) {
            detectedPlan = 'mensal';
          } else {
            detectedPlan = matchedPayment.metadata?.plan || plan || 'trimestral';
          }
        }
      } catch (mpErr: any) {
        console.warn('[VerifyPayment API] Erro ao consultar API do Mercado Pago:', mpErr);
        mpDiagnostic = `Erro ao consultar Mercado Pago: ${mpErr?.message || String(mpErr)}`;
      }
    }

    // 3. SE O PAGAMENTO FOI EFETIVAMENTE COMPROVADO PARA ESTA CONTA -> ATIVAÇÃO
    if (verifiedViaMp && matchedPayment) {
      const daysToAdd = detectedPlan === 'anual' ? 365 : detectedPlan === 'trimestral' ? 90 : 30;
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + daysToAdd);

      const targetId = profile?.id || cleanUserId;
      const currentLinks = profile?.mercado_pago_links || {};
      const updatedLinks = {
        ...currentLinks,
        claimed_payment_id: String(matchedPayment.id),
        claimed_at: new Date().toISOString(),
        payment_amount: matchedPayment.transaction_amount,
        payer_email: matchedPayment.payer?.email || '',
      };

      const { data: updatedProfile, error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_plan: detectedPlan,
          subscription_expires_at: newExpiry.toISOString(),
          mercado_pago_links: updatedLinks,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .select('*')
        .maybeSingle();

      if (updateErr) {
        console.error('[VerifyPayment API] Erro ao atualizar Supabase:', updateErr);
      } else {
        console.log(`[VerifyPayment API] ✅ Usuário ${targetId} ativado com sucesso para o plano ${detectedPlan} com pagamento #${matchedPayment.id}!`);
      }

      return res.status(200).json({
        verified: true,
        status: 'active',
        plan: detectedPlan,
        expiresAt: newExpiry.toISOString(),
        paymentId: matchedPayment?.id,
        message: '🎉 Pagamento aprovado no Mercado Pago! Sua assinatura foi ativada com sucesso.',
        profile: updatedProfile || {
          ...profile,
          subscription_status: 'active',
          subscription_plan: detectedPlan,
          subscription_expires_at: newExpiry.toISOString(),
          mercado_pago_links: updatedLinks,
        },
      });
    }

    // 4. SE NÃO HOUVER PAGAMENTO VÁLIDO PARA ESTA CONTA -> RECUSA A ATIVAÇÃO
    const userEmailDisplay = cleanEmail || 'sua conta';
    return res.status(200).json({
      verified: false,
      status: profile?.subscription_status || 'trial',
      message:
        mpDiagnostic ||
        `Nenhum pagamento aprovado foi localizado no Mercado Pago para o e-mail ${userEmailDisplay}. Se você realizou o pagamento com outro e-mail, digite o Nº do Pagamento do comprovante para validar.`,
      tokenConfigured: Boolean(rawMpToken),
    });
  } catch (err: any) {
    console.error('[VerifyPayment API] Erro geral:', err);
    return res.status(500).json({
      verified: false,
      error: err?.message || String(err),
    });
  }
}
