-- Nutrition Tracking: goals, water logs, daily totals view, timezone-aware RPC

-- Generic updated_at trigger function (reusable)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. Nutrition goals (one row per user)
create table public.nutrition_goals (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  calorie_goal   integer not null check (calorie_goal between 800 and 4000),
  protein_goal_g integer not null check (protein_goal_g between 20 and 300),
  water_goal_ml  integer not null check (water_goal_ml between 500 and 6000),
  source         text    not null default 'manual'
                 check (source in ('manual', 'suggested', 'mixed')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  skipped_at     timestamptz
);

alter table public.nutrition_goals enable row level security;

create policy "users_select_own_goals"
  on public.nutrition_goals for select
  using (auth.uid() = user_id);

create policy "users_insert_own_goals"
  on public.nutrition_goals for insert
  with check (auth.uid() = user_id);

create policy "users_update_own_goals"
  on public.nutrition_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger nutrition_goals_set_updated_at
  before update on public.nutrition_goals
  for each row execute function public.set_updated_at();

-- 2. Water logs
create table public.water_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  amount_ml  integer not null check (amount_ml between 1 and 3000),
  logged_at  timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index water_logs_user_logged_at_idx
  on public.water_logs (user_id, logged_at desc);

alter table public.water_logs enable row level security;

create policy "users_select_own_water"
  on public.water_logs for select
  using (auth.uid() = user_id);

create policy "users_insert_own_water"
  on public.water_logs for insert
  with check (auth.uid() = user_id);

create policy "users_delete_own_water"
  on public.water_logs for delete
  using (auth.uid() = user_id);

-- 3. Daily nutrition totals view
-- Note: meals table already has calories (int), protein_g (numeric), fiber_g, fat_g, carbs_g
-- Column is logged_at (timestamptz), not eaten_at
create or replace view public.daily_nutrition_totals as
with meals_agg as (
  select
    user_id,
    (logged_at at time zone 'UTC')::date as day,
    coalesce(sum(calories), 0)::int       as calories,
    coalesce(sum(protein_g), 0)::int      as protein_g
  from public.meals
  group by 1, 2
),
water_agg as (
  select
    user_id,
    (logged_at at time zone 'UTC')::date as day,
    coalesce(sum(amount_ml), 0)::int     as water_ml
  from public.water_logs
  group by 1, 2
)
select
  coalesce(m.user_id, w.user_id) as user_id,
  coalesce(m.day, w.day)         as day,
  coalesce(m.calories, 0)        as calories,
  coalesce(m.protein_g, 0)       as protein_g,
  coalesce(w.water_ml, 0)        as water_ml
from meals_agg m
full outer join water_agg w
  on m.user_id = w.user_id and m.day = w.day;

-- 4. Timezone-aware RPC for daily totals
create or replace function public.daily_totals_local(
  tz text,
  start_date date,
  end_date date
)
returns table (day date, calories int, protein_g int, water_ml int)
language sql stable security invoker as $$
  with meals_agg as (
    select
      (logged_at at time zone tz)::date as day,
      coalesce(sum(m.calories), 0)::int as calories,
      coalesce(sum(m.protein_g), 0)::int as protein_g
    from public.meals m
    where m.user_id = auth.uid()
      and (m.logged_at at time zone tz)::date between start_date and end_date
    group by 1
  ),
  water_agg as (
    select
      (logged_at at time zone tz)::date as day,
      coalesce(sum(w.amount_ml), 0)::int as water_ml
    from public.water_logs w
    where w.user_id = auth.uid()
      and (w.logged_at at time zone tz)::date between start_date and end_date
    group by 1
  ),
  date_series as (
    select d::date as day
    from generate_series(start_date::timestamp, end_date::timestamp, '1 day') d
  )
  select
    ds.day,
    coalesce(ma.calories, 0)  as calories,
    coalesce(ma.protein_g, 0) as protein_g,
    coalesce(wa.water_ml, 0)  as water_ml
  from date_series ds
  left join meals_agg ma on ds.day = ma.day
  left join water_agg wa on ds.day = wa.day
  order by ds.day;
$$;
