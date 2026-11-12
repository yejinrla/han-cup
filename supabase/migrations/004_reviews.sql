create function public.rating_summaries() returns table(drink_id uuid,average numeric,count bigint) language sql stable security definer set search_path=public as $$
 select drink_id,round(avg(rating)::numeric,1),count(*) from (
 select distinct on(drink_id,user_id) drink_id,user_id,rating from public.reviews where visibility='public' and moderation_status='visible' order by drink_id,user_id,created_at desc,id desc
 ) latest group by drink_id;
$$;
revoke all on function public.rating_summaries() from public;
grant execute on function public.rating_summaries() to anon,authenticated;
create function public.public_reviews(product uuid,offset_rows integer default 0) returns table(id uuid,nickname text,rating integer,body text,consumed_on date,variant_id uuid,created_at timestamptz) language sql stable security definer set search_path=public as $$
 select r.id,p.nickname,r.rating,r.body,r.consumed_on,r.variant_id,r.created_at from public.reviews r join public.profiles p on p.id=r.user_id where r.drink_id=product and r.visibility='public' and r.moderation_status='visible' order by r.created_at desc,r.id desc limit 20 offset greatest(0,least(offset_rows,10000));
$$;
revoke all on function public.public_reviews(uuid,integer) from public;
grant execute on function public.public_reviews(uuid,integer) to anon,authenticated;
create function public.is_public_review(review uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.reviews where id=review and visibility='public' and moderation_status='visible')$$;
revoke all on function public.is_public_review(uuid) from public;
grant execute on function public.is_public_review(uuid) to authenticated;
grant insert(reporter_id,review_id,reason) on review_reports to authenticated;
create policy report_public_review on review_reports for insert to authenticated with check(reporter_id=auth.uid() and is_public_review(review_id));
create function public.is_operator() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.operator_roles where user_id=auth.uid())$$;
revoke all on function public.is_operator() from public;
grant execute on function public.is_operator() to authenticated;
create function public.update_review_timestamp() returns trigger language plpgsql set search_path=public as $$begin new.updated_at=clock_timestamp();return new;end$$;
create trigger update_review_timestamp before update on reviews for each row execute function update_review_timestamp();
