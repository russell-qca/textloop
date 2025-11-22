-- Create quote_items table for itemized quotes
-- Migration: 015

-- Create quote_items table
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on quote_id for faster lookups
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);

-- Create index on sort_order for ordering
CREATE INDEX idx_quote_items_sort_order ON quote_items(quote_id, sort_order);

-- Add RLS policies for quote_items
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- Allow contractors to view their own quote items
CREATE POLICY "Contractors can view their own quote items"
  ON quote_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.contractor_id = auth.uid()
    )
  );

-- Allow contractors to insert quote items for their quotes
CREATE POLICY "Contractors can insert quote items for their quotes"
  ON quote_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.contractor_id = auth.uid()
    )
  );

-- Allow contractors to update their own quote items
CREATE POLICY "Contractors can update their own quote items"
  ON quote_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.contractor_id = auth.uid()
    )
  );

-- Allow contractors to delete their own quote items
CREATE POLICY "Contractors can delete their own quote items"
  ON quote_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.contractor_id = auth.uid()
    )
  );

-- Allow public read access to quote items for quotes with acceptance tokens
CREATE POLICY "Public can view quote items by acceptance token"
  ON quote_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.acceptance_token IS NOT NULL
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quote_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quote_items_updated_at
  BEFORE UPDATE ON quote_items
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_items_updated_at();

-- Add comment for documentation
COMMENT ON TABLE quote_items IS 'Line items for quotes with description, quantity, and pricing';
COMMENT ON COLUMN quote_items.description IS 'HTML-formatted description of the product/service';
COMMENT ON COLUMN quote_items.quantity IS 'Number of units';
COMMENT ON COLUMN quote_items.unit_price IS 'Price per unit';
COMMENT ON COLUMN quote_items.sort_order IS 'Order of items in the quote (for display)';
