-- ============================================================
-- ORGANIZE ATELIÊ - SUPABASE DATABASE SCHEMA (COMPLETO & ATUALIZADO)
-- Plataforma SaaS para Ateliês de Papelaria Personalizada & Afetiva
-- Tabelas: profiles, orders, catalog, catalog_categories, order_types, quotations, calendar_events, clients
-- ============================================================

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. Tabela de Perfis de Ateliê / Usuárias (profiles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_name TEXT,
  atelie_name TEXT,
  username TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'Artesã Responsável',
  slogan TEXT DEFAULT 'Papelaria Personalizada & Afetiva',
  pix_key TEXT,
  instagram TEXT,
  address TEXT,
  avatar_url TEXT,
  logo_url TEXT,
  catalog_categories TEXT[] DEFAULT ARRAY['Topos de Bolo', 'Kit Festa', 'Cadernos & Planners', 'Lembrancinhas', 'Papelaria Escolar', 'Papelaria Corporativa']::text[],
  order_types TEXT[] DEFAULT ARRAY['Topo de Bolo & Lembrancinhas', 'Kit Festa Escolar', 'Kit Caixas Cenário Luxo', 'Cadernos & Planners Artesanais', 'Lembrancinhas Maternidade / Batizado', 'Papelaria Corporativa & Tags', 'Convites Interativos', 'Outro Personalizado']::text[],
  -- Colunas de Assinatura, Teste de 7 Dias e Mercado Pago
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  subscription_status TEXT DEFAULT 'trial',
  subscription_plan TEXT DEFAULT 'free_trial',
  subscription_expires_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT FALSE,
  mercado_pago_links JSONB DEFAULT '{"mensal": "", "trimestral": "", "anual": "", "pixKey": "", "whatsappAdmin": ""}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migração Idempotente de Colunas em profiles
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'owner_name') THEN
    ALTER TABLE public.profiles ADD COLUMN owner_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'atelie_name') THEN
    ALTER TABLE public.profiles ADD COLUMN atelie_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username') THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'catalog_categories') THEN
    ALTER TABLE public.profiles ADD COLUMN catalog_categories TEXT[] DEFAULT ARRAY['Topos de Bolo', 'Kit Festa', 'Cadernos & Planners', 'Lembrancinhas', 'Papelaria Escolar', 'Papelaria Corporativa']::text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'order_types') THEN
    ALTER TABLE public.profiles ADD COLUMN order_types TEXT[] DEFAULT ARRAY['Topo de Bolo & Lembrancinhas', 'Kit Festa Escolar', 'Kit Caixas Cenário Luxo', 'Cadernos & Planners Artesanais', 'Lembrancinhas Maternidade / Batizado', 'Papelaria Corporativa & Tags', 'Convites Interativos', 'Outro Personalizado']::text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'trial_ends_at') THEN
    ALTER TABLE public.profiles ADD COLUMN trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_status') THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT DEFAULT 'trial';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_plan') THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_plan TEXT DEFAULT 'free_trial';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_expires_at') THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_admin') THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'mercado_pago_links') THEN
    ALTER TABLE public.profiles ADD COLUMN mercado_pago_links JSONB DEFAULT '{"mensal": "", "trimestral": "", "anual": "", "pixKey": "", "whatsappAdmin": ""}'::jsonb;
  END IF;
END $$;

-- ============================================================
-- 3. Tabela de Pedidos (orders)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
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
  completed_at TIMESTAMPTZ,
  mockup_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migração Idempotente de Colunas em orders
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'completed_at') THEN
    ALTER TABLE public.orders ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'mockup_images') THEN
    ALTER TABLE public.orders ADD COLUMN mockup_images JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================================
