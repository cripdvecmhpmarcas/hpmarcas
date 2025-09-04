CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cashier', 'stockist')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  barcode TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  retail_price DECIMAL(10,2) NOT NULL,
  wholesale_price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  volumes JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entry', 'exit', 'adjustment')),
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  cost NUMERIC,
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf_cnpj TEXT,
  type TEXT NOT NULL DEFAULT 'retail' CHECK (type IN ('retail', 'wholesale')),
  discount NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  address JSONB,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_purchase TIMESTAMP WITH TIME ZONE,
  total_purchases INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0
);

CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_type TEXT NOT NULL DEFAULT 'retail',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'credit', 'debit', 'pix', 'transfer')),
  status TEXT NOT NULL DEFAULT 'completed',
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  email_promotions BOOLEAN NOT NULL DEFAULT true,
  order_notifications BOOLEAN NOT NULL DEFAULT true,
  newsletter BOOLEAN NOT NULL DEFAULT true,
  personalized_recommendations BOOLEAN NOT NULL DEFAULT true,
  market_research BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id)
);

CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL CHECK (value > 0),
  min_order_value NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.coupon_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  order_id TEXT,
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coupon_id, order_id)
);

CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.tax_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tax_regime TEXT NOT NULL DEFAULT 'simples',
  icms_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  pis_rate NUMERIC(5,2) NOT NULL DEFAULT 0.65,
  cofins_rate NUMERIC(5,2) NOT NULL DEFAULT 3.00,
  auto_nfe BOOLEAN NOT NULL DEFAULT true,
  auto_email BOOLEAN NOT NULL DEFAULT true,
  nfe_environment TEXT NOT NULL DEFAULT 'homologacao',
  nfe_series TEXT NOT NULL DEFAULT '1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Migration: Add system_settings table
-- Created at: 2025-06-25 12:00:00

CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  currency TEXT NOT NULL DEFAULT 'BRL',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  stock_alert INTEGER NOT NULL DEFAULT 10,
  auto_save INTEGER NOT NULL DEFAULT 5,
  dark_theme BOOLEAN NOT NULL DEFAULT false,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  sound_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default system settings
INSERT INTO public.system_settings (
  currency,
  timezone,
  stock_alert,
  auto_save,
  dark_theme,
  email_notifications,
  sound_notifications
) VALUES (
  'BRL',
  'America/Sao_Paulo',
  10,
  5,
  false,
  true,
  true
);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read system settings
CREATE POLICY "Allow authenticated users to read system settings" ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy to allow only admin users to update system settings
CREATE POLICY "Allow admin users to update system settings" ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING (
    -- Check if user has admin role from profiles table
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.status = 'active'
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- =====================================================
-- POLÍTICAS RLS COMPLETAS - HP MARCAS
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 1. POLÍTICAS PARA PROFILES (Usuários do Sistema)
-- =====================================================

-- Permitir que todos vejam todos os perfis (para sistema administrativo)
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Permitir inserção de novos perfis
CREATE POLICY "Users can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Permitir atualização de perfis
CREATE POLICY "Users can update profiles"
ON public.profiles
FOR UPDATE
USING (true);

-- Permitir deletar perfis
CREATE POLICY "Users can delete profiles"
ON public.profiles
FOR DELETE
USING (true);

-- =====================================================
-- 2. POLÍTICAS PARA PRODUCTS (Produtos)
-- =====================================================

-- Permitir que todos vejam todos os produtos
CREATE POLICY "Users can view all products"
ON public.products
FOR SELECT
USING (true);

-- Permitir inserção de produtos
CREATE POLICY "Users can insert products"
ON public.products
FOR INSERT
WITH CHECK (true);

-- Permitir atualização de produtos
CREATE POLICY "Users can update products"
ON public.products
FOR UPDATE
USING (true);

-- Permitir deletar produtos
CREATE POLICY "Users can delete products"
ON public.products
FOR DELETE
USING (true);

-- =====================================================
-- 3. POLÍTICAS PARA STOCK_MOVEMENTS (Movimentações de Estoque)
-- =====================================================

-- Usuários autenticados podem ver todas as movimentações
CREATE POLICY "Users can view all stock movements"
ON public.stock_movements
FOR SELECT
USING (true);

-- Usuários autenticados podem inserir movimentações
CREATE POLICY "Users can insert stock movements"
ON public.stock_movements
FOR INSERT
WITH CHECK (true);

-- Política alternativa mais restritiva para usuários autenticados
CREATE POLICY "Authenticated users can view stock movements"
ON public.stock_movements
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert stock movements"
ON public.stock_movements
FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- 4. POLÍTICAS PARA CUSTOMERS (Clientes)
-- =====================================================

-- Permitir acesso total para sistema administrativo
CREATE POLICY "Enable all for customers"
ON public.customers
FOR ALL
USING (true);

-- =====================================================
-- 5. POLÍTICAS PARA SALES (Vendas)
-- =====================================================

-- Permitir acesso total para sistema administrativo
CREATE POLICY "Enable all for sales"
ON public.sales
FOR ALL
USING (true);

-- =====================================================
-- 6. POLÍTICAS PARA SALE_ITEMS (Itens de Venda)
-- =====================================================

-- Permitir acesso total para sistema administrativo
CREATE POLICY "Enable all for sale_items"
ON public.sale_items
FOR ALL
USING (true);

-- =====================================================
-- 7. POLÍTICAS PARA CUSTOMER_ADDRESSES (Endereços dos Clientes)
-- =====================================================

-- Usuários podem ver apenas seus próprios endereços
CREATE POLICY "Users can view their own addresses"
ON public.customer_addresses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = customer_addresses.customer_id
    AND customers.user_id = auth.uid()
  )
);

