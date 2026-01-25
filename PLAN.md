# Plan: Add Supabase Auth for Multi-User Support

## Goal
Allow multiple users to have their own private task lists. Anyone can sign up and use Taskbed without seeing others' data.

## Current State
- Single hardcoded `user_id: 'default'` for all data
- RLS policy allows all operations (no security)
- No auth UI or session management

## Implementation Plan

### 1. Update Supabase RLS Policy
Run in Supabase SQL Editor:
```sql
-- Drop the permissive policy
DROP POLICY IF EXISTS "Allow all operations" ON taskbed_state;

-- Users can only access their own data
CREATE POLICY "Users can access own data" ON taskbed_state
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
```

### 2. Create Auth Components

**New file: `src/components/Auth.tsx`**
- Login form (email + password)
- Sign up form
- "Forgot password" link
- Loading state during auth check
- Error display

### 3. Update Supabase Client (`src/lib/supabase.ts`)
- Add auth helper functions:
  - `signIn(email, password)`
  - `signUp(email, password)`
  - `signOut()`
  - `getCurrentUser()`
- Export auth state subscription

### 4. Update Store (`src/store/index.ts`)
- Replace `DEFAULT_USER_ID` with dynamic user ID from auth
- Add `setUserId(id)` action
- Update `syncToSupabase()` to use current user ID
- Update `syncFromFile()` to query by current user ID
- Update real-time subscription filter

### 5. Update App (`src/App.tsx`)
- Add auth state check on mount
- Show `<Auth />` component if not logged in
- Show main app if logged in
- Add logout button to sidebar
- Handle auth state changes (login/logout)

### 6. Data Migration for Existing User
- On first login, check if user has data
- If not, offer to import from 'default' user (one-time migration)
- Or start fresh with empty state

### 7. Update MCP Server
After signing up, get your user ID from Supabase (Auth > Users) and add to `mcp-server/.env`:
```
USER_ID=your-auth-user-id-here
```

Update `mcp-server/src/data.ts` to read `USER_ID` from env instead of hardcoded `'default'`.

The MCP server uses the service key (bypasses RLS), so it just needs to know which user_id to query.

## Files to Modify
- `src/lib/supabase.ts` - Add auth functions
- `src/store/index.ts` - Dynamic user ID
- `src/App.tsx` - Auth gate and logout
- `src/components/Auth.tsx` - NEW: Login/signup UI
- `src/App.css` - Auth form styles
- `scripts/supabase-schema.sql` - Updated RLS policy

## Auth Flow
```
App Mount
    ↓
Check supabase.auth.getSession()
    ↓
┌─────────────────┬──────────────────┐
│ No session      │ Has session      │
│ Show <Auth />   │ Set user ID      │
│                 │ Sync from Supabase│
│                 │ Show main app    │
└─────────────────┴──────────────────┘
```

## UI Mockup
```
┌────────────────────────────────────┐
│           Taskbed                  │
│                                    │
│   ┌──────────────────────────┐     │
│   │  Email                   │     │
│   │  [________________]      │     │
│   │                          │     │
│   │  Password                │     │
│   │  [________________]      │     │
│   │                          │     │
│   │  [Sign In]  [Sign Up]    │     │
│   │                          │     │
│   │  Forgot password?        │     │
│   └──────────────────────────┘     │
│                                    │
└────────────────────────────────────┘
```

## Order of Operations
1. Update RLS policy in Supabase (do first - blocks unauthenticated access)
2. Create Auth.tsx component
3. Update supabase.ts with auth helpers
4. Update store with dynamic user ID
5. Update App.tsx with auth gate
6. Update MCP server to read USER_ID from env
7. Test locally
8. Push and verify on Vercel
9. Sign up for your account
10. Get your user ID from Supabase Auth > Users
11. Add USER_ID to mcp-server/.env
12. Run migration script to move 'default' data to your user ID

## Notes
- Supabase Auth is free tier friendly
- Email confirmation can be disabled in Supabase dashboard for easier testing
- Magic link login could be added later as alternative to password
