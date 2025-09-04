-- Create categories table for hierarchical category structure
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique name within same parent level
  CONSTRAINT unique_name_per_parent UNIQUE (name, parent_id)
);

-- Add subcategory_id to products table
ALTER TABLE products ADD COLUMN subcategory_id UUID REFERENCES categories(id);

-- Create indexes for performance
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_products_subcategory_id ON products(subcategory_id);

-- Insert default categories (main categories)
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Perfumes Masculinos', 'perfumes-masculinos', 'Fragrâncias masculinas', 1),
('Perfumes Femininos', 'perfumes-femininos', 'Fragrâncias femininas', 2),
('Perfumes Infantis', 'perfumes-infantis', 'Fragrâncias para crianças', 3),
('Perfumes Unissex', 'perfumes-unissex', 'Fragrâncias unissex', 4),
('Cremes e Loções', 'cremes-e-locoes', 'Produtos para cuidados com a pele', 5),
('Sabonetes', 'sabonetes', 'Sabonetes e produtos de higiene', 6),
('Desodorantes', 'desodorantes', 'Desodorantes e antitranspirantes', 7),
('Kits e Presentes', 'kits-e-presentes', 'Kits e conjuntos para presente', 8),
('Acessórios', 'acessorios', 'Acessórios e complementos', 9),
('Outros', 'outros', 'Outros produtos', 10);

-- Insert some example subcategories
DO $$
DECLARE
    perfumes_masc_id UUID;
    perfumes_fem_id UUID;
    cremes_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO perfumes_masc_id FROM categories WHERE slug = 'perfumes-masculinos';
    SELECT id INTO perfumes_fem_id FROM categories WHERE slug = 'perfumes-femininos';
    SELECT id INTO cremes_id FROM categories WHERE slug = 'cremes-e-locoes';
    
    -- Insert subcategories for Perfumes Masculinos
    INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
    ('Amadeirados', 'amadeirados-masc', perfumes_masc_id, 1),
    ('Cítricos', 'citricos-masc', perfumes_masc_id, 2),
    ('Orientais', 'orientais-masc', perfumes_masc_id, 3),
    ('Frescos', 'frescos-masc', perfumes_masc_id, 4),
    ('Especiarias', 'especiarias-masc', perfumes_masc_id, 5);
    
    -- Insert subcategories for Perfumes Femininos
    INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
    ('Florais', 'florais-fem', perfumes_fem_id, 1),
    ('Frutados', 'frutados-fem', perfumes_fem_id, 2),
    ('Amadeirados', 'amadeirados-fem', perfumes_fem_id, 3),
    ('Orientais', 'orientais-fem', perfumes_fem_id, 4),
    ('Frescos', 'frescos-fem', perfumes_fem_id, 5);
    
    -- Insert subcategories for Cremes e Loções
    INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
    ('Hidratantes Corporais', 'hidratantes-corporais', cremes_id, 1),
    ('Cremes Faciais', 'cremes-faciais', cremes_id, 2),
    ('Loções Pós-Barba', 'locoes-pos-barba', cremes_id, 3),
    ('Óleos Corporais', 'oleos-corporais', cremes_id, 4);
END $$;

-- Create a view for easy category hierarchy access
CREATE OR REPLACE VIEW category_hierarchy AS
SELECT 
    c.id,
    c.name,
    c.slug,
    c.parent_id,
    p.name as parent_name,
    p.slug as parent_slug,
    c.description,
    c.image_url,
    c.sort_order,
    c.is_active,
    CASE 
        WHEN c.parent_id IS NULL THEN c.name
        ELSE p.name || ' > ' || c.name
    END as full_path,
    CASE 
        WHEN c.parent_id IS NULL THEN 0
        ELSE 1
    END as level
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
WHERE c.is_active = true
ORDER BY 
    COALESCE(p.sort_order, c.sort_order),
    c.sort_order;

-- Create a function to get all subcategories for a main category
CREATE OR REPLACE FUNCTION get_subcategories(category_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    slug VARCHAR,
    description TEXT,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.slug, c.description, c.sort_order
    FROM categories c
    WHERE c.parent_id = category_id AND c.is_active = true
    ORDER BY c.sort_order, c.name;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get full category path
CREATE OR REPLACE FUNCTION get_category_path(category_id UUID)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    SELECT full_path INTO result
    FROM category_hierarchy
    WHERE id = category_id;
    
    RETURN COALESCE(result, '');
END;
$$ LANGUAGE plpgsql;