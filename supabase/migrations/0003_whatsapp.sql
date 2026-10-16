-- FRANKO Pilates Pro — integração com WhatsApp (Meta Cloud API).
-- Aditiva a 0001_init.sql + 0002_roles.sql — rode no SQL Editor do Supabase
-- depois delas. Usa is_admin()/my_studio_id(), já criadas em 0002_roles.sql.

create table if not exists whatsapp_connections (
  studio_id uuid primary key references studios(id) on delete cascade,
  phone_number_id text not null,
  waba_id text,
  display_phone_number text,
  access_token text not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS habilitada, SEM política nenhuma pra authenticated/anon — nem admin
-- nem owner leem/escrevem esta tabela pelo client. access_token é a chave
-- que manda mensagem como o número real do studio; só as rotas de servidor
-- (lib/supabase/admin.ts, com a service role key, que ignora RLS) tocam
-- nela. Isso é intencionalmente diferente do padrão de owner_id/RLS usado
-- no resto do schema.
alter table whatsapp_connections enable row level security;

drop trigger if exists set_updated_at on whatsapp_connections;
create trigger set_updated_at before update on whatsapp_connections
  for each row execute function set_updated_at();

create table if not exists whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  lead_id uuid references crm_leads(id) on delete set null, -- nulo até casar com um lead do CRM pelo telefone
  wa_message_id text unique, -- id da Meta; evita duplicar em reentrega de webhook
  direction text not null check (direction in ('inbound', 'outbound')),
  from_phone text not null,
  to_phone text not null,
  body text not null default '',
  status text not null default 'received', -- received|sent|delivered|read|failed
  wa_timestamp timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_studio_lead_idx
  on whatsapp_messages (studio_id, lead_id, wa_timestamp);

alter table whatsapp_messages enable row level security;

-- Só leitura pra admin/owner, igual weekly_entries/crm_leads. Escrita (tanto
-- mensagem chegando pelo webhook quanto saindo pelo envio) sempre passa
-- pelas rotas de servidor com a service role key — sem política de
-- insert/update pra authenticated aqui de propósito.
drop policy if exists "admin or owner can read whatsapp_messages" on whatsapp_messages;
create policy "admin or owner can read whatsapp_messages"
  on whatsapp_messages for select
  using (is_admin() or studio_id = my_studio_id());

-- Habilita o Realtime (mensagens novas aparecem em /whatsapp sem refresh) —
-- sem isso a tabela existe mas não emite eventos postgres_changes. Em bloco
-- condicional pra poder rodar este arquivo mais de uma vez sem erro.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'whatsapp_messages'
  ) then
    alter publication supabase_realtime add table whatsapp_messages;
  end if;
end $$;
