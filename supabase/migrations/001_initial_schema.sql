-- Gunpla: Gunpla Paint Colour Assistant
-- Initial schema

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kit_name text,
  kit_code text,
  created_at timestamptz default now()
);

create table if not exists project_colours (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  colour_name text not null,
  hex text,
  source text not null default 'manual' check (source in ('ai', 'manual', 'image')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists paint_inventory (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  code text,
  name text not null,
  hex text,
  created_at timestamptz default now()
);

create table if not exists mix_suggestions (
  id uuid primary key default gen_random_uuid(),
  project_colour_id uuid not null references project_colours(id) on delete cascade,
  suggestion_json jsonb not null,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index if not exists project_colours_project_id_idx on project_colours(project_id);
create index if not exists mix_suggestions_colour_id_idx on mix_suggestions(project_colour_id);
create index if not exists paint_inventory_brand_idx on paint_inventory(brand);
