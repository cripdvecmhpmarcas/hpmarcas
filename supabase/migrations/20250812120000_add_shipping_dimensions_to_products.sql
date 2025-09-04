-- Migration: Add shipping dimensions to products table
-- Description: Add weight and physical dimensions for accurate shipping calculations

BEGIN;

-- Add shipping dimension fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS weight DECIMAL(8,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS length DECIMAL(8,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS width DECIMAL(8,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS height DECIMAL(8,2) DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN products.weight IS 'Product weight in grams for shipping calculations';
COMMENT ON COLUMN products.length IS 'Product length in centimeters for shipping calculations';
COMMENT ON COLUMN products.width IS 'Product width in centimeters for shipping calculations';
COMMENT ON COLUMN products.height IS 'Product height in centimeters for shipping calculations';

-- Create indexes for performance (optional, but useful for filtering)
CREATE INDEX IF NOT EXISTS idx_products_weight ON products(weight);
CREATE INDEX IF NOT EXISTS idx_products_dimensions ON products(length, width, height);

-- Set default dimensions for existing products if needed
-- This gives reasonable defaults for perfume products
UPDATE products 
SET 
  weight = 500,    -- 500g default
  length = 20,     -- 20cm default
  width = 15,      -- 15cm default  
  height = 5       -- 5cm default
WHERE weight IS NULL OR length IS NULL OR width IS NULL OR height IS NULL;

COMMIT;