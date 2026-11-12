create table account_deletions(user_id uuid primary key references auth.users(id) on delete cascade,unlink_completed boolean not null default false,updated_at timestamptz not null default now());
alter table account_deletions enable row level security;
