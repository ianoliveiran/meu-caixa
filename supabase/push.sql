-- Notificações (web push) e agendador de hora em hora. Rode depois do schema.sql e troque a URL do site.
create extension if not exists pg_net;
create extension if not exists pg_cron;

create table if not exists private.cron_config (
  id int primary key default 1 check (id = 1),
  secret text not null,
  vapid_public text,
  vapid_private text
);
revoke all on private.cron_config from public, anon, authenticated;
insert into private.cron_config (id, secret) values (1, encode(extensions.gen_random_bytes(32), 'hex')) on conflict (id) do nothing;

create or replace function public.cron_states(p_secret text)
returns table (user_id uuid, data jsonb, updated_at timestamptz)
language sql security definer set search_path = '' as $$
  select a.user_id, a.data, a.updated_at from public.app_state a
  where exists (select 1 from private.cron_config c where c.secret = p_secret);
$$;

create or replace function public.cron_save(p_secret text, p_user uuid, p_data jsonb, p_prev timestamptz)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not exists (select 1 from private.cron_config c where c.secret = p_secret) then raise exception 'sem acesso'; end if;
  update public.app_state set data = p_data, updated_at = now() where user_id = p_user and updated_at = p_prev;
  get diagnostics n = row_count;
  return n > 0;
end $$;

create or replace function public.vapid_get(p_secret text)
returns table (pub text, priv text) language sql security definer set search_path = '' as $$
  select c.vapid_public, c.vapid_private from private.cron_config c where c.secret = p_secret;
$$;
create or replace function public.vapid_keys()
returns table (pub text, priv text) language sql security definer set search_path = '' as $$
  select c.vapid_public, c.vapid_private from private.cron_config c where c.id = 1;
$$;
create or replace function public.vapid_public()
returns text language sql security definer set search_path = '' as $$ select c.vapid_public from private.cron_config c where c.id = 1; $$;
create or replace function public.vapid_init(p_pub text, p_priv text)
returns void language sql security definer set search_path = '' as $$
  update private.cron_config set vapid_public = p_pub, vapid_private = p_priv where id = 1 and vapid_public is null;
$$;

revoke all on function public.cron_states(text), public.cron_save(text, uuid, jsonb, timestamptz), public.vapid_get(text),
  public.vapid_keys(), public.vapid_public(), public.vapid_init(text, text) from public, anon, authenticated;
grant execute on function public.cron_states(text), public.cron_save(text, uuid, jsonb, timestamptz), public.vapid_get(text) to anon;
grant execute on function public.vapid_keys(), public.vapid_public(), public.vapid_init(text, text) to authenticated;

select cron.schedule('meu-cofrin-avisos', '7 * * * *', $$
  select net.http_post(url := 'https://SEU-SITE.vercel.app/api/cron',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select secret from private.cron_config where id = 1)),
    body := '{}'::jsonb, timeout_milliseconds := 60000);
$$);