-- Usuários podem inserir seus próprios endereços
CREATE POLICY "Users can insert their own addresses"
ON public.customer_addresses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = customer_addresses.customer_id
    AND customers.user_id = auth.uid()
  )
);

-- Usuários podem atualizar seus próprios endereços
CREATE POLICY "Users can update their own addresses"
ON public.customer_addresses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = customer_addresses.customer_id
    AND customers.user_id = auth.uid()
  )
);

-- Usuários podem deletar seus próprios endereços
CREATE POLICY "Users can delete their own addresses"
ON public.customer_addresses
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = customer_addresses.customer_id
    AND customers.user_id = auth.uid()
  )
);

-- =====================================================
-- 8. POLÍTICAS PARA CUSTOMER_PREFERENCES (Preferências dos Clientes)
-- =====================================================

-- Usuários podem ver apenas suas próprias preferências
CREATE POLICY "Users can view their own preferences"
ON public.customer_preferences
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = customer_preferences.customer_id
    AND customers.user_id = auth.uid()
  )
);

-- Usuários podem atualizar suas próprias preferências
CREATE POLICY "Users can update their own preferences"
ON public.customer_preferences
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = customer_preferences.customer_id
    AND customers.user_id = auth.uid()
  )
);

-- Usuários podem inserir suas próprias preferências
CREATE POLICY "Users can insert their own preferences"
ON public.customer_preferences
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = customer_preferences.customer_id
    AND customers.user_id = auth.uid()
  )
);

-- =====================================================
-- 9. POLÍTICAS PARA COUPONS (Cupons de Desconto)
-- =====================================================

-- Qualquer pessoa pode ver cupons ativos (para e-commerce público)
CREATE POLICY "Anyone can view active coupons"
ON public.coupons
FOR SELECT
USING (is_active = true);

-- =====================================================
-- 10. POLÍTICAS PARA COUPON_USAGE (Uso de Cupons)
-- =====================================================

-- Usuários podem ver apenas seus próprios usos de cupons
CREATE POLICY "Users can view their own coupon usage"
ON public.coupon_usage
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = coupon_usage.customer_id
    AND customers.user_id = auth.uid()
  )
);

-- Usuários podem inserir seus próprios usos de cupons
CREATE POLICY "Users can insert their own coupon usage"
ON public.coupon_usage
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = coupon_usage.customer_id
    AND customers.user_id = auth.uid()
  )
);

-- =====================================================
-- 11. POLÍTICAS PARA COMPANY_SETTINGS (Configurações da Empresa)
-- =====================================================

-- Usuários autenticados podem ver configurações da empresa
CREATE POLICY "Authenticated users can view company settings"
ON public.company_settings
FOR SELECT
TO authenticated
USING (true);

-- Usuários autenticados podem atualizar configurações da empresa
CREATE POLICY "Authenticated users can update company settings"
ON public.company_settings
FOR UPDATE
TO authenticated
USING (true);

