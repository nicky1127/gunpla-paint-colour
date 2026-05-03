# Gunpla — Gunpla Paint Colour Assistant

A cross-platform mobile app (iPad-first, also runs on iPhone and as a web app) for Gunpla model builders to manage paint inventories and get AI-powered colour lookup and mixing guidance.

---

## What this app does

### 1. Projects

- User creates a project and enters a Gundam kit name or code (e.g. "RX-78-2 Gundam MG 1/100")
- AI (GPT-4o) searches its knowledge of kit manuals, Bandai instructions, and community guides to retrieve the full colour list for that kit
- Colours are displayed as a palette with swatches, names, and hex codes
- User can add custom colours if the AI palette is missing anything — input accepts:
  - Descriptive text (e.g. "dark metallic grey")
  - Hex or RGB code
  - A photo (camera or gallery) with three extraction modes:
    - Dominant colour — single most prominent colour
    - Palette — up to 5 distinct colours
    - Tap-to-sample — tap a spot on the image to sample that area
- Tapping any colour in a project opens an AI mixing suggestion sheet

### 2. Paint Inventory (global, shared across all projects)

- A central section where the user tracks all paints they physically own
- Supports any brand; quick-select chips for: Mr. Hobby, Tamiya, Vallejo, AK Interactive, GSI Creos, Citadel
- Three ways to add paints:
  1. Manual entry — type brand, code, name, optional hex
  2. Browse catalogue — searchable static list of Mr. Hobby and Tamiya paints; tick to add multiple at once
  3. Scan paint pot — take/upload a photo, GPT-4o vision identifies brand/code/name; user can edit before saving
- Long-press a paint to remove it

### 3. AI Mixing Guidance (core feature)

- For each colour in a project, AI:
  1. First tries to produce a mixing recipe using only paints the user already owns (with ratios in %)
  2. If no good match exists in inventory, suggests specific paints to buy from major brands
- Output shown in a bottom sheet with colour swatches, brand, code, name, and ratio

---

## Tech stack

| Layer          | Technology                                                   |
| -------------- | ------------------------------------------------------------ |
| App framework  | React Native + Expo SDK 54 (TypeScript)                      |
| Navigation     | Expo Router (file-based, tab + stack)                        |
| Database       | Supabase (PostgreSQL, free tier)                             |
| AI             | OpenAI GPT-4o (vision + reasoning)                           |
| AI backend     | Supabase Edge Functions (Deno) — API key never in the app    |
| Image handling | expo-image-picker, expo-camera                               |
| Storage        | @react-native-async-storage/async-storage (Supabase session) |

---

## Project structure

```
gunpla-paint-colour/
├── app/
│   ├── _layout.tsx                      # Root layout (StatusBar)
│   └── (tabs)/
│       ├── _layout.tsx                  # Tab bar (Projects + My Paints)
│       ├── projects/
│       │   ├── index.tsx                # Project list screen
│       │   ├── new.tsx                  # Create project + AI kit lookup
│       │   ├── [id].tsx                 # Project detail + colour palette + mix modal
│       │   └── add-colour.tsx           # Add custom colour (text / hex / photo)
│       └── inventory/
│           ├── index.tsx                # Paint inventory list + brand filter
│           ├── add-manual.tsx           # Manual paint entry
│           ├── add-scan.tsx             # Camera scan paint pot (AI vision)
│           └── catalogue.tsx            # Browse brand catalogue, tick to add
├── components/
│   ├── ColourSwatch.tsx                 # Colour swatch with name/hex/source badge
│   ├── PaintCard.tsx                    # Paint inventory row card
│   └── MixSuggestion.tsx               # AI mixing result display
├── lib/
│   ├── supabase.ts                      # Supabase client + all TypeScript DB types
│   ├── api.ts                           # Typed wrappers for all Edge Function calls
│   ├── colourUtils.ts                   # hex/RGB conversion, colour distance, contrast
│   └── responsive.ts                    # useResponsive() hook (iPad vs phone scaling)
├── assets/
│   └── paint-catalogues/
│       ├── index.ts                     # Exports CATALOGUES array
│       ├── mr-hobby.json                # Mr. Hobby paint list (C-series, GX-series)
│       └── tamiya.json                  # Tamiya paint list (XF-series, X-series)
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 001_initial_schema.sql       # All 4 tables + indexes
│   └── functions/
│       ├── kit-lookup/index.ts          # GPT-4o: kit name → colour list
│       ├── mix-suggestion/index.ts      # GPT-4o: target colour + inventory → mix recipe
│       ├── scan-paint/index.ts          # GPT-4o vision: paint pot photo → brand/code/name
│       └── colour-from-image/index.ts   # GPT-4o vision: photo → hex colour(s)
├── .env                                 # EXPO_PUBLIC_SUPABASE_URL + ANON_KEY (not committed)
├── .env.example                         # Template for .env
├── app.json
├── babel.config.js
├── package.json
└── tsconfig.json
```

---

## Database schema (Supabase / PostgreSQL)

```sql
-- One row per Gunpla build project
projects (
  id          uuid primary key,
  name        text not null,          -- user-given project name
  kit_name    text,                   -- e.g. "RX-78-2 Gundam MG 1/100"
  kit_code    text,                   -- e.g. "MG-001"
  created_at  timestamptz
)

-- Colours belonging to a project
project_colours (
  id           uuid primary key,
  project_id   uuid → projects(id),
  colour_name  text not null,
  hex          text,                  -- nullable; may be unknown
  source       text,                  -- 'ai' | 'manual' | 'image'
  notes        text,
  created_at   timestamptz
)

-- Global paint inventory (shared across all projects)
paint_inventory (
  id          uuid primary key,
  brand       text not null,          -- e.g. "Mr. Hobby"
  code        text,                   -- e.g. "C-8"
  name        text not null,          -- e.g. "Silver"
  hex         text,
  created_at  timestamptz
)

-- Cached AI mixing suggestions
mix_suggestions (
  id                 uuid primary key,
  project_colour_id  uuid → project_colours(id),
  suggestion_json    jsonb,           -- MixSuggestionData shape
  created_at         timestamptz
)
```