-- 4. Tabela de Catálogo de Produtos (catalog)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.catalog (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  estimated_days INTEGER NOT NULL DEFAULT 3,
  image_url TEXT,
  tags TEXT[] DEFAULT ARRAY['Personalizados', 'Ateliê']::text[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. Tabela de Categorias Customizadas do Catálogo (catalog_categories)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. Tabela de Tipos de Pedido Customizados (order_types)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_types (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. Tabela de Orçamentos Salvos & Precificação (quotations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  theme TEXT NOT NULL,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  labor_cost NUMERIC(10, 2) NOT NULL DEFAULT 25.00,
  labor_hours NUMERIC(10, 2) DEFAULT 0.00,
  hourly_rate NUMERIC(10, 2) DEFAULT 0.00,
  additional_costs NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  profit_margin NUMERIC(5, 2) NOT NULL DEFAULT 40.00,
  calculated_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  suggested_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  rounded_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_days INTEGER NOT NULL DEFAULT 7,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migração Idempotente de Colunas em quotations
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotations' AND column_name = 'labor_hours') THEN
    ALTER TABLE public.quotations ADD COLUMN labor_hours NUMERIC(10, 2) DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotations' AND column_name = 'hourly_rate') THEN
    ALTER TABLE public.quotations ADD COLUMN hourly_rate NUMERIC(10, 2) DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotations' AND column_name = 'rounded_price') THEN
    ALTER TABLE public.quotations ADD COLUMN rounded_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
  END IF;
END $$;

-- ============================================================
-- 8. Tabela de Agenda & Prazos de Ateliê (calendar_events)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT,
  event_type TEXT NOT NULL DEFAULT 'Entrega',
  order_id TEXT,
  client_name TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. Tabela de Clientes Cadastrados (clients)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  instagram TEXT,
  email TEXT,
  cpf TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  birth_date DATE,
  child_name TEXT,
  child_birth_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. Índices de Otimização e Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_catalog_user_id ON public.catalog(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_user_id ON public.catalog_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_order_types_user_id ON public.order_types(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON public.quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);

-- ============================================================
-- 11. Habilitar Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. Função Auxiliar de Verificação Admin (SECURITY DEFINER)
-- Evita o bug de Recursão Infinita (Infinite Recursion) no RLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid()::text AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 13. Políticas de Segurança (RLS Policies) com Isolamento Total
-- Garante acesso aos próprios dados e controle irrestrito ao Admin
-- ============================================================

-- 1. Profiles
DROP POLICY IF EXISTS "Permitir acesso completo a profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuário gerencia próprio perfil" ON public.profiles;
CREATE POLICY "Usuário gerencia próprio perfil" ON public.profiles
  FOR ALL 
  USING (id = auth.uid()::text OR public.is_admin_user())
  WITH CHECK (id = auth.uid()::text OR public.is_admin_user());

-- 2. Orders (Pedidos)
DROP POLICY IF EXISTS "Permitir acesso completo a orders" ON public.orders;
DROP POLICY IF EXISTS "Usuário gerencia próprios pedidos" ON public.orders;
CREATE POLICY "Usuário gerencia próprios pedidos" ON public.orders
  FOR ALL 
  USING (user_id = auth.uid()::text OR public.is_admin_user())
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin_user());

-- 3. Catalog (Catálogo de Produtos)
DROP POLICY IF EXISTS "Permitir acesso completo a catalog" ON public.catalog;
DROP POLICY IF EXISTS "Usuário gerencia próprio catálogo" ON public.catalog;
CREATE POLICY "Usuário gerencia próprio catálogo" ON public.catalog
  FOR ALL 
  USING (user_id = auth.uid()::text OR public.is_admin_user())
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin_user());

-- 4. Catalog Categories (Categorias de Catálogo)
DROP POLICY IF EXISTS "Permitir acesso completo a catalog_categories" ON public.catalog_categories;
DROP POLICY IF EXISTS "Usuário gerencia próprias categorias de catálogo" ON public.catalog_categories;
CREATE POLICY "Usuário gerencia próprias categorias de catálogo" ON public.catalog_categories
  FOR ALL 
  USING (user_id = auth.uid()::text OR public.is_admin_user())
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin_user());

-- 5. Order Types (Tipos de Pedido)
DROP POLICY IF EXISTS "Permitir acesso completo a order_types" ON public.order_types;
DROP POLICY IF EXISTS "Usuário gerencia próprios tipos de pedido" ON public.order_types;
CREATE POLICY "Usuário gerencia próprios tipos de pedido" ON public.order_types
  FOR ALL 
  USING (user_id = auth.uid()::text OR public.is_admin_user())
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin_user());

-- 6. Quotations (Orçamentos & Precificação)
DROP POLICY IF EXISTS "Permitir acesso completo a quotations" ON public.quotations;
DROP POLICY IF EXISTS "Usuário gerencia próprios orçamentos" ON public.quotations;
CREATE POLICY "Usuário gerencia próprios orçamentos" ON public.quotations
  FOR ALL 
  USING (user_id = auth.uid()::text OR public.is_admin_user())
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin_user());

