-- Dose tracking enhancements (ISL-2287)
-- Adds skip-week support, 6-zone injection sites, soft delete, and sync tracking

-- Add skip-week columns
ALTER TABLE public.doses ADD COLUMN is_skip boolean NOT NULL DEFAULT false;
ALTER TABLE public.doses ADD COLUMN skip_reason text CHECK (
  skip_reason IS NULL OR skip_reason IN ('side_effects', 'prescriber_direction', 'travel_schedule', 'supply_issue', 'other')
);

-- Add soft delete for undo grace window
ALTER TABLE public.doses ADD COLUMN deleted_at timestamptz;

-- Add sync tracking for offline support
ALTER TABLE public.doses ADD COLUMN synced_at timestamptz;

-- Add updated_at for edit tracking
ALTER TABLE public.doses ADD COLUMN updated_at timestamptz DEFAULT now();

-- Add constraint: skip_reason required when is_skip is true
ALTER TABLE public.doses ADD CONSTRAINT doses_skip_reason_required
  CHECK (is_skip = false OR skip_reason IS NOT NULL);

-- Index for soft-delete filtering
CREATE INDEX idx_doses_active ON public.doses (user_id, logged_at DESC) WHERE deleted_at IS NULL;

-- Index for injection site rotation queries
CREATE INDEX idx_doses_injection_site ON public.doses (user_id, injection_site, logged_at DESC) WHERE deleted_at IS NULL;