-- =====================================================
-- 12. POLÍTICAS PARA TAX_SETTINGS (Configurações Fiscais)
-- =====================================================

-- Usuários autenticados podem ver configurações fiscais
CREATE POLICY "Authenticated users can view tax settings"
ON public.tax_settings
FOR SELECT
TO authenticated
USING (true);

-- Usuários autenticados podem atualizar configurações fiscais
CREATE POLICY "Authenticated users can update tax settings"
ON public.tax_settings
FOR UPDATE
TO authenticated
USING (true);

-- =====================================================
-- 13. POLÍTICAS PARA SYSTEM_SETTINGS (Configurações do Sistema)
-- =====================================================

-- Usuários autenticados podem ver configurações do sistema
CREATE POLICY "Authenticated users can view system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- Usuários autenticados podem atualizar configurações do sistema
CREATE POLICY "Authenticated users can update system settings"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (true);

-- =====================================================
-- POLÍTICAS PARA STORAGE (Bucket de Imagens)
-- =====================================================

-- Acesso público para visualizar imagens
CREATE POLICY "Public Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Usuários autenticados podem fazer upload de imagens
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Usuários autenticados podem atualizar imagens
CREATE POLICY "Authenticated users can update images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Usuários autenticados podem deletar imagens
CREATE POLICY "Authenticated users can delete images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Função para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para validar CPF/CNPJ (simplificada)
CREATE OR REPLACE FUNCTION validate_cpf_cnpj(document TEXT, customer_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Para varejo (CPF): deve ter 11 dígitos
    IF customer_type = 'retail' THEN
        RETURN LENGTH(REGEXP_REPLACE(document, '[^0-9]', '', 'g')) = 11;
    END IF;

    -- Para atacado (CNPJ): deve ter 14 dígitos
    IF customer_type = 'wholesale' THEN
        RETURN LENGTH(REGEXP_REPLACE(document, '[^0-9]', '', 'g')) = 14;
    END IF;

    RETURN TRUE; -- Permite nulo
END;
$$ language 'plpgsql';

-- Função para calcular total de item de venda
CREATE OR REPLACE FUNCTION calculate_sale_item_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_price = NEW.quantity * NEW.unit_price;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para atualizar estatísticas do cliente
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Atualizar estatísticas do cliente quando venda é inserida
        UPDATE customers SET
            total_purchases = total_purchases + 1,
            total_spent = total_spent + NEW.total,
            last_purchase = NEW.created_at,
            updated_at = now()
        WHERE id = NEW.customer_id;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Recalcular se o total mudou
        IF OLD.total != NEW.total THEN
            UPDATE customers SET
                total_spent = total_spent - OLD.total + NEW.total,
                updated_at = now()
            WHERE id = NEW.customer_id;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        -- Remover estatísticas quando venda é cancelada
        UPDATE customers SET
            total_purchases = GREATEST(total_purchases - 1, 0),
            total_spent = GREATEST(total_spent - OLD.total, 0),
            updated_at = now()
        WHERE id = OLD.customer_id;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ language 'plpgsql';

-- Função para atualizar estoque automaticamente
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
DECLARE
    product_record RECORD;
BEGIN
    -- Buscar informações do produto
    SELECT * INTO product_record FROM products WHERE id = NEW.product_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produto não encontrado: %', NEW.product_id;
    END IF;

    -- Validar se há estoque suficiente para vendas
    IF NEW.type = 'exit' AND NEW.reason = 'venda' THEN
        IF product_record.stock < NEW.quantity THEN
            RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %',
                product_record.stock, NEW.quantity;
        END IF;
    END IF;

    -- Calcular nova quantidade baseada no tipo de movimentação
    CASE NEW.type
        WHEN 'entry' THEN
            NEW.new_quantity = NEW.previous_quantity + NEW.quantity;
        WHEN 'exit' THEN
            NEW.new_quantity = NEW.previous_quantity - NEW.quantity;
        WHEN 'adjustment' THEN
            NEW.new_quantity = NEW.quantity; -- Para ajustes, quantity é o valor final
        ELSE
            RAISE EXCEPTION 'Tipo de movimentação inválido: %', NEW.type;
    END CASE;

    -- Validar que estoque não fica negativo
    IF NEW.new_quantity < 0 THEN
        RAISE EXCEPTION 'Estoque não pode ficar negativo. Quantidade resultante: %', NEW.new_quantity;
    END IF;

    -- Atualizar estoque do produto
    UPDATE products
    SET stock = NEW.new_quantity, updated_at = now()
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para validar preços hierárquicos
CREATE OR REPLACE FUNCTION validate_product_prices()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar hierarquia: retail_price >= wholesale_price >= cost
    IF NEW.retail_price < NEW.wholesale_price THEN
        RAISE EXCEPTION 'Preço de varejo (%) deve ser maior ou igual ao preço de atacado (%)',
            NEW.retail_price, NEW.wholesale_price;
    END IF;

    IF NEW.wholesale_price < NEW.cost THEN
        RAISE EXCEPTION 'Preço de atacado (%) deve ser maior ou igual ao custo (%)',
            NEW.wholesale_price, NEW.cost;
    END IF;

    -- Validar que preços são positivos
    IF NEW.retail_price <= 0 OR NEW.wholesale_price <= 0 OR NEW.cost <= 0 THEN
        RAISE EXCEPTION 'Todos os preços devem ser positivos';
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para validar uso de cupons
CREATE OR REPLACE FUNCTION validate_coupon_usage()
RETURNS TRIGGER AS $$
DECLARE
    coupon_record RECORD;
    usage_count INTEGER;
BEGIN
    -- Buscar informações do cupom
    SELECT * INTO coupon_record FROM coupons WHERE id = NEW.coupon_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cupom não encontrado: %', NEW.coupon_id;
    END IF;

    -- Validar se cupom está ativo
    IF NOT coupon_record.is_active THEN
        RAISE EXCEPTION 'Cupom inativo: %', coupon_record.code;
    END IF;

    -- Validar data de validade
    IF coupon_record.end_date IS NOT NULL AND coupon_record.end_date < now() THEN
        RAISE EXCEPTION 'Cupom expirado: %', coupon_record.code;
    END IF;

    -- Validar limite de uso
    IF coupon_record.usage_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO usage_count FROM coupon_usage WHERE coupon_id = NEW.coupon_id;
        IF usage_count >= coupon_record.usage_limit THEN
            RAISE EXCEPTION 'Limite de uso do cupom excedido: %', coupon_record.code;
        END IF;
    END IF;

    -- Atualizar contador de uso do cupom
    UPDATE coupons
    SET used_count = used_count + 1, updated_at = now()
    WHERE id = NEW.coupon_id;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para atualizar rating médio do produto
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    -- Calcular nova média e contagem de reviews
    SELECT
        ROUND(AVG(rating), 2),
        COUNT(*)
    INTO avg_rating, review_count
    FROM product_reviews
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    AND status = 'approved';

    -- Atualizar produto com nova média
    UPDATE products
    SET
        rating = COALESCE(avg_rating, 0),
        review_count = review_count,
        updated_at = now()
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- ============================================================================
-- 2. TABELA DE AVALIAÇÕES DE PRODUTOS
-- ============================================================================

CREATE TABLE public.product_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    pros TEXT,
    cons TEXT,
    recommend BOOLEAN DEFAULT true,
    verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    moderation_notes TEXT,
    moderated_by UUID REFERENCES public.profiles(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- Impedir múltiplas avaliações do mesmo cliente para o mesmo produto
    UNIQUE(product_id, customer_id)
);

-- Adicionar campos de rating ao produto (se não existirem)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- ============================================================================
-- 3. TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Trigger para profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para products
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para customers
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para customer_addresses
CREATE TRIGGER update_customer_addresses_updated_at
    BEFORE UPDATE ON public.customer_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para customer_preferences
CREATE TRIGGER update_customer_preferences_updated_at
    BEFORE UPDATE ON public.customer_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para sales
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para coupons
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para company_settings
CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON public.company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tax_settings
CREATE TRIGGER update_tax_settings_updated_at
    BEFORE UPDATE ON public.tax_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para product_reviews
CREATE TRIGGER update_product_reviews_updated_at
    BEFORE UPDATE ON public.product_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. TRIGGERS DE VALIDAÇÃO E AUTOMAÇÃO
-- ============================================================================

-- Trigger para validar preços dos produtos
CREATE TRIGGER validate_product_prices_trigger
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION validate_product_prices();

-- Trigger para calcular total dos itens de venda
CREATE TRIGGER calculate_sale_item_total_trigger
    BEFORE INSERT OR UPDATE ON public.sale_items
    FOR EACH ROW EXECUTE FUNCTION calculate_sale_item_total();

-- Trigger para atualizar estatísticas do cliente
CREATE TRIGGER update_customer_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- Trigger para atualizar estoque automaticamente
CREATE TRIGGER update_product_stock_trigger
    BEFORE INSERT ON public.stock_movements
    FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- Trigger para validar uso de cupons
CREATE TRIGGER validate_coupon_usage_trigger
    BEFORE INSERT ON public.coupon_usage
    FOR EACH ROW EXECUTE FUNCTION validate_coupon_usage();

-- Trigger para atualizar rating do produto
CREATE TRIGGER update_product_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ============================================================================
-- 5. TRIGGER PARA VERIFICAR COMPRA VERIFICADA
-- ============================================================================

-- Função para marcar review como compra verificada
CREATE OR REPLACE FUNCTION check_verified_purchase()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se o cliente realmente comprou o produto
    IF EXISTS (
        SELECT 1 FROM sales s
        INNER JOIN sale_items si ON s.id = si.sale_id
        WHERE s.customer_id = NEW.customer_id
        AND si.product_id = NEW.product_id
        AND s.status = 'completed'
    ) THEN
        NEW.verified_purchase = true;

        -- Se há uma venda específica informada, validar
        IF NEW.sale_id IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1 FROM sales s
                INNER JOIN sale_items si ON s.id = si.sale_id
                WHERE s.id = NEW.sale_id
                AND s.customer_id = NEW.customer_id
                AND si.product_id = NEW.product_id
                AND s.status = 'completed'
            ) THEN
                RAISE EXCEPTION 'Venda especificada não contém este produto para este cliente';
            END IF;
        END IF;
    ELSE
        NEW.verified_purchase = false;
        NEW.sale_id = NULL; -- Limpar sale_id se não há compra verificada
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para verificar compra
CREATE TRIGGER check_verified_purchase_trigger
    BEFORE INSERT OR UPDATE ON public.product_reviews
    FOR EACH ROW EXECUTE FUNCTION check_verified_purchase();

