# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 service sheet management system built with TypeScript, React 19, and Supabase. The application allows technicians to create service sheets that require client approval via email tokens.

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

### Database Layer (Supabase)
- **Main table**: `service_sheets` with approval workflow
- **Key fields**: approval_token (UUID), status (pending/approved/rejected)
- **RLS enabled**: Row Level Security policies allow all operations
- **Scripts**: Database schema in `/scripts/` directory

### Application Structure
- **Server Actions**: `/lib/supabase.ts` - all database operations
- **UI Components**: shadcn/ui components in `/components/ui/`
- **Pages**: App Router structure in `/app/`
  - `/service-sheets/` - CRUD operations
  - `/approval/[token]/` - Client approval interface
  - `/reports/` - Reporting dashboard

### Key Features
- **Service Sheet Creation**: Form with technician and client details
- **Approval Workflow**: Email-based approval using tokens
- **Status Management**: pending → approved/rejected
- **Reports Dashboard**: View all service sheets

### Supabase Configuration
- **Client**: Browser client in `/utils/supabase/client.ts`
- **Server**: SSR client in `/utils/supabase/server.ts`
- **Environment Variables**: Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

### UI Framework
- **shadcn/ui**: Component library with Radix UI primitives
- **Tailwind CSS**: Styling with CSS variables for theming
- **Sidebar Layout**: Global sidebar navigation with SidebarProvider
- **Theme**: Uses CSS custom properties for colors and spacing

## Path Aliases
- `@/*` maps to root directory
- `@/components` for UI components
- `@/lib` for utilities
- `@/utils` for Supabase clients

## Development Notes
- Uses pnpm as package manager (has pnpm-lock.yaml)
- Next.js 15 with React 19 and App Router
- TypeScript strict mode enabled
- Images are unoptimized in config
- Form validation with react-hook-form and zod