-- Migration: Create ecommerce_orders view
-- Description: Create a view that combines sales with customer address data for e-commerce orders

BEGIN;

-- First, ensure all the e-commerce fields exist in the sales table
-- (This should already be done by the add_ecommerce_fields_to_sales.sql migration)
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS order_source TEXT DEFAULT 'pos' CHECK (order_source IN ('pos', 'ecommerce')),
ADD COLUMN IF NOT EXISTS shipping_address_id UUID REFERENCES customer_addresses(id),
ADD COLUMN IF NOT EXISTS shipping_method TEXT,
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS payment_external_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'approved', 'rejected', 'cancelled', 'refunded', 'paid')),
ADD COLUMN IF NOT EXISTS payment_method_detail JSONB;

-- Update status constraint to include shipping states (if not already done)
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_check;
ALTER TABLE sales ADD CONSTRAINT sales_status_check
CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'completed'));

-- Create indexes for better performance (if not already created)
CREATE INDEX IF NOT EXISTS idx_sales_order_source ON sales(order_source);
CREATE INDEX IF NOT EXISTS idx_sales_payment_external_id ON sales(payment_external_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_shipping_address ON sales(shipping_address_id);

-- Drop the view if it exists and recreate it
DROP VIEW IF EXISTS ecommerce_orders;

-- Create the ecommerce_orders view
CREATE VIEW ecommerce_orders AS
SELECT
  s.id,
  s.created_at,
  s.updated_at,
  s.customer_id,
  s.customer_name,
  s.customer_type,
  s.subtotal,
  s.discount_percent,
  s.discount_amount,
  s.total,
  s.payment_method,
  s.status,
  s.user_id,
  s.user_name,
  s.notes,
  s.order_source,
  s.shipping_address_id,
  s.shipping_method,
  s.shipping_cost,
  s.estimated_delivery,
  s.tracking_number,
  s.payment_external_id,
  s.payment_status,
  s.payment_method_detail,
  s.salesperson_name,
  -- Address fields from customer_addresses
  ca.street,
  ca.number,
  ca.complement,
  ca.neighborhood,
  ca.city,
  ca.state,
  ca.zip_code,
  ca.name as shipping_name
FROM sales s
LEFT JOIN customer_addresses ca ON s.shipping_address_id = ca.id
WHERE s.order_source = 'ecommerce';

-- Grant permissions on the view
GRANT SELECT ON ecommerce_orders TO authenticated;
GRANT SELECT ON ecommerce_orders TO anon;

-- Add RLS policy for ecommerce_orders view
CREATE POLICY "Users can view their own ecommerce orders" ON sales
  FOR SELECT USING (
    CASE
      WHEN auth.role() = 'authenticated' THEN customer_id = auth.uid()
      ELSE false
    END
  );

COMMIT;
