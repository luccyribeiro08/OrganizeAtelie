// ============================================================
// 🎀 ORGANIZE ATELIÊ - VERCEL SERVERLESS API: OBTER CONFIGURAÇÕES GLOBAIS
// Endpoint: GET /api/admin/get-settings
// ============================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return res.status(200).json({
        success: false,
        links: {
          mensal: '',
          trimestral: '',
          anual: '',
          pixKey: '21973389309',
          whatsappAdmin: '21973389309',
        },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data } = await supabaseAdmin
      .from('profiles')
      .select('mercado_pago_links, phone, pix_key')
      .or('email.ilike.sluccy45@gmail.com,is_admin.eq.true')
      .limit(1)
      .maybeSingle();

    if (data && data.mercado_pago_links) {
      return res.status(200).json({
        success: true,
        links: {
          mensal: data.mercado_pago_links.mensal || '',
          trimestral: data.mercado_pago_links.trimestral || '',
          anual: data.mercado_pago_links.anual || '',
          pixKey: data.mercado_pago_links.pixKey || data.pix_key || '21973389309',
          whatsappAdmin: data.mercado_pago_links.whatsappAdmin || data.phone || '21973389309',
        },
      });
    }

    return res.status(200).json({
      success: true,
      links: {
        mensal: '',
        trimestral: '',
        anual: '',
        pixKey: '21973389309',
        whatsappAdmin: '21973389309',
      },
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      error: err?.message || String(err),
      links: {
        mensal: '',
        trimestral: '',
        anual: '',
        pixKey: '21973389309',
        whatsappAdmin: '21973389309',
      },
    });
  }
}
