create table if not exists beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  liked_most text,
  could_improve text,
  would_recommend text check (would_recommend in ('yes', 'maybe', 'no')),
  app_version text not null default '0.1.0',
  created_at timestamptz not null default now()
);

alter table beta_feedback enable row level security;

create policy "Users can insert their own feedback"
  on beta_feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read their own feedback"
  on beta_feedback for select
  to authenticated
  using (auth.uid() = user_id);
