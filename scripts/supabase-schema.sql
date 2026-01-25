-- Supabase Schema for Taskbed
-- Run this in the Supabase SQL Editor to create the required table

-- Create the taskbed_state table
-- This stores the entire application state as JSONB for simple sync
CREATE TABLE IF NOT EXISTS taskbed_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE DEFAULT 'default',
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_taskbed_state_user_id ON taskbed_state(user_id);

-- Enable Row Level Security
ALTER TABLE taskbed_state ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations with anon key
-- This is a simple setup for personal use - for production with multiple users,
-- you would want to restrict access based on authenticated user
CREATE POLICY "Allow all operations" ON taskbed_state
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable realtime for cross-device sync
ALTER PUBLICATION supabase_realtime ADD TABLE taskbed_state;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on any update
CREATE TRIGGER update_taskbed_state_updated_at
  BEFORE UPDATE ON taskbed_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
