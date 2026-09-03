// ============================================================
// 🎀 ORGANIZE ATELIÊ - VERCEL SERVERLESS API: GERENCIAMENTO DE USUÁRIOS
// Endpoint: GET /api/admin/users  &  POST /api/admin/users
// ============================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

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
      return res.status(500).json({ error: 'Configurações de servidor não disponíveis na Vercel.' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. GET: Retorna todos os perfis cadastrados no Supabase
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Admin Users API] Erro ao buscar perfis:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        users: data || [],
      });
    }

    // 2. POST: Atualiza o plano ou status de uma usuária no Supabase
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { targetUserId, updates } = body;

      if (!targetUserId) {
        return res.status(400).json({ error: 'targetUserId é obrigatório.' });
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: updates.subscriptionStatus,
          subscription_plan: updates.subscriptionPlan,
          subscription_expires_at: updates.subscriptionExpiresAt,
          trial_ends_at: updates.trialEndsAt,
          is_admin: updates.isAdmin !== undefined ? updates.isAdmin : false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('[Admin Users API] Erro ao atualizar usuária:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        message: 'Assinatura atualizada com sucesso no Supabase!',
        user: data,
      });
    }

    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (err: any) {
    console.error('[Admin Users API] Exceção:', err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
