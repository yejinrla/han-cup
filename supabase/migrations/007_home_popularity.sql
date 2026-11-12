-- Additive and rerunnable. Run in the existing HanCup Supabase SQL Editor.
BEGIN;
CREATE INDEX IF NOT EXISTS reviews_popularity_idx
  ON public.reviews(created_at DESC,drink_id,user_id)
  WHERE moderation_status='visible';

CREATE OR REPLACE FUNCTION public.popular_drinks()
RETURNS TABLE(drink_id uuid,recorders bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT r.drink_id,count(DISTINCT r.user_id) AS recorders
  FROM public.reviews r
  JOIN public.drinks d ON d.id=r.drink_id AND d.status='active'
  WHERE r.moderation_status='visible'
    AND r.created_at > statement_timestamp()-interval '24 hours'
    AND r.created_at <= statement_timestamp()
  GROUP BY r.drink_id
  ORDER BY count(DISTINCT r.user_id) DESC,max(r.created_at) DESC,r.drink_id
  LIMIT 6;
$$;
REVOKE ALL ON FUNCTION public.popular_drinks() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.popular_drinks() TO anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
