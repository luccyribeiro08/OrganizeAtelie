// ============================================================
// 🎀 ORGANIZE ATELIÊ - VERCEL SERVERLESS API: SALVAR CONFIGURAÇÕES GLOBAIS
// Endpoint: POST /api/admin/save-settings
// ============================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
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
      return res.status(500).json({ error: 'Chaves de servidor incompletas na Vercel.' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { links, adminUserId } = body;

    // 1. Tenta atualizar todas as linhas de admin existentes
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({
        mercado_pago_links: links,
        phone: links?.whatsappAdmin || '21973389309',
        pix_key: links?.pixKey || '21973389309',
        is_admin: true,
        subscription_status: 'active',
        subscription_plan: 'vitalicio',
        updated_at: new Date().toISOString(),
      })
      .or('email.ilike.sluccy45@gmail.com,is_admin.eq.true');

    // 2. Se nenhuma linha existia, insere usando upsert seguro
    const targetAdminId = (adminUserId && adminUserId !== 'user-sluccy45-master')
      ? adminUserId
      : '0972b3ad-3498-4eae-9fc2-c2a3c858ed31';
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: targetAdminId,
        email: 'sluccy45@gmail.com',
        name: 'Luccy Ribeiro',
        atelie_name: 'Organize Ateliê - Luccy Ribeiro',
        username: 'luccyribeiro',
        phone: links?.whatsappAdmin || '21973389309',
        pix_key: links?.pixKey || '21973389309',
        is_admin: true,
        subscription_status: 'active',
        subscription_plan: 'vitalicio',
        mercado_pago_links: links,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error && updateErr) {
      console.error('[SaveSettings API] Erro ao salvar links no Supabase:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Configurações e links do Mercado Pago salvos globalmente com sucesso!',
      data,
    });
  } catch (err: any) {
    console.error('[SaveSettings API] Exceção:', err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
