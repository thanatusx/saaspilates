-- FRANKO Pilates Pro — schema inicial (studios, lançamentos semanais, CRM).
-- Rode este arquivo inteiro no SQL Editor do Supabase, uma vez, antes de usar
-- o app. Modelo de propriedade: uma conta (auth.users) é dona de N studios
-- (owner_id); lançamentos semanais e leads do CRM pertencem a um studio e
-- herdam essa dono via join.

create extension if not exists "pgcrypto";

create table if not exists studios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  city text not null default '',
  operation_model text not null check (operation_model in ('boutique', 'grupo', 'clinica', 'franquia')),
  meta_matriculas_mes integer not null default 0,
  plan text not null check (plan in ('Plano Pro', 'Plano Essencial', 'Plano Enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists weekly_entries (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  period_id text not null, -- "YYYY-MM"
  week text not null check (week in ('S01', 'S02', 'S03', 'S04')),
  receita numeric(12, 2) not null default 0,
  custos jsonb not null default '{}'::jsonb, -- { folha, aluguel, marketing, outros }
  alunos_ativos_fim integer not null default 0,
  matriculas_novas integer not null default 0,
  cancelamentos integer not null default 0,
  leads_recebidos integer not null default 0,
  tempo_resposta_medio_min numeric(6, 2) not null default 0,
  experimentais_agendadas integer not null default 0,
  experimentais_realizadas integer not null default 0,
  no_shows integer not null default 0,
  investimento_midia numeric(12, 2) not null default 0,
  origem jsonb not null default '{}'::jsonb, -- Partial<Record<canal, contagem>>
  capacidade_vagas integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (studio_id, period_id, week)
);

create table if not exists crm_leads (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  name text not null,
  phone text not null default '',
  origin text not null,
  stage text not null,
  responsible text not null default '',
  lead_score integer not null default 0,
  last_activity text not null default '',
  obs text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists weekly_entries_studio_id_idx on weekly_entries(studio_id);
create index if not exists crm_leads_studio_id_idx on crm_leads(studio_id);

-- updated_at automático -------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on studios;
create trigger set_updated_at before update on studios
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on weekly_entries;
create trigger set_updated_at before update on weekly_entries
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on crm_leads;
create trigger set_updated_at before update on crm_leads
  for each row execute function set_updated_at();

-- Row Level Security ------------------------------------------------------
alter table studios enable row level security;
alter table weekly_entries enable row level security;
alter table crm_leads enable row level security;

drop policy if exists "owner full access to own studios" on studios;
create policy "owner full access to own studios"
  on studios for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "owner full access to own weekly_entries" on weekly_entries;
create policy "owner full access to own weekly_entries"
  on weekly_entries for all
  using (exists (select 1 from studios s where s.id = weekly_entries.studio_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from studios s where s.id = weekly_entries.studio_id and s.owner_id = auth.uid()));

drop policy if exists "owner full access to own crm_leads" on crm_leads;
create policy "owner full access to own crm_leads"
  on crm_leads for all
  using (exists (select 1 from studios s where s.id = crm_leads.studio_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from studios s where s.id = crm_leads.studio_id and s.owner_id = auth.uid()));
