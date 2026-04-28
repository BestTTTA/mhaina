-- 2026-04-28: Fix the two production issues
--   1) `pin_likes` insert/delete never updated `fishing_pins.likes_count`,
--      so the like button drifted (count went negative on the client).
--   2) RLS may have been tightened on the deployed DB, hiding pins from
--      other users on the map. Re-assert the public-read policies.
-- Run this whole file in the Supabase SQL Editor.

-- ─────────────────────────────────────────────────────────────────────
-- 1. Trigger that keeps fishing_pins.likes_count in sync.
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.bump_pin_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.fishing_pins
       SET likes_count = COALESCE(likes_count, 0) + 1
     WHERE id = NEW.pin_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.fishing_pins
       SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1)
     WHERE id = OLD.pin_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_pin_likes_bump_count ON public.pin_likes;
CREATE TRIGGER trg_pin_likes_bump_count
AFTER INSERT OR DELETE ON public.pin_likes
FOR EACH ROW EXECUTE FUNCTION public.bump_pin_likes_count();

-- Backfill: recompute every pin's likes_count from the truth table.
UPDATE public.fishing_pins fp
   SET likes_count = sub.cnt
  FROM (
    SELECT pin_id, COUNT(*)::int AS cnt
      FROM public.pin_likes
     GROUP BY pin_id
  ) sub
 WHERE fp.id = sub.pin_id;

-- Pins with zero likes won't appear in the join above; reset them too.
UPDATE public.fishing_pins fp
   SET likes_count = 0
 WHERE NOT EXISTS (SELECT 1 FROM public.pin_likes pl WHERE pl.pin_id = fp.id);

-- ─────────────────────────────────────────────────────────────────────
-- 2. Re-assert the public-read RLS policies. Idempotent — safe to re-run.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.fishing_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_likes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fisherman_profiles ENABLE ROW LEVEL SECURITY;

-- fishing_pins: anyone can read; only the owner can write.
DROP POLICY IF EXISTS "Users can read all pins"         ON public.fishing_pins;
DROP POLICY IF EXISTS "Users can insert their own pins" ON public.fishing_pins;
DROP POLICY IF EXISTS "Users can update their own pins" ON public.fishing_pins;
DROP POLICY IF EXISTS "Users can delete their own pins" ON public.fishing_pins;

CREATE POLICY "Users can read all pins"
  ON public.fishing_pins FOR SELECT USING (true);
CREATE POLICY "Users can insert their own pins"
  ON public.fishing_pins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pins"
  ON public.fishing_pins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pins"
  ON public.fishing_pins FOR DELETE USING (auth.uid() = user_id);

-- pin_likes: anyone can read counts; users only manage their own row.
DROP POLICY IF EXISTS "Users can read all likes"          ON public.pin_likes;
DROP POLICY IF EXISTS "Users can insert their own likes"  ON public.pin_likes;
DROP POLICY IF EXISTS "Users can delete their own likes"  ON public.pin_likes;

CREATE POLICY "Users can read all likes"
  ON public.pin_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes"
  ON public.pin_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes"
  ON public.pin_likes FOR DELETE USING (auth.uid() = user_id);

-- fisherman_profiles: public read so other users' avatars/nicknames show
-- up next to their pins on the map.
DROP POLICY IF EXISTS "Users can read all profiles"           ON public.fisherman_profiles;
DROP POLICY IF EXISTS "Users can update their own profile"    ON public.fisherman_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile"    ON public.fisherman_profiles;

CREATE POLICY "Users can read all profiles"
  ON public.fisherman_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile"
  ON public.fisherman_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile"
  ON public.fisherman_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