-- ============================================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_status_active ON products(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_stock_low ON products(stock, min_stock) WHERE stock <= min_stock;

-- Índices para sales
CREATE INDEX IF NOT EXISTS idx_sales_created_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);

-- Índices para stock_movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_date ON stock_movements(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user ON stock_movements(user_id);

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE email IS NOT NULL;

-- Índices para product_reviews
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer_id ON product_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_verified ON product_reviews(verified_purchase);

-- Índices para coupon_usage
CREATE INDEX IF NOT EXISTS idx_coupon_usage_customer ON coupon_usage(customer_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);

-- ============================================================================
-- 7. VIEWS ÚTEIS
-- ============================================================================

-- View para produtos com estoque baixo
CREATE OR REPLACE VIEW low_stock_products AS
SELECT
    p.*,
    (p.stock <= p.min_stock) as is_low_stock,
    (p.min_stock - p.stock) as units_needed
FROM products p
WHERE p.status = 'active' AND p.stock <= p.min_stock;

-- View para resumo de vendas diárias
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT
    DATE(s.created_at) as sale_date,
    COUNT(*) as total_sales,
    SUM(s.total) as total_revenue,
    AVG(s.total) as avg_ticket,
    COUNT(DISTINCT s.customer_id) as unique_customers
FROM sales s
WHERE s.status = 'completed'
GROUP BY DATE(s.created_at)
ORDER BY sale_date DESC;

-- View para top produtos por vendas
CREATE OR REPLACE VIEW top_selling_products AS
SELECT
    p.id,
    p.name,
    p.brand,
    p.category,
    SUM(si.quantity) as total_sold,
    SUM(si.total_price) as total_revenue,
    COUNT(DISTINCT si.sale_id) as times_sold,
    p.rating,
    p.review_count
FROM products p
INNER JOIN sale_items si ON p.id = si.product_id
INNER JOIN sales s ON si.sale_id = s.id
WHERE s.status = 'completed'
GROUP BY p.id, p.name, p.brand, p.category, p.rating, p.review_count
ORDER BY total_sold DESC;

-- View para reviews aprovados com informações do cliente
CREATE OR REPLACE VIEW approved_reviews AS
SELECT
    pr.id,
    pr.product_id,
    p.name as product_name,
    p.brand as product_brand,
    pr.customer_id,
    c.name as customer_name,
    pr.rating,
    pr.title,
    pr.comment,
    pr.pros,
    pr.cons,
    pr.recommend,
    pr.verified_purchase,
    pr.helpful_count,
    pr.created_at
FROM product_reviews pr
INNER JOIN products p ON pr.product_id = p.id
INNER JOIN customers c ON pr.customer_id = c.id
WHERE pr.status = 'approved'
ORDER BY pr.created_at DESC;

-- ============================================================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE product_reviews IS 'Tabela para armazenar avaliações de produtos feitas pelos clientes';
COMMENT ON COLUMN product_reviews.rating IS 'Nota de 1 a 5 estrelas';
COMMENT ON COLUMN product_reviews.verified_purchase IS 'Indica se o cliente realmente comprou o produto';
COMMENT ON COLUMN product_reviews.status IS 'Status da moderação: pending, approved, rejected';

COMMENT ON FUNCTION update_customer_stats() IS 'Atualiza automaticamente as estatísticas do cliente quando vendas são modificadas';
COMMENT ON FUNCTION update_product_stock() IS 'Atualiza automaticamente o estoque do produto baseado nas movimentações';
COMMENT ON FUNCTION validate_product_prices() IS 'Valida que preços seguem a hierarquia: varejo >= atacado >= custo';
COMMENT ON FUNCTION update_product_rating() IS 'Recalcula a média de rating do produto baseado nas reviews aprovadas';

-- Adicionar campo is_anonymous na tabela customers
ALTER TABLE public.customers
ADD COLUMN is_anonymous BOOLEAN NOT NULL DEFAULT false;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.customers.is_anonymous IS 'Indica se o cliente foi criado via anonymous auth do Supabase';

-- Criar índice para consultas por usuários anônimos
CREATE INDEX idx_customers_is_anonymous ON public.customers(is_anonymous);

-- Criar função para atualizar usuários anônimos quando convertidos
CREATE OR REPLACE FUNCTION public.update_anonymous_customer_on_conversion()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário estava anônimo e agora tem email, marcar como não-anônimo
  IF OLD.email IS NULL AND NEW.email IS NOT NULL THEN
    NEW.is_anonymous = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para conversão automática
CREATE TRIGGER trigger_update_anonymous_customer_conversion
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_anonymous_customer_on_conversion();

-- Atualizar registros existentes (todos são considerados não-anônimos)
UPDATE public.customers
SET is_anonymous = false
WHERE is_anonymous IS NULL;

-- Adicionar constraint para garantir consistência
ALTER TABLE public.customers
ADD CONSTRAINT check_anonymous_consistency
CHECK (
  (is_anonymous = true AND email IS NULL) OR
  (is_anonymous = false)
);

-- ADMIN 1: Administrador Principal
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@hpmarcas.com.br',
  crypt('Admin123!', gen_salt('bf')), -- Senha: Admin123!
  now(),
  null,
  '',
  null,
  '',
  null,
  '',
  '',
  null,
  null,
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Administrador Principal", "role": "admin"}',
  false,
  now(),
  now(),
  null,
  null,
  '',
  '',
  null,
  '',
  0,
  null,
  '',
  null,
  false,
  null,
  false
);

