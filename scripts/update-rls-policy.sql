-- Run this in Supabase SQL Editor to enable auth-based access control

-- Drop the permissive policy
DROP POLICY IF EXISTS "Allow all operations" ON taskbed_state;

-- Users can only access their own data
CREATE POLICY "Users can access own data" ON taskbed_state
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