Migration file: `supabase/migrations/001_initial_schema.sql`
Run it by pasting into the Supabase dashboard SQL editor and executing.

---

## AI integration architecture

All OpenAI calls are proxied through Supabase Edge Functions. The OpenAI API key is **never in the React Native app**.

```
App  →  supabase.functions.invoke(...)  →  Edge Function (Deno)  →  OpenAI API
```

The app authenticates to Supabase with the anon key (safe to include).
The OpenAI key is stored as a Supabase secret.

### Edge Function summary

| Function            | Input                        | GPT-4o task                                      |
| ------------------- | ---------------------------- | ------------------------------------------------ |
| `kit-lookup`        | kit_name, kit_code           | Returns colour list from kit manual knowledge    |
| `mix-suggestion`    | target colour + owned paints | Mixing recipe from inventory, or buy suggestions |
| `scan-paint`        | base64 image                 | Identifies brand/code/name of a paint pot        |
| `colour-from-image` | base64 image + mode          | Extracts hex colour(s) from a reference photo    |

All functions return JSON and include CORS headers for Expo dev client compatibility.

---

## Design conventions

- **Dark theme**: background `#12121f` (deepest) / `#1a1a2e` (header) / `#1e1e32` (card)
- **Accent**: gold `#e8a838`
- **Secondary text**: `#aaa`, muted `#888`, code `#666`
- **Source badges**: blue = AI, green = manual, purple = image
- **Responsive**: `useResponsive()` in `lib/responsive.ts` — spacing and font scales up 1.4× / 1.15× on tablet (≥768px width); catalogue uses 2 columns on iPad
- **Component size prop**: `small | medium | large` used consistently on `ColourSwatch`
- **Types**: all DB types in `lib/supabase.ts`; all Edge Function call wrappers in `lib/api.ts` — never call Edge Functions directly from screens

---

## Environment variables

```
# .env (not committed — see .env.example)
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

The OpenAI API key goes in Supabase secrets only:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

---

## Setup checklist (for a new developer or fresh machine)

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

- Go to https://supabase.com → New project (free tier is sufficient)
- Copy **Project URL** and **anon public key** from Settings → API
- Paste them into `.env`

> **Already done** — Supabase project is created and `.env` is filled in.

### 3. Run the database migration

- Open Supabase dashboard → SQL Editor
- Paste the contents of `supabase/migrations/001_initial_schema.sql`
- Click Run

### 4. Get an OpenAI API key

- Sign up at https://platform.openai.com
- Add a payment method (pay-per-use; personal use costs cents per session)
- Create an API key under API Keys

### 5. Deploy Edge Functions

```bash
# Install Supabase CLI if not already installed
brew install supabase/tap/supabase

# Link to your project (get project ref from Supabase dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF

# Set the OpenAI key as a secret (never committed to git)
supabase secrets set OPENAI_API_KEY=sk-...

# Deploy all four functions
supabase functions deploy kit-lookup
supabase functions deploy mix-suggestion
supabase functions deploy scan-paint
supabase functions deploy colour-from-image
```

### 6. Run the app

```bash
npm start
# Press i for iOS Simulator, or scan QR code with Expo Go on iPad
```

---

## Current status

All screens and logic are implemented. The app runs on Expo SDK 54.

**Done:**

- Supabase project created ✓
- `.env` filled in with Supabase URL and anon key ✓
- `lib/responsive.ts` exists and is in use (`catalogue.tsx` already uses `useResponsive()` for iPad-aware layout) ✓
- App starts successfully with `npm start` ✓

**Remaining before full AI features work:**

- [ ] Run database migration — open Supabase dashboard → SQL Editor → paste `supabase/migrations/001_initial_schema.sql` → Run
- [ ] Obtain OpenAI API key from https://platform.openai.com
- [ ] Set key as Supabase secret: `supabase secrets set OPENAI_API_KEY=sk-...`
- [ ] Deploy Edge Functions: `supabase functions deploy kit-lookup` (and the other 3)

**Phase 5 (polish) not yet started:**

- iPad split-view layout for project detail (sidebar + detail pane)
- Extend `useResponsive()` to remaining screens (currently only `catalogue.tsx` uses it)
- Error boundary / global error state
- Offline graceful degradation (detect no network, disable AI buttons)
- Loading skeletons for lists

---

## Known decisions and trade-offs

- **No user authentication** — app is single-user (personal use). All data is unscoped. If you later want multi-user or sync across devices, add Supabase Auth and add `user_id` columns to all tables.
- **Mix suggestions are not cached** — each tap on a colour triggers a fresh GPT-4o call. To cache, insert results into `mix_suggestions` table and check there first before calling the Edge Function.
- **Paint catalogues are static JSON** — Mr. Hobby and Tamiya only. To add more brands, add a JSON file under `assets/paint-catalogues/` and register it in `assets/paint-catalogues/index.ts`.
- **Tap-to-sample colour** in the Add Colour screen sends tap coordinates as a percentage to GPT-4o; it is an approximation, not a true pixel-level colour picker. For pixel-exact sampling, a native colour picker or canvas-based solution would be needed.
- **SDK 54** — the blank template initially installed SDK 53; manually upgraded to `expo@~54.0.0` to match Expo Go.
