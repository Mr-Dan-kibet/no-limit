-- ========================================
-- NO LIMIT — Schema
-- Run this in the Supabase SQL editor
-- ========================================

-- Year cycles (e.g. April 2026 - March 2027)
create table if not exists years (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz default now()
);

-- Goal categories
create table if not exists goal_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  color text,
  year_id uuid references years(id) on delete cascade,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Goals
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references goal_categories(id) on delete cascade,
  year_id uuid references years(id) on delete cascade,
  name text not null,
  detail text,
  status text default 'not-started',
  type text,
  timeline text,
  due_date date,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  status text default 'not-started',
  year_id uuid references years(id) on delete set null,
  goal_id uuid references goals(id) on delete set null,
  color text default '#FF6044',
  created_at timestamptz default now()
);

-- Project milestones
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  due_date date,
  completed boolean default false,
  completed_at timestamptz,
  notes text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Calendar events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  type text default 'event',
  color text default '#FF6044',
  notes text,
  project_id uuid references projects(id) on delete set null,
  goal_id uuid references goals(id) on delete set null,
  recurring text,
  created_at timestamptz default now()
);

-- Checklists
create table if not exists checklists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  frequency text not null,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Checklist completions
create table if not exists checklist_completions (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid references checklists(id) on delete cascade,
  completed_date date not null,
  created_at timestamptz default now(),
  unique(checklist_id, completed_date)
);
