-- FRANKO Pilates Pro — jornada do lead no CRM.
-- Aditiva a 0001_init.sql + 0002_roles.sql — rode no SQL Editor do Supabase
-- depois delas. Sem mudança de RLS: a política de crm_leads já criada em
-- 0002_roles.sql cobre a tabela inteira, coluna nova incluída.

alter table crm_leads add column if not exists journey jsonb not null default '{}'::jsonb;
-- journey = { [etapa]: "YYYY-MM-DD" } — data em que o lead ENTROU em cada
-- etapa pela primeira vez. Alimenta o funil por período e o modo "coorte"
-- do CRM (quem entrou num período, até onde chegou).
