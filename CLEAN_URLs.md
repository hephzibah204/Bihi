# Clean URL Implementation

This document explains the clean URL implementation that eliminates query parameters (`?tenant=name`) in favor of path-based routing.

## URL Formats

### Before (with query parameters)
```
https://myschoolapp.com/?tenant=brightstar
https://localhost:3000/?tenant=brightstar
```

### After (clean URLs)
```
https://myschoolapp.com/brightstar
https://localhost:3000/brightstar
https://brightstar.myschoolapp.com (subdomain still supported)
```

## How It Works

### 1. Tenant Detection Priority

The system now detects tenants in this order:

1. **Subdomain-based** (production preferred)
   - `brightstar.myschoolapp.com` → `brightstar`
   - `school1.localhost` → `school1`

2. **Path-based** (clean URLs)
   - `myschoolapp.com/brightstar` → `brightstar`
   - `localhost:3000/brightstar` → `brightstar`
   - `myschoolapp.com/brightstar/dashboard` → `brightstar`

3. **Query parameter** (fallback for backward compatibility)
   - `myschoolapp.com/?tenant=brightstar` → `brightstar`

### 2. URL Generation

When generating portal URLs:
- **Production domains with subdomains enabled**: `https://tenant.domain.com`
- **All other cases**: `https://domain.com/tenant`

### 3. Routing Structure

```typescript
// Root routes (no tenant)
/                    → Landing page
/demo               → Demo mode
/signin             → Central login
/signup             → Subscription page

// Clean tenant routes
/brightstar         → Brightstar school portal
/brightstar/*       → All tenant sub-routes
/riverside/students → Riverside school students page
```

## Benefits

✅ **SEO-friendly**: Clean URLs are better for search engines  
✅ **User-friendly**: Easier to read and share  
✅ **Professional**: No query parameters in URLs  
✅ **Backward compatible**: Still supports query parameters  
✅ **Flexible**: Works with both subdomains and paths  

## Testing

### Manual Testing
1. Test subdomain access: `tenant.yourdomain.com`
2. Test clean path access: `yourdomain.com/tenant`
3. Test nested routes: `yourdomain.com/tenant/dashboard`
4. Verify fallback: `yourdomain.com/?tenant=name`

### Automated Testing
```javascript
// In browser console
testDomainConfig()  // Run all URL tests
getDomainStatus()   // Check current detection
```

## Migration Notes

### For Users
- Old bookmark URLs with `?tenant=name` still work
- New sharing URLs are automatically clean: `/tenant-name`

### For Developers  
- No code changes needed in components
- `getSubdomain()` automatically handles all URL formats
- `getPortalUrl()` generates clean URLs by default

## Configuration

Control URL behavior via environment variables:

```env
# Enable/disable subdomain support
VITE_USE_SUBDOMAINS=true

# Configure domains that support subdomains  
VITE_ROOT_DOMAINS=myschoolapp.com,localhost

# Protocol for URL generation
VITE_PROTOCOL=https:
```

## Examples

### Development
```
localhost:3000/brightstar          ✅ Clean path
brightstar.localhost              ✅ Subdomain  
localhost:3000/?tenant=brightstar ✅ Fallback
```

### Production
```
myschoolapp.com/brightstar          ✅ Clean path
brightstar.myschoolapp.com          ✅ Subdomain (preferred)
myschoolapp.com/?tenant=brightstar  ✅ Fallback
```

The implementation automatically chooses the best URL format for each environment while maintaining full backward compatibility.