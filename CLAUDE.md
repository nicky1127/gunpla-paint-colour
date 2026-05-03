# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gunpla is a cross-platform mobile app (iOS/Android/Web) for model builders to manage paint inventories and get AI-powered mixing suggestions for Gundam kit colours. Built with Expo/React Native, backed by Supabase.

## Common Commands

```bash
npm start           # Start Expo dev server
npm run android     # Run on Android emulator/device
npm run ios         # Run on iOS simulator/device
npm run web         # Run in browser
```

To deploy/update Supabase Edge Functions:

```bash
supabase functions deploy <function-name>
```

## Architecture

### Frontend (`/app`, `/components`, `/lib`)

File-based routing via Expo Router. Main tabs are **Projects** and **My Paints**; deep links open individual project and paint detail screens.

- `/app` — screen files (Expo Router pages)
- `/components` — shared UI: `ColourSwatch`, `MixSuggestion`, `PaintCard`
- `/lib/supabase.ts` — Supabase client + all TypeScript database types (`Project`, `ProjectColour`, `PaintInventory`, `MixSuggestion`)
- `/lib/api.ts` — typed wrappers for every Edge Function call (always go through here, never call Edge Functions directly)
- `/lib/colourUtils.ts` — hex/RGB conversion, colour distance, contrast detection

### Backend (`/supabase`)

All AI work (OpenAI GPT-4o) runs server-side in Supabase Edge Functions so API keys are never exposed to the client:

- `kit-lookup` — look up colours for a Gundam kit
- `mix-suggestion` — generate mixing recommendations from owned inventory
- `colour-from-image` — extract dominant/palette colours from a photo
- `scan-paint` — identify a paint pot from a camera image

### Environment Variables

Client-side variables must be prefixed `EXPO_PUBLIC_`. See `.env.example` for required keys (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`). OpenAI key is stored only in Supabase Edge Function secrets.

## Key Conventions

- All database types live in `lib/supabase.ts`; import from there for type safety across the app.
- All Edge Function invocations go through `lib/api.ts`.
- Path alias `@/*` maps to the repo root (configured in `tsconfig.json`).
- Dark theme: background `#1a1a2e`/`#1e1e32`, accent gold `#e8a838`.
- Component size variants use `small | medium | large` props consistently.
