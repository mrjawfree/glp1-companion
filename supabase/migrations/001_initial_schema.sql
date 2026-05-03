-- GLP-1 Companion App: Initial Schema

-- Users profile table (extends auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  medication text check (medication in ('ozempic', 'wegovy', 'mounjaro', 'other')),
  current_dose text,
  start_date date,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro')),
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Dose logs
create table public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  medication text not null check (medication in ('ozempic', 'wegovy', 'mounjaro', 'other')),
  dose_amount text not null,
  logged_at timestamptz not null default now(),
  side_effects text[],
  notes text,
  created_at timestamptz default now()
);

-- Meal plans
create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  tags text[] default '{}',
  calories_target int,
  protein_target_g int,
  fiber_target_g int,
  meals jsonb default '[]',
  is_template boolean default false,
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Food entries
create table public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name text not null,
  serving_size text,
  calories int default 0,
  protein_g numeric default 0,
  fiber_g numeric default 0,
  fat_g numeric default 0,
  carbs_g numeric default 0,
  logged_at timestamptz not null default now(),
  source text default 'manual' check (source in ('manual', 'usda_api', 'barcode_scan')),
  external_food_id text,
  created_at timestamptz default now()
);

-- Progress tracking
create table public.progress_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  recorded_at date not null,
  weight_kg numeric,
  waist_cm numeric,
  energy_level int check (energy_level between 1 and 5),
  notes text,
  created_at timestamptz default now()
);

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_subscription_id text not null,
  plan text not null check (plan in ('monthly_9', 'monthly_19')),
  status text not null default 'active' check (status in ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_dose_logs_user_date on public.dose_logs(user_id, logged_at desc);
create index idx_food_entries_user_date on public.food_entries(user_id, logged_at desc);
create index idx_progress_user_date on public.progress_tracking(user_id, recorded_at desc);
create index idx_meal_plans_template on public.meal_plans(is_template) where is_template = true;

-- Row Level Security
alter table public.users enable row level security;
alter table public.dose_logs enable row level security;
alter table public.meal_plans enable row level security;
alter table public.food_entries enable row level security;
alter table public.progress_tracking enable row level security;
alter table public.subscriptions enable row level security;

-- RLS Policies
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

create policy "Users can manage own doses" on public.dose_logs for all using (auth.uid() = user_id);
create policy "Users can manage own food entries" on public.food_entries for all using (auth.uid() = user_id);
create policy "Users can manage own progress" on public.progress_tracking for all using (auth.uid() = user_id);
create policy "Users can view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);

create policy "Anyone can view template meal plans" on public.meal_plans for select using (is_template = true);
create policy "Users can manage own meal plans" on public.meal_plans for all using (auth.uid() = user_id);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
