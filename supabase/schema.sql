-- Banco da versão web. Rode uma vez no SQL Editor do Supabase e troque o e-mail.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.allowed_emails (email text primary key);
insert into private.allowed_emails (email) values ('voce@exemplo.com') on conflict do nothing;

create table if not exists public.app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;
revoke all on public.app_state from anon;
create policy "dono le" on public.app_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "dono cria" on public.app_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dono altera" on public.app_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function private.only_allowed_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from private.allowed_emails a where lower(a.email) = lower(new.email)) then
    raise exception 'Cadastro fechado para este e-mail';
  end if;
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end $$;
drop trigger if exists only_allowed_signup on auth.users;
create trigger only_allowed_signup before insert on auth.users for each row execute function private.only_allowed_signup();
