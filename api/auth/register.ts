// ============================================================
// 🎀 ORGANIZE ATELIÊ - VERCEL SERVERLESS API: REGISTRO DE USUÁRIO
// Endpoint: POST /api/auth/register
// ============================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return res.status(500).json({ success: false, error: 'Configuração do Supabase ausente' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { name, atelieName, username, email, phone, password, avatarUrl } = body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username || cleanEmail.split('@')[0])
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_.]/g, '');
    const cleanName = String(name || 'Artesã').trim();
    const cleanAtelieName = String(atelieName || 'Meu Ateliê').trim();
    const defaultAvatar =
      avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

    let userId = '';

    // 1. Tenta criar o usuário no Supabase Auth com email_confirm: true (CONFIRMAÇÃO IMEDIATA)
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: cleanName,
        atelie_name: cleanAtelieName,
        username: cleanUsername,
        phone: phone || '',
        avatar_url: defaultAvatar,
        logo_url: defaultAvatar,
      },
    });

    if (createError) {
      // Se já existe, atualiza a senha e confirma o email
      if (createError.message.toLowerCase().includes('already') || createError.message.toLowerCase().includes('exists')) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = (listData?.users || []).find(
          (u: any) => u.email?.toLowerCase().trim() === cleanEmail
        );
        if (existingAuthUser) {
          userId = (existingAuthUser as any).id;
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: password,
            email_confirm: true,
            user_metadata: {
              name: cleanName,
              atelie_name: cleanAtelieName,
              username: cleanUsername,
              phone: phone || '',
              avatar_url: defaultAvatar,
            },
          });
        }
      } else {
        console.warn('[Register API] Erro ao criar auth user:', createError.message);
      }
    } else if (createData?.user) {
      userId = createData.user.id;
    }

    if (!userId) {
      userId = `user-${Date.now()}`;
    }

    const trialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 2. Salva ou atualiza a tabela profiles no Supabase
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: userId,
        name: cleanName,
        atelie_name: cleanAtelieName,
        username: cleanUsername,
        email: cleanEmail,
        phone: phone || '',
        avatar_url: defaultAvatar,
        logo_url: defaultAvatar,
        role: 'Artesã Responsável',
        trial_ends_at: trialEnds,
        subscription_status: 'trial',
        subscription_plan: 'free_trial',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      console.warn('[Register API] Erro ao salvar profile:', profileError.message);
    }

    const newUser = {
      id: userId,
      name: cleanName,
      atelieName: cleanAtelieName,
      username: cleanUsername,
      email: cleanEmail,
      password: password,
      phone: phone || '',
      avatarUrl: defaultAvatar,
      logoUrl: defaultAvatar,
      role: 'Artesã Responsável',
      createdAt: new Date().toISOString(),
      trialEndsAt: trialEnds,
      subscriptionStatus: 'trial',
      subscriptionPlan: 'free_trial',
    };

    return res.status(200).json({
      success: true,
      user: newUser,
    });
  } catch (err: any) {
    console.error('[Register API] Erro geral:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || String(err),
    });
  }
}
