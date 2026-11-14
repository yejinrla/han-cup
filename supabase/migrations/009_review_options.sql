-- Custom order options on records (2026-11-14 spec). Additive and rerunnable:
-- existing records keep an empty option list; RLS policies are unchanged.
BEGIN;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS options text[] NOT NULL DEFAULT '{}';

-- Same rules as the app (src/features/reviews/options.ts): approved list,
-- at most five, no duplicates, at most one option from each opposite group.
CREATE OR REPLACE FUNCTION public.review_options_valid(o text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT o <@ ARRAY['shot_extra','shot_light','syrup_extra','syrup_less',
                    'syrup_none','milk_change','decaf','ice_less','ice_extra',
                    'whip_extra','whip_none']::text[]
     AND cardinality(o) <= 5
     AND cardinality(o) = (SELECT count(DISTINCT x) FROM unnest(o) x)
     AND (SELECT count(*) FROM unnest(o) x
          WHERE x IN ('shot_extra','shot_light')) <= 1
     AND (SELECT count(*) FROM unnest(o) x
          WHERE x IN ('syrup_extra','syrup_less','syrup_none')) <= 1
     AND (SELECT count(*) FROM unnest(o) x
          WHERE x IN ('ice_less','ice_extra')) <= 1
     AND (SELECT count(*) FROM unnest(o) x
          WHERE x IN ('whip_extra','whip_none')) <= 1
$$;

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_options_valid;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_options_valid CHECK (public.review_options_valid(options));

-- Reviews use column-level write grants (001_core.sql); add the new column.
GRANT INSERT (options) ON public.reviews TO authenticated;
GRANT UPDATE (options) ON public.reviews TO authenticated;

-- Public reviews now include options. The return type changes, so the
-- function is recreated; it still returns only public, visible records.
DROP FUNCTION IF EXISTS public.public_reviews(uuid, integer);
CREATE FUNCTION public.public_reviews(product uuid, offset_rows integer DEFAULT 0)
RETURNS TABLE(id uuid, nickname text, rating integer, body text,
              consumed_on date, variant_id uuid, created_at timestamptz,
              options text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, p.nickname, r.rating, r.body, r.consumed_on, r.variant_id,
         r.created_at, r.options
  FROM public.reviews r
  JOIN public.profiles p ON p.id = r.user_id
  WHERE r.drink_id = product
    AND r.visibility = 'public'
    AND r.moderation_status = 'visible'
  ORDER BY r.created_at DESC, r.id DESC
  LIMIT 20 OFFSET greatest(0, least(offset_rows, 10000));
$$;
REVOKE ALL ON FUNCTION public.public_reviews(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_reviews(uuid, integer) TO anon, authenticated;

COMMIT;
