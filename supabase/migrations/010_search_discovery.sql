-- Real search signals only; rerunnable. No personal search-history table.
BEGIN;
CREATE TABLE IF NOT EXISTS public.search_signals (
  term text NOT NULL CHECK (char_length(term) BETWEEN 1 AND 100),
  client_hash text NOT NULL CHECK (client_hash ~ '^[a-f0-9]{64}$'),
  searched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (term, client_hash)
);
CREATE INDEX IF NOT EXISTS search_signals_time_idx ON public.search_signals(searched_at);
CREATE INDEX IF NOT EXISTS search_signals_client_idx ON public.search_signals(client_hash);
ALTER TABLE public.search_signals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.search_signals FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.valid_search_keyword(keyword text)
RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
  SELECT EXISTS (SELECT 1 FROM public.drinks d WHERE d.status='active' AND lower(d.name)=lower(keyword))
    OR EXISTS (SELECT 1 FROM public.brands b JOIN public.drinks d ON d.brand_id=b.id AND d.status='active' WHERE lower(b.name)=lower(keyword))
    OR (keyword=ANY(ARRAY['아메리카노','라떼','디카페인','말차','밀크티','콜드브루','초코','리치티'])
        AND EXISTS (SELECT 1 FROM public.drinks d WHERE d.status='active' AND strpos(d.name,keyword)>0));
$$;
CREATE OR REPLACE FUNCTION public.record_search_signal(keyword text, client text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF keyword IS NULL OR client IS NULL OR client !~ '^[a-f0-9]{64}$' OR NOT public.valid_search_keyword(keyword) THEN RETURN false; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(client,0));
  DELETE FROM public.search_signals WHERE searched_at <= statement_timestamp()-interval '48 hours';
  IF EXISTS (SELECT 1 FROM public.search_signals WHERE term=keyword AND client_hash=client)
     OR (SELECT count(*) FROM public.search_signals WHERE client_hash=client)>=30 THEN RETURN false; END IF;
  INSERT INTO public.search_signals(term,client_hash) VALUES(keyword,client) ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.record_search_signal(text,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.rising_search_terms()
RETURNS TABLE(term text,recent bigint,previous bigint,growth bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  WITH counts AS (
    SELECT s.term,
      count(*) FILTER (WHERE s.searched_at > statement_timestamp()-interval '24 hours') AS recent,
      count(*) FILTER (WHERE s.searched_at <= statement_timestamp()-interval '24 hours') AS previous
    FROM public.search_signals s
    WHERE s.searched_at > statement_timestamp()-interval '48 hours'
      AND s.searched_at <= statement_timestamp() AND public.valid_search_keyword(s.term)
    GROUP BY s.term
  )
  SELECT term,recent,previous,recent-previous AS growth FROM counts
  WHERE recent>=3 AND recent>previous
  ORDER BY recent-previous DESC,recent DESC,term ASC LIMIT 5;
$$;
REVOKE ALL ON FUNCTION public.rising_search_terms() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rising_search_terms() TO anon, authenticated;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
    GRANT ALL ON public.search_signals TO service_role;
    GRANT EXECUTE ON FUNCTION public.record_search_signal(text,text) TO service_role;
    GRANT EXECUTE ON FUNCTION public.rising_search_terms() TO service_role;
  END IF;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
