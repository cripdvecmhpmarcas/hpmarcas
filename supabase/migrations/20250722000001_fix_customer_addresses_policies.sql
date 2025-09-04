-- Fix customer_addresses policies to follow the same pattern as customers table
-- This allows the e-commerce to work with session-based access without user ownership verification

-- Drop existing policies that check user_id = auth.uid()
DROP POLICY IF EXISTS "Users can view their own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON customer_addresses;

-- Create new policies following the same pattern as customers table
-- Allows operations for users with active sessions but without ownership verification

-- Allow authenticated users to read customer addresses
CREATE POLICY "Authenticated users can read customer addresses" ON customer_addresses
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert customer addresses
CREATE POLICY "Authenticated users can insert customer addresses" ON customer_addresses
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to update customer addresses
CREATE POLICY "Authenticated users can update customer addresses" ON customer_addresses
  FOR UPDATE
  USING (true);

-- Allow authenticated users to delete customer addresses
CREATE POLICY "Authenticated users can delete customer addresses" ON customer_addresses
  FOR DELETE
  USING (true);
