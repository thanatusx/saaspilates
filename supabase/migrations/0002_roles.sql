-- FRANKO Pilates Pro — papéis (admin vs. dono de studio).
-- Aditiva a 0001_init.sql — rode no SQL Editor do Supabase depois dela.
--
-- Troca o modelo de "uma conta é dona de N studios" (owner_id) por
-- "admin vê tudo, dono de studio vê exatamente 1 studio", via um papel
-- explícito em profiles. studios.owner_id continua existindo (quem criou o
-- studio), só não decide mais visibilidade.
--
-- IMPORTANTE — rode isto logo depois de aplicar a migration, com o seu
-- próprio auth uid (Authentication -> Users no painel, copie o "User UID"):
-- sem isso você perde acesso a tudo que já cadastrou, porque studios deixa
-- de ser filtrada por owner_id.
--
--   insert into profiles (id, role) values ('<seu-auth-uid-atual>', 'admin');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'owner')),
  studio_id uuid references studios(id) on delete set null, -- null para admin; obrigatório na prática para owner
  created_at timestamptz not null default now()
);

-- Funções auxiliares, security definer para não recursar em RLS: rodam como
-- dono da tabela (que já bypassa RLS), então a leitura de profiles aqui
-- dentro não reavalia nenhuma política. Precisam existir ANTES de qualquer
-- política que as chame (inclusive a de profiles logo abaixo).
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function my_studio_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select studio_id from profiles where id = auth.uid();
$$;

alter table profiles enable row level security;

drop policy if exists "self or admin can read profiles" on profiles;
create policy "self or admin can read profiles"
  on profiles for select
  using (id = auth.uid() or is_admin());
-- Sem política de escrita: profiles só é editada via SQL Editor / service
-- role (que já ignora RLS) — provisionamento é manual por enquanto.

-- Substitui as políticas de 0001_init.sql pelo novo modelo -----------------

drop policy if exists "owner full access to own studios" on studios;
create policy "admin full access to studios"
  on studios for all
  using (is_admin())
  with check (is_admin());
create policy "owner can read and update own studio"
  on studios for select
  using (id = my_studio_id());
create policy "owner can update own studio"
  on studios for update
  using (id = my_studio_id())
  with check (id = my_studio_id());

drop policy if exists "owner full access to own weekly_entries" on weekly_entries;
create policy "admin or owner full access to weekly_entries"
  on weekly_entries for all
  using (is_admin() or studio_id = my_studio_id())
  with check (is_admin() or studio_id = my_studio_id());

drop policy if exists "owner full access to own crm_leads" on crm_leads;
create policy "admin or owner full access to crm_leads"
  on crm_leads for all
  using (is_admin() or studio_id = my_studio_id())
  with check (is_admin() or studio_id = my_studio_id());
