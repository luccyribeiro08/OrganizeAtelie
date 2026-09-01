-- ============================================================
-- ORGANIZE ATELIÊ - SUPABASE DATABASE SCHEMA
-- ============================================================

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Ateliê / Usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  atelie_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'Artesã Responsável',
  slogan TEXT DEFAULT 'Papelaria Personalizada & Afetiva',
  pix_key TEXT,
  instagram TEXT,
  address TEXT,
  avatar_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_instagram TEXT,
  order_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  delivery_method TEXT NOT NULL,
  delivery_address TEXT,
  theme TEXT NOT NULL,
  origin TEXT NOT NULL,
  order_type TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  personalization JSONB NOT NULL DEFAULT '{}'::jsonb,
  financial JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'Pendente',
  mockup_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Catálogo de Produtos
CREATE TABLE IF NOT EXISTS public.catalog (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  estimated_days INTEGER NOT NULL DEFAULT 3,
  image_url TEXT,
  tags TEXT[] DEFAULT ARRAY['Personalizados', 'Ateliê']::text[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de Acesso Público para Desenvolvimento / Demo (Permite ler e gravar)
CREATE POLICY "Permitir acesso completo a profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo a orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo a catalog" ON public.catalog FOR ALL USING (true) WITH CHECK (true);
