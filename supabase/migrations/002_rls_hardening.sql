-- RLS Hardening — Sprint 1
-- Applies required changes from CTO schema review (ISL-1613):
--   R1: Explicit anon role revoke on all health tables
--   R2: Replace FOR ALL policies with per-operation (SELECT/INSERT/UPDATE, no DELETE)
--   R3: Document intentional absence of users DELETE policy

-- =====================================================================
-- R1 — Revoke anon access (defense-in-depth for PHI-adjacent data)
-- RLS policies already block anon (auth.uid() returns NULL), but
-- Supabase grants default schema access to anon role. Belt-and-suspenders.
-- =====================================================================
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.dose_logs FROM anon;
REVOKE ALL ON public.food_entries FROM anon;
REVOKE ALL ON public.meal_plans FROM anon;
REVOKE ALL ON public.progress_tracking FROM anon;
REVOKE ALL ON public.subscriptions FROM anon;

-- =====================================================================
-- R2 — Replace FOR ALL with explicit per-operation policies
-- Removes accidental DELETE capability. User-driven deletion will be
-- added as a deliberate feature with its own policies.
-- =====================================================================

-- dose_logs: drop FOR ALL, add SELECT/INSERT/UPDATE
DROP POLICY IF EXISTS "Users can manage own doses" ON public.dose_logs;
CREATE POLICY dose_logs_owner_select ON public.dose_logs
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY dose_logs_owner_insert ON public.dose_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY dose_logs_owner_update ON public.dose_logs
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- food_entries: drop FOR ALL, add SELECT/INSERT/UPDATE
DROP POLICY IF EXISTS "Users can manage own food entries" ON public.food_entries;
CREATE POLICY food_entries_owner_select ON public.food_entries
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY food_entries_owner_insert ON public.food_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY food_entries_owner_update ON public.food_entries
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- progress_tracking: drop FOR ALL, add SELECT/INSERT/UPDATE
DROP POLICY IF EXISTS "Users can manage own progress" ON public.progress_tracking;
CREATE POLICY progress_owner_select ON public.progress_tracking
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY progress_owner_insert ON public.progress_tracking
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY progress_owner_update ON public.progress_tracking
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- meal_plans (user-owned): drop FOR ALL, add SELECT/INSERT/UPDATE
-- Note: "Anyone can view template meal plans" policy remains intact
DROP POLICY IF EXISTS "Users can manage own meal plans" ON public.meal_plans;
CREATE POLICY meal_plans_owner_select ON public.meal_plans
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY meal_plans_owner_insert ON public.meal_plans
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY meal_plans_owner_update ON public.meal_plans
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================================================================
-- R3 — users table: no DELETE policy is intentional
-- Account deletion must go through a service-role function, never
-- client-side. The absence of a DELETE policy means RLS silently
-- denies client DELETE requests, which is correct behavior.
-- =====================================================================
