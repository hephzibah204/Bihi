# PowerShell Environment Setup Script for Bihi Project
# This script sets environment variables and starts the development server

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Bihi Project - Environment Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists (recommended approach)
if (Test-Path ".env.local") {
    Write-Host "✓ Found .env.local file - Vite will load variables from there" -ForegroundColor Green
    Write-Host ""
    Write-Host "Starting development server..." -ForegroundColor Yellow
    npm run dev
    exit
}

Write-Host "No .env.local file found. Choose an option:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Run in DEMO MODE (no Supabase needed)" -ForegroundColor White
Write-Host "2. Set Supabase credentials interactively" -ForegroundColor White
Write-Host "3. Exit and create .env.local manually" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting in DEMO MODE..." -ForegroundColor Green
        $env:VITE_DEMO_MODE = "true"
        npm run dev
    }
    "2" {
        Write-Host ""
        Write-Host "Enter your Supabase credentials:" -ForegroundColor Yellow
        Write-Host ""
        
        $supabaseUrl = Read-Host "Supabase URL (e.g., https://xxx.supabase.co)"
        $supabaseKey = Read-Host "Supabase Anon Key"
        
        if ([string]::IsNullOrWhiteSpace($supabaseUrl) -or [string]::IsNullOrWhiteSpace($supabaseKey)) {
            Write-Host ""
            Write-Host "✗ Error: URL and Key are required!" -ForegroundColor Red
            Write-Host "Falling back to DEMO MODE..." -ForegroundColor Yellow
            $env:VITE_DEMO_MODE = "true"
        } else {
            $env:VITE_SUPABASE_URL = $supabaseUrl
            $env:VITE_SUPABASE_ANON_KEY = $supabaseKey
            Write-Host ""
            Write-Host "✓ Credentials set!" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "Optional: Enter AI API Keys (press Enter to skip)" -ForegroundColor Cyan
        $geminiKey = Read-Host "Gemini API Key (optional)"
        $hfKey = Read-Host "Hugging Face API Key (optional)"
        
        if (![string]::IsNullOrWhiteSpace($geminiKey)) {
            $env:VITE_GEMINI_API_KEY = $geminiKey
        }
        if (![string]::IsNullOrWhiteSpace($hfKey)) {
            $env:VITE_HUGGINGFACE_API_KEY = $hfKey
        }
        
        Write-Host ""
        Write-Host "Starting development server..." -ForegroundColor Yellow
        npm run dev
    }
    "3" {
        Write-Host ""
        Write-Host "Create a .env.local file with your credentials:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "VITE_SUPABASE_URL=https://your-project.supabase.co" -ForegroundColor Gray
        Write-Host "VITE_SUPABASE_ANON_KEY=your_anon_key_here" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Then run: npm run dev" -ForegroundColor White
        Write-Host ""
        Write-Host "See ENVIRONMENT_SETUP.md for detailed instructions." -ForegroundColor Cyan
    }
    default {
        Write-Host ""
        Write-Host "✗ Invalid choice. Exiting..." -ForegroundColor Red
    }
}
