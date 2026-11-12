-- HanCup discovery activation: safe to rerun in the EXISTING project.
-- Adds popularity RPC and three operator-approved drinks; no deletions.

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

-- Operator approved these three official Mega winter drinks on 2026-11-12.
-- Adds new products only; does not overwrite existing products.
BEGIN;
SET LOCAL search_path = public;
INSERT INTO public.drinks(id,brand_id,slug,name,category,status,default_variant_id) VALUES ('7fc2b97f-a6e5-5e04-aec7-ee5455e92149','mega','mega-deep-chocolate-cherry-frappe','딥 초코 체리 프라페','smoothie','active','4d38a746-f011-57b1-8ac8-1ef24570d3e0') ON CONFLICT(id) DO NOTHING;
INSERT INTO public.drink_variants(id,drink_id,temperature,size_label,cup_ml,nutrition_basis_ml,calories_kcal,sugar_g,caffeine_mg,price_krw,source_url,checked_at,image_path) VALUES ('4d38a746-f011-57b1-8ac8-1ef24570d3e0','7fc2b97f-a6e5-5e04-aec7-ee5455e92149','iced','기본',591,NULL,604,90.7,26,NULL,'https://www.mega-mgccoffee.com/menu/?menu_category1=1&menu_category2=1','2026-11-12',NULL) ON CONFLICT(id) DO NOTHING;
INSERT INTO public.drinks(id,brand_id,slug,name,category,status,default_variant_id) VALUES ('118c6886-96de-5b9f-8d6e-995ecf37c569','mega','mega-chewy-mochi-milk-tea','쫀득 모찌 밀크티','tea','active','dd614fda-8c27-56af-a258-ca71a1200bd7') ON CONFLICT(id) DO NOTHING;
INSERT INTO public.drink_variants(id,drink_id,temperature,size_label,cup_ml,nutrition_basis_ml,calories_kcal,sugar_g,caffeine_mg,price_krw,source_url,checked_at,image_path) VALUES ('dd614fda-8c27-56af-a258-ca71a1200bd7','118c6886-96de-5b9f-8d6e-995ecf37c569','iced','기본',591,NULL,375.3,46.4,14.2,NULL,'https://www.mega-mgccoffee.com/menu/?menu_category1=1&menu_category2=1','2026-11-12',NULL) ON CONFLICT(id) DO NOTHING;
INSERT INTO public.drinks(id,brand_id,slug,name,category,status,default_variant_id) VALUES ('1d535975-8541-5b1c-bf5e-2e80067b2b1f','mega','mega-green-plum-quince-tea','매실 모과차','tea','active','f5e388fd-01e2-55c5-b85b-f9c904911bd8') ON CONFLICT(id) DO NOTHING;
INSERT INTO public.drink_variants(id,drink_id,temperature,size_label,cup_ml,nutrition_basis_ml,calories_kcal,sugar_g,caffeine_mg,price_krw,source_url,checked_at,image_path) VALUES ('f5e388fd-01e2-55c5-b85b-f9c904911bd8','1d535975-8541-5b1c-bf5e-2e80067b2b1f','hot','기본',591,NULL,276.6,54.9,0,NULL,'https://www.mega-mgccoffee.com/menu/?menu_category1=1&menu_category2=1','2026-11-12',NULL) ON CONFLICT(id) DO NOTHING;
SET CONSTRAINTS ALL IMMEDIATE;
COMMIT;
SELECT name FROM public.drinks WHERE id IN ('7fc2b97f-a6e5-5e04-aec7-ee5455e92149','118c6886-96de-5b9f-8d6e-995ecf37c569','1d535975-8541-5b1c-bf5e-2e80067b2b1f');