-- ADMIN 2: Gerente de Loja
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'gerente@hpmarcas.com.br',
  crypt('Gerente123!', gen_salt('bf')), -- Senha: Gerente123!
  now(),
  null,
  '',
  null,
  '',
  null,
  '',
  '',
  null,
  null,
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Gerente da Loja", "role": "admin"}',
  false,
  now(),
  now(),
  null,
  null,
  '',
  '',
  null,
  '',
  0,
  null,
  '',
  null,
  false,
  null,
  false
);

-- ==========================================
-- 2. INSERIR PERFIS NA TABELA public.profiles
-- ==========================================

-- Inserir perfil para o Admin Principal
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@hpmarcas.com.br'),
  'Administrador Principal',
  'admin@hpmarcas.com.br',
  'admin',
  'active',
  now(),
  now()
);

-- Inserir perfil para o Gerente
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'gerente@hpmarcas.com.br'),
  'Gerente da Loja',
  'gerente@hpmarcas.com.br',
  'admin',
  'active',
  now(),
  now()
);

-- ==========================================
-- 3. VERIFICAR SE OS USUÁRIOS FORAM CRIADOS
-- ==========================================

-- Verificar usuários criados na tabela auth.users
SELECT
  id,
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as metadata_role,
  created_at,
  email_confirmed_at,
  is_anonymous
