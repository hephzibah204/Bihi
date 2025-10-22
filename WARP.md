# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Dossier.NG (ReportSheet)** - A multi-tenant school management system built with React, TypeScript, Supabase, and Vite. The platform supports subdomain-based or path-based tenant routing, demo mode, and includes AI-powered features via Google Gemini.

## Common Development Commands

### Development
```powershell
# Install dependencies
npm install

# Start development server (runs on port 3002)
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (non-watch mode)
npm run test:run
```

### Code Quality
```powershell
# Lint code
npm run lint

# Lint and auto-fix issues
npm run lint:fix

# Type-check without emitting files
npm run type-check

# Format code with Prettier
npm run format

# Check formatting without changing files
npm run format:check

# Pre-commit checks (lint + format check + type check)
npm run pre-commit
```

### Build & Deploy
```powershell
# Production build
npm run build

# Preview production build locally
npm run preview
```

### Testing Individual Files
```powershell
# Run specific test file
npm test -- <file-path>

# Example:
npm test -- tests/setup.ts
```

## Architecture Overview

### Multi-Tenant System
- **Tenant Isolation**: Each school is a separate tenant identified by subdomain (e.g., `brightstar.yourdomain.com`) or path parameter (`yourdomain.com/?tenant=brightstar`)
- **Tenant Detection**: `utils/subdomain.ts` handles subdomain extraction and validation
- **Demo Mode**: Special tenant that bypasses database with in-memory data (`utils/demoData.ts`)
- **Row-Level Security (RLS)**: Supabase enforces tenant isolation at the database level via `tenant_id` filtering

### Routing & Authentication
- **App Entry**: `App.tsx` - Main router with lazy-loaded components
- **Auth Flow**: `contexts/AuthContext.tsx` manages authentication, tenant validation, and user roles
- **Role-Based Access**: 
  - Super Admin - Platform-wide management at `/controlhub`
  - Admin - School-level administration
  - Teacher - Grade entry, attendance, class management
  - Student - View results, assignments, AI tutor
  - Parent - View child's information, fees, attendance
  - Bursar - Financial management

### Data Layer Architecture
- **Repository Pattern**: `repositories/BaseRepository.ts` provides CRUD operations with built-in caching, retry logic, and tenant filtering
- **API Service**: `services/api.ts` wraps repository calls and handles demo data fallback
- **Supabase Client**: `services/supabaseClient.ts` implements:
  - CDN client priority → npm package fallback → offline mode
  - Connection health monitoring with automatic reconnection
  - Demo mode auth shim
  - Smart retry logic via `utils/retry.ts`

### Resilience & Error Handling
- **Connection Manager**: `utils/connectionManager.ts` monitors network, Supabase, and AI service health
- **Retry Logic**: `utils/retry.ts` provides exponential backoff for network operations
- **Error Parsing**: `utils/errors.ts` standardizes error handling across the application
- **Fallback Systems**: 
  - AI services cascade: Gemini → HuggingFace → Offline fallback
  - Demo mode provides full functionality without backend
  - Offline mode allows graceful degradation

### AI Integration
- **Service Abstraction**: `services/aiService.ts` provides unified interface for multiple AI providers
- **Primary Service**: Google Gemini via `services/geminiAIService.ts`
- **Fallback Chain**: `services/fallbackAiService.ts` manages cascading fallbacks
- **Features**: Academic tutoring, timetable generation, lesson planning, student analytics

### State Management
- **Context Providers**:
  - `AuthContext` - User authentication and tenant state
  - `TenantContext` - Tenant-specific configuration
  - `PlanFeaturesContext` - Feature flag management per subscription tier

## Key Patterns & Conventions

### TypeScript Configuration
- **Strict Mode**: Enabled with additional checks (`noUnusedLocals`, `noImplicitReturns`, `noUncheckedIndexedAccess`)
- **Path Alias**: `@/` maps to project root for imports
- **React JSX**: Uses automatic runtime (`react-jsx`)

### Component Organization
- **Lazy Loading**: Major route components are lazy-loaded for performance
- **Dashboard Views**: Different dashboards per role (Admin, Teacher, Student, Parent)
- **Bottom Navigation**: Mobile-friendly navigation in `BottomNavBar.tsx` components

### Database Queries
- **Always Apply Tenant Filter**: Use `applyTenantFilter()` from `BaseRepository` for multi-tenant queries
- **Pagination**: Use `limit` and `offset` parameters for large datasets
- **Caching**: Queries are automatically cached via `utils/cache.ts` with configurable TTL
- **Query Building**: `utils/queryBuilder.ts` provides chainable query construction

### Environment Variables
- **Required**:
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY` - Client key
- **Domain Configuration**:
  - `VITE_ROOT_DOMAINS` - Comma-separated list of root domains
  - `VITE_USE_SUBDOMAINS` - Enable subdomain-based routing (true/false)
  - `VITE_PROTOCOL` - http: or https:
- **Optional**:
  - `GEMINI_API_KEY` - For AI features
  - `VITE_USE_LOCAL_API` - Enable local API proxy (dev only)

### Testing Strategy
- **Framework**: Vitest with jsdom environment
- **Setup**: `tests/setup.ts` configures global test environment
- **Component Tests**: Use React Testing Library patterns
- **Run Location**: Execute test commands from project root

## Important Development Notes

### Multi-Tenant Development
- Always include `tenant_id` in queries when working with tenant-scoped data
- Test both subdomain and query parameter routing modes
- Demo mode (`/demo`) bypasses tenant requirements for testing

### AI Service Development
- Check service availability via `getAIService().getStatus()`
- Services auto-fallback on failure - no manual switching required
- Test offline behavior by simulating network failures

### Database Changes
- Migrations go in `supabase/migrations/`
- Always include RLS policies for new tables
- Test queries with and without tenant context

### Connection Resilience
- Never assume database availability - always handle offline scenarios
- Use `withRetry()` for network-dependent operations
- Connection status visible via `ConnectionStatusBar` component

### Linting & Type-Checking
- Run `npm run pre-commit` before committing changes
- ESLint configured for React, TypeScript, and accessibility
- Unused parameters prefixed with underscore are allowed

## File Structure Reference

```
components/         - React UI components (Admin, Teacher, Student, Parent dashboards)
contexts/          - React Context providers (Auth, Tenant, Features)
functions/         - Serverless functions (API endpoints)
hooks/             - Custom React hooks
pages/             - Route-level page components
repositories/      - Database repository classes (BaseRepository pattern)
services/          - External service integrations (Supabase, AI, API)
supabase/          - Database migrations and schema
tests/             - Test files and test setup
types/             - TypeScript type definitions
utils/             - Utility functions (retry, cache, errors, subdomain, etc.)
```

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions.

**Quick Deploy Checklist**:
1. Set production environment variables
2. Configure domain/subdomain DNS (wildcard for subdomains)
3. Run `npm run build`
4. Deploy `dist/` folder to hosting platform
5. Verify tenant routing and database connectivity

**Supported Platforms**: Cloudflare Pages, Vercel, Netlify, traditional hosting
