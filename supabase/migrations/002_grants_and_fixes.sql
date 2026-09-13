-- ============================================================
-- Life RPG — 002 Grants + hardening (run AFTER 001_initial_schema.sql)
-- Does NOT recreate tables. Only grants + idempotent fixes.
-- ============================================================

-- Allow authenticated users to call the SECURITY DEFINER game functions.
-- Ownership is enforced inside the functions via p_user_id, which the
-- API routes derive from the verified server-side session (never from client).
GRANT EXECUTE ON FUNCTION public.complete_quest(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_shop_item(UUID, TEXT, TEXT, INT) TO authenticated;

-- Allow anon to execute as well would be unsafe for direct client calls,
-- so we do NOT grant to anon. All calls go through server API routes.

-- Ensure profile trigger exists (idempotent re-create from 001)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_profile (id, username)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''), split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create missing profiles for users who signed up before 001 ran
INSERT INTO public.users_profile (id, username)
SELECT u.id, COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'username'), ''), split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.users_profile p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Extra indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_quests_user_created ON public.quests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON public.shop_purchases (user_id);
CREATE INDEX IF NOT EXISTS idx_profile_last_active ON public.users_profile (last_active);
