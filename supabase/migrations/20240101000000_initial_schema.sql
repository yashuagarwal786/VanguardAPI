-- ==============================================================================
-- SentinelAPI — Production Supabase Database Schema & RLS Policies
-- ==============================================================================

-- 1. Profiles Table (Synchronized with auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  accepted_terms_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. API Targets Table (Requires Domain Ownership Verification before scanning)
create table if not exists public.targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  base_url text not null,
  spec_url text,
  verification_token text not null,
  verification_method text not null check (verification_method in ('dns_txt', 'well_known')),
  is_verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index for user lookup
create index if not exists idx_targets_user_id on public.targets(user_id);

-- 3. Scans Table
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  target_id uuid references public.targets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null check (status in ('pending', 'running', 'completed', 'failed')) default 'pending',
  total_findings integer not null default 0,
  high_count integer not null default 0,
  medium_count integer not null default 0,
  low_count integer not null default 0,
  duration_seconds numeric(6, 2),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_scans_target_id on public.scans(target_id);
create index if not exists idx_scans_user_id on public.scans(user_id);

-- 4. Findings Table (Stores normalized vulnerability reports)
create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references public.scans(id) on delete cascade not null,
  target_id uuid references public.targets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  finding_code text not null,
  title text not null,
  vulnerability_class text not null,
  severity text not null check (severity in ('High', 'Medium', 'Low')),
  endpoint text not null,
  explanation text not null,
  evidence jsonb not null default '{}'::jsonb,
  reproduction text not null,
  recommendation text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_findings_scan_id on public.findings(scan_id);
create index if not exists idx_findings_user_id on public.findings(user_id);

-- 5. Contact Submissions & Waitlist Table
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  message text not null,
  source text not null check (source in ('contact', 'waitlist')) default 'contact',
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.targets enable row level security;
alter table public.scans enable row level security;
alter table public.findings enable row level security;
alter table public.contact_submissions enable row level security;

-- Profiles Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Targets Policies
create policy "Users can view own targets"
  on public.targets for select
  using (auth.uid() = user_id);

create policy "Users can insert own targets"
  on public.targets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own targets"
  on public.targets for update
  using (auth.uid() = user_id);

create policy "Users can delete own targets"
  on public.targets for delete
  using (auth.uid() = user_id);

-- Scans Policies
create policy "Users can view own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Users can insert own scans"
  on public.scans for insert
  with check (auth.uid() = user_id);

-- Findings Policies
create policy "Users can view own findings"
  on public.findings for select
  using (auth.uid() = user_id);

-- Contact Submissions Policies (Public insert, service role read)
create policy "Allow public contact submissions"
  on public.contact_submissions for insert
  with check (true);

-- ==============================================================================
-- Automatic User Profile Creation Trigger
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
