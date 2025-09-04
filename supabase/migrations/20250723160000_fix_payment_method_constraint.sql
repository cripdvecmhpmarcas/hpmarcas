-- Fix payment_method constraint to accept card brands and payment methods from MercadoPago
-- Drop the old constraint
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;

-- Add new constraint with only PIX payment method
ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check
CHECK (payment_method IN (
  'pix'
));

-- Update any existing records to use PIX only
UPDATE sales SET payment_method = 'pix' WHERE payment_method != 'pix';
