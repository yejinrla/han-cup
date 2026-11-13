-- Additive, rerunnable: existing drink favorites and reviews are unchanged.
BEGIN;
CREATE TABLE IF NOT EXISTS public.article_favorites (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  article_slug text NOT NULL CHECK (
    char_length(article_slug) BETWEEN 1 AND 120
    AND article_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, article_slug)
);
ALTER TABLE public.article_favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.article_favorites FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.article_favorites TO authenticated;
GRANT INSERT (user_id, article_slug) ON public.article_favorites TO authenticated;
DROP POLICY IF EXISTS own_article_favorites_read ON public.article_favorites;
CREATE POLICY own_article_favorites_read ON public.article_favorites
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS own_article_favorites_insert ON public.article_favorites;
CREATE POLICY own_article_favorites_insert ON public.article_favorites
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS own_article_favorites_delete ON public.article_favorites;
CREATE POLICY own_article_favorites_delete ON public.article_favorites
  FOR DELETE TO authenticated USING (user_id = auth.uid());
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON public.article_favorites TO service_role;
  END IF;
END $$;
NOTIFY pgrst, 'reload schema';
COMMIT;
