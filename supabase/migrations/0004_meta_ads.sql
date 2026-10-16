-- FRANKO Pilates Pro — integração com Meta Ads (puxar campanhas/investimento).
-- Aditiva a 0001_init.sql + 0002_roles.sql — rode no SQL Editor do Supabase
-- depois delas. Mesmo padrão de whatsapp_connections (0003_whatsapp.sql).

create table if not exists meta_connections (
  studio_id uuid primary key references studios(id) on delete cascade,
  ad_account_id text not null,
  pixel_id text, -- ainda sem uso — reservado pra Conversions API (leva futura)
  access_token text not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS habilitada, SEM política nenhuma pra authenticated/anon — mesmo motivo
-- de whatsapp_connections: access_token é sensível, só as rotas de servidor
-- (lib/supabase/admin.ts, service role, ignora RLS) tocam nesta tabela.
alter table meta_connections enable row level security;

drop trigger if exists set_updated_at on meta_connections;
create trigger set_updated_at before update on meta_connections
  for each row execute function set_updated_at();
