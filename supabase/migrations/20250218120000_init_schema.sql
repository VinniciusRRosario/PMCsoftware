/*
  # Schema Inicial do ERP de Pré-moldados
  
  ## Query Description:
  Criação das tabelas clients, products, orders e order_items com relacionamentos e constraints.
  Habilita RLS para segurança básica (apenas usuários autenticados podem ler/escrever).

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
*/

-- Habilitar extensão UUID se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    company_name TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Produtos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Pedidos
CREATE TYPE order_status AS ENUM ('pendente', 'em_andamento', 'concluido');

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    delivery_deadline DATE NOT NULL,
    status order_status DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Itens do Pedido
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    qty_ordered INTEGER NOT NULL CHECK (qty_ordered > 0),
    qty_delivered INTEGER NOT NULL DEFAULT 0 CHECK (qty_delivered >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Segurança (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Políticas (Permitir tudo para usuários autenticados - Admin)
CREATE POLICY "Acesso total a clientes para autenticados" ON public.clients
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acesso total a produtos para autenticados" ON public.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acesso total a pedidos para autenticados" ON public.orders
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acesso total a itens para autenticados" ON public.order_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
