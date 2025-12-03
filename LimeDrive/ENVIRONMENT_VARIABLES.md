# Environment Variables for Lime Drive

## Required for Local Development (.env.local)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server-side Supabase key (for API functions)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Required for Vercel Deployment

Add these environment variables in your Vercel project settings:

### Public Variables (accessible to frontend)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

### Private Variables (server-side only)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep this secret!)

## How to Get These Values

1. **Go to your Supabase Dashboard**
2. **Navigate to Settings > API**
3. **Copy the required values:**
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Security Notes

- ⚠️ **NEVER** commit the service role key to git
- ✅ The service role key should only be used in server-side functions
- ✅ Add `.env.local` to your `.gitignore` file
- ✅ Use Vercel's environment variables for deployment

## Example .env.local file

```bash
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```