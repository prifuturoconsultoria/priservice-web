# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 service sheet management system built with TypeScript and React 19. The application allows technicians to create service sheets that require client approval via email tokens.

## IMPORTANT: Backend Migration

**This project is migrating from Supabase to a Spring Boot API backend.**

- **DO NOT use Supabase** for new features or changes
- **DO NOT import from** `@/utils/supabase/client.ts` or `@/utils/supabase/server.ts` in new code
- **DO NOT call Supabase directly** — all data should go through the Spring Boot API
- The backend API URL is configured via `NEXT_PUBLIC_BACKEND_URL` environment variable
- Authentication is handled via **Azure AD OAuth** with JWT tokens stored in HTTP-only cookies
- API calls from client components go through `@/lib/service-sheets-api.ts`
- Server-side auth uses `@/lib/auth.ts` (reads JWT from cookies, no Supabase involved)
- Legacy Supabase code in `@/lib/supabase.ts` still exists but should be replaced over time

## Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
pnpm dev            # Alternative with pnpm

# Build & Production
npm run build       # Build for production
npm run start       # Start production server

# Code Quality
npm run lint        # Run ESLint (ignores errors during builds)
```

Note: The project has `ignoreDuringBuilds: true` and `ignoreBuildErrors: true` in next.config.mjs, so lint/type errors won't block builds.

## Architecture & Key Components

### Authentication
- **Azure AD OAuth**: Microsoft login via `@/lib/azure-auth.ts`
- **JWT tokens**: Stored in HTTP-only cookies via `/api/sync-tokens`
- **Server auth**: `@/lib/auth.ts` — `getUser()` reads and verifies JWT from cookies
- **Client auth**: `@/contexts/auth-context.tsx` — `useAuth()` hook, user stored in sessionStorage
- **Auth callback**: `/app/auth/callback/page.tsx` handles OAuth redirect

### Backend API (Spring Boot)
- **Base URL**: `NEXT_PUBLIC_BACKEND_URL` environment variable
- **Client-side API**: `@/lib/service-sheets-api.ts` — all CRUD operations via fetch
- **Server-side legacy**: `@/lib/supabase.ts` — being migrated away from

### Application Structure
- **UI Components**: shadcn/ui components in `/components/ui/`
- **Pages**: App Router structure in `/app/`
  - `/service-sheets/` - CRUD operations
  - `/approval/[token]/` - Client approval interface
  - `/projects/` - Project management
  - `/reports/` - Reporting dashboard

### Key Features
- **Service Sheet Creation**: Form with technician and client details
- **Approval Workflow**: Email-based approval using tokens
- **Status Management**: pending → approved/rejected
- **Project Hours Tracking**: Track used/available hours per project

### UI Framework
- **shadcn/ui**: Component library with Radix UI primitives
- **Tailwind CSS**: Styling with CSS variables for theming
- **Sidebar Layout**: Global sidebar navigation with SidebarProvider
- **Theme**: Uses CSS custom properties for colors and spacing

## Path Aliases
- `@/*` maps to root directory
- `@/components` for UI components
- `@/lib` for utilities
- `@/contexts` for React contexts

## Development Notes
- Uses pnpm as package manager (has pnpm-lock.yaml)
- Next.js 15 with React 19 and App Router
- TypeScript strict mode enabled
- Images are unoptimized in config
- Form validation with react-hook-form and zod
- App language is Portuguese (Mozambique market)