FROM auth.users
WHERE email IN ('admin@hpmarcas.com.br', 'gerente@hpmarcas.com.br')
ORDER BY created_at DESC;

-- Verificar perfis criados na tabela public.profiles
SELECT
  p.id,
  p.name,
  p.email,
  p.role,
  p.status,
  p.created_at
FROM public.profiles p
WHERE p.email IN ('admin@hpmarcas.com.br', 'gerente@hpmarcas.com.br')
ORDER BY p.created_at DESC;

-- ==========================================
-- 4. CRIAR DADOS INICIAIS EXTRAS (OPCIONAL)
-- ==========================================

-- Inserir configurações da empresa (se não existir)
INSERT INTO public.company_settings (
  company_name,
  cnpj,
  email,
  phone,
  address,
  city,
  state,
  zip_code,
  created_at,
  updated_at
) VALUES (
  'HP Marcas Perfumes Ltda',
  '12.345.678/0001-90',
  'contato@hpmarcas.com.br',
  '(21) 99999-9999',
  'Av. Presidente Vargas, 633, Sala 314 - Centro',
  'Rio de Janeiro',
  'RJ',
  '20071-004',
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Inserir configurações fiscais padrão (se não existir)
INSERT INTO public.tax_settings (
  tax_regime,
  icms_rate,
  pis_rate,
  cofins_rate,
  auto_nfe,
  auto_email,
  nfe_environment,
  nfe_series,
  created_at,
  updated_at
) VALUES (
  'simples',
  18.00,
  0.65,
  3.00,
  true,
  true,
  'homologacao',
  '1',
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- ==========================================
-- 📋 CREDENCIAIS PARA TESTE
-- ==========================================

/*
USUÁRIOS CRIADOS PARA TESTE:

👤 ADMINISTRADOR PRINCIPAL
📧 Email: admin@hpmarcas.com.br
🔐 Senha: Admin123!
🏷️ Role: admin
✅ Status: active

👤 GERENTE DA LOJA
📧 Email: gerente@hpmarcas.com.br
🔐 Senha: Gerente123!
🏷️ Role: admin
✅ Status: active

-- ==========================================
*/

CREATE OR REPLACE FUNCTION update_product_stock(
  product_id UUID,
  quantity_sold INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar estoque do produto
  UPDATE products
  SET
    stock = stock - quantity_sold,
    updated_at = NOW()
  WHERE id = product_id;

  -- Opcional: Criar movimento de estoque
  INSERT INTO stock_movements (
    product_id,
    product_name,
    product_sku,
    type,
    quantity,
    previous_quantity,
    new_quantity,
    reason,
    user_id,
    user_name
  )
  SELECT
    p.id,
    p.name,
    p.sku,
    'exit',
    quantity_sold,
    p.stock + quantity_sold, -- estoque antes
    p.stock,                 -- estoque depois
    'Venda PDV',
    auth.uid(),
    'Sistema PDV'
  FROM products p
  WHERE p.id = product_id;
END;
$$;

-- Add is_anonymous field to customers table to support anonymous customers

ALTER TABLE public.customers
ADD COLUMN is_anonymous BOOLEAN DEFAULT false;

-- Create index for better performance when searching for default customer
CREATE INDEX idx_customers_anonymous ON public.customers(is_anonymous) WHERE is_anonymous = true;

-- Create default customer if not exists
INSERT INTO public.customers (name, type, discount, status, is_anonymous, notes)
SELECT 'Cliente Balcão', 'retail', 0, 'active', true, 'Cliente padrão do sistema para vendas no balcão'
WHERE NOT EXISTS (
  SELECT 1 FROM public.customers
  WHERE name = 'Cliente Balcão' AND is_anonymous = true
);

-- Política para leitura pública das imagens
CREATE POLICY "Public read access for product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Política para upload por usuários autenticados
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- Política para atualização por usuários autenticados
CREATE POLICY "Authenticated users can update product images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- Política para exclusão por usuários autenticados
CREATE POLICY "Authenticated users can delete product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);
