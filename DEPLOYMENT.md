# 🚀 Production Deployment Guide

## Overview
This guide covers deploying Dossier.NG to production on any domain with flexible multi-tenant support.

## ✅ Pre-Deployment Checklist

### 1. Database Setup
- ✅ Supabase project configured
- ✅ Database schema deployed
- ✅ Row Level Security (RLS) policies enabled
- ✅ Service role key secured (server-side only)

### 2. Domain Configuration
- ✅ Domain/subdomain DNS configured
- ✅ SSL certificate configured
- ✅ Environment variables set

### 3. Environment Variables
- ✅ Production `.env` file created
- ✅ All required variables populated
- ✅ Development settings disabled

## 🌐 Domain Configuration Options

### Option 1: Subdomain-based Tenants (Recommended)
```bash
# .env.production
VITE_ROOT_DOMAINS=myschoolapp.com
VITE_USE_SUBDOMAINS=true

# Result:
# - Landing: myschoolapp.com
# - School 1: brightstar.myschoolapp.com  
# - School 2: riverside.myschoolapp.com
```

### Option 2: Query Parameter Tenants
```bash
# .env.production
VITE_ROOT_DOMAINS=myschoolapp.com
VITE_USE_SUBDOMAINS=false

# Result:
# - Landing: myschoolapp.com
# - School 1: myschoolapp.com/?tenant=brightstar
# - School 2: myschoolapp.com/?tenant=riverside
```

### Option 3: Multiple Domains
```bash
# .env.production
VITE_ROOT_DOMAINS=myschoolapp.com,schoolportal.org,education-hub.net
VITE_USE_SUBDOMAINS=true

# Result: Works on all configured domains
```

## 🔧 Environment Configuration

### Required Variables
```bash
# Database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...your-key

# Domain
VITE_ROOT_DOMAINS=yourdomain.com
VITE_USE_SUBDOMAINS=true
VITE_PROTOCOL=https:
```

### Optional Variables
```bash
# AI Features
GEMINI_API_KEY=your-gemini-key

# Preview/Development
VITE_PREVIEW_DOMAIN=yourapp.pages.dev
```

## 📦 Build Process

### Standard Build
```bash
npm run build
```

### Production Optimized Build
```bash
# Ensure production environment
NODE_ENV=production npm run build

# The build process automatically:
# - Excludes development proxy
# - Optimizes bundle size
# - Splits vendor chunks
# - Minifies code
```

## 🌍 Deployment Platforms

### Cloudflare Pages
1. Connect repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Configure environment variables in dashboard
5. Set up custom domain (optional)

### Vercel
1. Import project
2. Configure environment variables
3. Deploy
4. Set up custom domain (optional)

### Netlify
1. Connect repository
2. Build settings: `npm run build` → `dist`
3. Configure environment variables
4. Deploy
5. Set up custom domain (optional)

### Traditional Hosting
1. Build locally: `npm run build`
2. Upload `dist` folder contents
3. Configure web server (Apache/Nginx)
4. Set up SSL certificate

## 🔐 Security Configuration

### DNS Setup for Subdomains
```dns
# A Records
myschoolapp.com          → Your server IP
*.myschoolapp.com        → Your server IP (wildcard)

# Or CNAME for hosted solutions
myschoolapp.com          → your-app.pages.dev
*.myschoolapp.com        → your-app.pages.dev
```

### Web Server Configuration (Nginx)
```nginx
server {
    listen 443 ssl;
    server_name ~^(?<tenant>.+)\.myschoolapp\.com$;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
```

## 🧪 Testing Deployment

### 1. Test Domain Detection
```javascript
// Browser console
console.log(window.location.hostname);
// Should match your configured domain
```

### 2. Test Tenant Detection
```javascript
// Browser console - on subdomain
console.log(getSubdomain()); 
// Should return tenant name

// Browser console - with query param
console.log(getSubdomain()); 
// Should return tenant from ?tenant= parameter
```

### 3. Test Demo Mode
- Visit `/demo` - should enter demo mode
- Should work regardless of domain configuration

## 🚨 Common Issues & Solutions

### Issue: Subdomains not working
**Solution**: Check DNS wildcard configuration and web server setup

### Issue: Demo mode not working
**Solution**: Demo mode is independent of domain config - check for JavaScript errors

### Issue: Environment variables not loading
**Solution**: Ensure variables start with `VITE_` and are properly set in build environment

### Issue: API calls failing
**Solution**: Check CORS settings in Supabase and verify URLs

## 🎯 Production Checklist

- [ ] Database configured and RLS enabled
- [ ] Environment variables set correctly
- [ ] Domain/DNS configured
- [ ] SSL certificate installed
- [ ] Build process successful
- [ ] Demo mode working
- [ ] Tenant detection working
- [ ] Multi-tenancy isolation verified
- [ ] Performance optimized
- [ ] Security headers configured

## 📞 Support

The application is designed to work on any domain with proper configuration. Key features:
- ✅ Domain-agnostic architecture
- ✅ Flexible tenant detection
- ✅ Production-ready build process
- ✅ Comprehensive error handling
- ✅ Demo mode for marketing

For deployment issues, check:
1. Environment variable configuration
2. DNS/domain setup
3. Build process logs
4. Browser console for errors