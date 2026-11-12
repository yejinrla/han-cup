create table map_budget(day date primary key,total integer not null default 0);
create table map_client_budget(client_hash text primary key,window_start timestamptz not null,hits integer not null);
alter table map_budget enable row level security;alter table map_client_budget enable row level security;
create function reserve_map_request(client text,daily_limit integer) returns boolean language plpgsql security definer set search_path=public as $$declare n integer;h integer;begin
 if daily_limit<1 or daily_limit>100000 or length(client)<>64 then return false;end if;
 delete from map_budget where day < current_date-7;delete from map_client_budget where window_start < now()-interval '1 day';
 insert into map_client_budget values(client,now(),1) on conflict(client_hash) do update set hits=case when map_client_budget.window_start<now()-interval '1 minute' then 1 else map_client_budget.hits+1 end,window_start=case when map_client_budget.window_start<now()-interval '1 minute' then now() else map_client_budget.window_start end returning hits into h;
 if h>15 then return false;end if;
 insert into map_budget values(current_date,1) on conflict(day) do update set total=map_budget.total+1 where map_budget.total<daily_limit returning total into n;
 return n is not null;
end$$;
revoke all on function reserve_map_request(text,integer) from public,anon,authenticated;
-- Supabase service_role executes only; plain PostgreSQL test adapter grants explicitly.
do $$begin if exists(select 1 from pg_roles where rolname='service_role') then grant execute on function reserve_map_request(text,integer) to service_role;end if;end$$;
