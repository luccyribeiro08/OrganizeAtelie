-- ============================================================
-- ORGANIZE ATELIÊ - SUPABASE DATABASE SCHEMA (COMPLETO E ATUALIZADO)
-- Tabelas: profiles, orders, catalog, catalog_categories, order_types, quotations, calendar_events, clients
-- ============================================================

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. Tabela de Perfis de Ateliê / Usuárias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_name TEXT,
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
  catalog_categories TEXT[] DEFAULT ARRAY['Topos de Bolo', 'Kit Festa', 'Cadernos & Planners', 'Lembrancinhas', 'Papelaria Escolar', 'Papelaria Corporativa']::text[],
  order_types TEXT[] DEFAULT ARRAY['Topo de Bolo & Lembrancinhas', 'Kit Festa Escolar', 'Kit Caixas Cenário Luxo', 'Cadernos & Planners Artesanais', 'Lembrancinhas Maternidade / Batizado', 'Papelaria Corporativa & Tags', 'Convites Interativos', 'Outro Personalizado']::text[],
  -- Colunas de Assinatura e Teste de 7 Dias
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  subscription_status TEXT DEFAULT 'trial',
  subscription_plan TEXT DEFAULT 'free_trial',
  subscription_expires_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT FALSE,
  mercado_pago_links JSONB DEFAULT '{"mensal": "", "trimestral": "", "anual": "", "pixKey": "", "whatsappAdmin": ""}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir colunas adicionais em profiles caso a tabela já existisse
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'owner_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN owner_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'catalog_categories'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN catalog_categories TEXT[] DEFAULT ARRAY['Topos de Bolo', 'Kit Festa', 'Cadernos & Planners', 'Lembrancinhas', 'Papelaria Escolar', 'Papelaria Corporativa']::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'order_types'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN order_types TEXT[] DEFAULT ARRAY['Topo de Bolo & Lembrancinhas', 'Kit Festa Escolar', 'Kit Caixas Cenário Luxo', 'Cadernos & Planners Artesanais', 'Lembrancinhas Maternidade / Batizado', 'Papelaria Corporativa & Tags', 'Convites Interativos', 'Outro Personalizado']::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT DEFAULT 'trial';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_plan TEXT DEFAULT 'free_trial';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'mercado_pago_links'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN mercado_pago_links JSONB DEFAULT '{"mensal": "", "trimestral": "", "anual": "", "pixKey": "", "whatsappAdmin": ""}'::jsonb;
  END IF;
END $$;

-- ============================================================
-- 3. Tabela de Pedidos
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

-- Garantir colunas adicionais em orders caso a tabela já existisse
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'mockup_images'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN mockup_images JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================================
-- 4. Tabela de Catálogo de Produtos
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
-- 5. Tabela de Categorias Customizadas do Catálogo
-- ============================================================
CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. Tabela de Tipos de Pedido Customizados
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_types (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. Tabela de Orçamentos Salvos & Precificação
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

-- Garantir colunas adicionais em quotations
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'quotations' AND column_name = 'labor_hours'
  ) THEN
    ALTER TABLE public.quotations ADD COLUMN labor_hours NUMERIC(10, 2) DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'quotations' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE public.quotations ADD COLUMN hourly_rate NUMERIC(10, 2) DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'quotations' AND column_name = 'rounded_price'
  ) THEN
    ALTER TABLE public.quotations ADD COLUMN rounded_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
  END IF;
END $$;

-- ============================================================
-- 8. Tabela de Agenda & Prazos de Ateliê
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
-- 9. Tabela de Clientes Cadastrados
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
-- 12. Políticas de Acesso (RLS Policies)
-- Permitem leitura, inserção, atualização e exclusão completas
-- ============================================================
DROP POLICY IF EXISTS "Permitir acesso completo a profiles" ON public.profiles;
CREATE POLICY "Permitir acesso completo a profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a orders" ON public.orders;
CREATE POLICY "Permitir acesso completo a orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a catalog" ON public.catalog;
CREATE POLICY "Permitir acesso completo a catalog" ON public.catalog FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a catalog_categories" ON public.catalog_categories;
CREATE POLICY "Permitir acesso completo a catalog_categories" ON public.catalog_categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a order_types" ON public.order_types;
CREATE POLICY "Permitir acesso completo a order_types" ON public.order_types FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a quotations" ON public.quotations;
CREATE POLICY "Permitir acesso completo a quotations" ON public.quotations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a calendar_events" ON public.calendar_events;
CREATE POLICY "Permitir acesso completo a calendar_events" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a clients" ON public.clients;
CREATE POLICY "Permitir acesso completo a clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