-- 7. Calendar Events (Agenda & Prazos)
DROP POLICY IF EXISTS "Permitir acesso completo a calendar_events" ON public.calendar_events;
DROP POLICY IF EXISTS "Usuário gerencia sua agenda" ON public.calendar_events;
CREATE POLICY "Usuário gerencia sua agenda" ON public.calendar_events
  FOR ALL 
  USING (user_id = auth.uid()::text OR public.is_admin_user())
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin_user());

-- 8. Clients (Clientes Cadastrados)
DROP POLICY IF EXISTS "Permitir acesso completo a clients" ON public.clients;
DROP POLICY IF EXISTS "Usuário gerencia seus clientes" ON public.clients;
CREATE POLICY "Usuário gerencia seus clientes" ON public.clients
  FOR ALL 
  USING (user_id = auth.uid()::text OR public.is_admin_user())
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin_user());

-- ============================================================
-- 13. Trigger Automático: Criação de Perfil no Cadastro Supabase Auth
-- Cria automaticamente o perfil com 7 dias de teste grátis
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    owner_name,
    atelie_name,
    username,
    email,
    phone,
    role,
    avatar_url,
    logo_url,
    trial_ends_at,
    subscription_status,
    subscription_plan,
    is_admin,
    mercado_pago_links,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'atelie_name', 'Artesã'),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Artesã'),
    COALESCE(NEW.raw_user_meta_data->>'atelie_name', 'Meu Ateliê'),
    LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'username', ''))),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Artesã Responsável'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'logo_url', ''),
    NOW() + INTERVAL '7 days',
    CASE WHEN LOWER(TRIM(NEW.email)) = 'sluccy45@gmail.com' THEN 'active' ELSE 'trial' END,
    CASE WHEN LOWER(TRIM(NEW.email)) = 'sluccy45@gmail.com' THEN 'vitalicio' ELSE 'free_trial' END,
    CASE WHEN LOWER(TRIM(NEW.email)) = 'sluccy45@gmail.com' THEN true ELSE false END,
    '{"mensal": "", "trimestral": "", "anual": "", "pixKey": "", "whatsappAdmin": ""}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = COALESCE(NULLIF(EXCLUDED.username, ''), public.profiles.username),
    is_admin = CASE WHEN LOWER(TRIM(EXCLUDED.email)) = 'sluccy45@gmail.com' THEN true ELSE false END,
    subscription_status = CASE WHEN LOWER(TRIM(EXCLUDED.email)) = 'sluccy45@gmail.com' THEN 'active' ELSE public.profiles.subscription_status END,
    subscription_plan = CASE WHEN LOWER(TRIM(EXCLUDED.email)) = 'sluccy45@gmail.com' THEN 'vitalicio' ELSE public.profiles.subscription_plan END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 14. Garantir EXCLUSIVAMENTE sluccy45@gmail.com como Admin Master Vitalício
-- ============================================================
-- Desmarcar qualquer outro usuário de ser admin
UPDATE public.profiles 
SET is_admin = false 
WHERE LOWER(TRIM(email)) <> 'sluccy45@gmail.com';

-- Garantir que sluccy45@gmail.com seja Admin Master com acesso Vitalício Ilimitado
UPDATE public.profiles 
SET is_admin = true,
    subscription_status = 'active',
    subscription_plan = 'vitalicio'
WHERE LOWER(TRIM(email)) = 'sluccy45@gmail.com';

-- Script opcional para limpar dados de pedidos e itens de teste se desejar:
-- TRUNCATE TABLE public.orders, public.catalog, public.quotations, public.clients, public.calendar_events CASCADE;
