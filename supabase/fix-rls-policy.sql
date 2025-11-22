-- Fix RLS Policy for Contractors Table
-- Run this in your Supabase SQL Editor

-- Add INSERT policy for contractors table to allow new signups
CREATE POLICY "Allow users to insert their own contractor record"
  ON contractors FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);
