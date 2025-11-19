# Environment Variable Setup Guide

This application now reads credentials from system environment variables instead of hardcoded values in `.env` files.

## Why This Approach?

- **Security**: Credentials are never committed to version control
- **Flexibility**: Different values for development, staging, and production
- **Best Practice**: Industry standard for managing secrets

## Windows Setup (Your Current OS)

### Option 1: PowerShell (Recommended for Development)

Create a file named `setup-env.ps1` in your project root and run it before starting the dev server:

```powershell
# Set Supabase credentials
$env:VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="your_anon_key_here"

# Set AI API Keys (optional)
$env:VITE_GEMINI_API_KEY="your_gemini_key_here"
$env:VITE_HUGGINGFACE_API_KEY="your_huggingface_key_here"

# Start the dev server
npm run dev
```

Then run:
```powershell
.\setup-env.ps1
```

### Option 2: Set Permanent System Environment Variables

1. Open Start Menu → Search "Environment Variables"
2. Click "Edit the system environment variables"
3. Click "Environment Variables" button
4. Under "User variables", click "New"
5. Add each variable:
   - Variable name: `VITE_SUPABASE_URL`
   - Variable value: `https://your-project-ref.supabase.co`
6. Restart your terminal/IDE

### Option 3: Use .env.local (Git-Ignored)

Create a `.env.local` file (already in .gitignore) with actual values:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_GEMINI_API_KEY=your_gemini_key_here
```

Vite automatically loads `.env.local` and it takes precedence over `.env`.

## Demo Mode (No Supabase Required)

If you don't have Supabase credentials yet, you can run in demo/offline mode:

```powershell
$env:VITE_DEMO_MODE="true"
npm run dev
```

## Production Deployment

### Vercel
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable with appropriate values
4. Redeploy

### Netlify
1. Site Settings → Environment Variables
2. Add each variable
3. Redeploy

### Other Platforms
Consult your platform's documentation for setting environment variables.

## Quick Start Commands

```powershell
# Development with environment variables
$env:VITE_SUPABASE_URL="https://xxx.supabase.co"; $env:VITE_SUPABASE_ANON_KEY="xxx"; npm run dev

# Development in demo mode (no Supabase needed)
$env:VITE_DEMO_MODE="true"; npm run dev
```

## Verifying Configuration

After setting variables, verify they're loaded:

```powershell
# Check if variable is set
echo $env:VITE_SUPABASE_URL

# Or in Node/Vite
# Variables prefixed with VITE_ are exposed to the client
# Access via import.meta.env.VITE_SUPABASE_URL
```

## Security Notes

- ✅ NEVER commit `.env.local` or files with real credentials
- ✅ Use `VITE_` prefix for client-side variables
- ✅ Keep service role keys server-side only
- ✅ Rotate keys if accidentally exposed

## Need Help?

If you encounter issues:
1. Restart your terminal after setting environment variables
2. Verify variables are set: `echo $env:VARIABLE_NAME`
3. Check `.env.local` is in the same directory as `package.json`
4. Make sure you're using PowerShell (not CMD) for the `$env:` syntax
