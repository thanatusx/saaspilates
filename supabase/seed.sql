-- Seed de exemplo (opcional) — reproduz os 3 studios de demonstração que
-- existiam como mock no app (lib/studios-data.ts + lib/crm.ts), agora como
-- linhas reais no Supabase. Rode isso UMA VEZ no SQL Editor do Supabase,
-- depois do seu primeiro cadastro em /signup, para não começar com o
-- dashboard vazio.
--
-- 1. Rode a migration supabase/migrations/0001_init.sql antes desta.
-- 2. No painel do Supabase, vá em Authentication -> Users, copie o "User UID"
--    da sua conta.
-- 3. Troque o valor de v_owner abaixo por esse UID.
-- 4. Cole este arquivo inteiro no SQL Editor e rode.

do $$
declare
  v_owner uuid := '00000000-0000-0000-0000-000000000000'; -- TROQUE pelo seu auth.uid()
  v_studio_1 uuid := gen_random_uuid();
  v_studio_2 uuid := gen_random_uuid();
  v_studio_3 uuid := gen_random_uuid();
begin
  insert into studios (id, owner_id, name, city, operation_model, meta_matriculas_mes, plan, created_at) values
    (v_studio_1, v_owner, 'Studio Movimento Pilates', 'São Paulo, SP', 'grupo', 25, 'Plano Pro', '2024-02-10'),
    (v_studio_2, v_owner, 'Corpo Consciente Pilates', 'Belo Horizonte, MG', 'boutique', 14, 'Plano Essencial', '2024-05-02'),
    (v_studio_3, v_owner, 'Elevare Clínica + Pilates', 'Curitiba, PR', 'clinica', 20, 'Plano Enterprise', '2023-11-20');

  insert into weekly_entries (
    studio_id, period_id, week, receita, custos, alunos_ativos_fim, matriculas_novas,
    cancelamentos, leads_recebidos, tempo_resposta_medio_min, experimentais_agendadas,
    experimentais_realizadas, no_shows, investimento_midia, origem, capacidade_vagas
  ) values
    (v_studio_1, '2024-07', 'S01', 13093, '{"folha":4812,"aluguel":1650,"marketing":2021,"outros":1650}'::jsonb, 147, 6, 2, 19, 8, 16, 14, 2, 1870, '{"Instagram / tráfego pago":2,"Indicação":2,"Google":1,"Agregadores":1}'::jsonb, 200),
    (v_studio_1, '2024-07', 'S02', 10117, '{"folha":3719,"aluguel":1275,"marketing":1562,"outros":1275}'::jsonb, 151, 5, 1, 15, 8, 12, 11, 1, 1445, '{"Instagram / tráfego pago":2,"Indicação":1,"Google":1,"Agregadores":1}'::jsonb, 200),
    (v_studio_1, '2024-07', 'S03', 14283, '{"folha":5250,"aluguel":1800,"marketing":2205,"outros":1800}'::jsonb, 156, 7, 2, 21, 8, 17, 15, 2, 2040, '{"Instagram / tráfego pago":3,"Indicação":2,"Google":2,"Agregadores":1}'::jsonb, 200),
    (v_studio_1, '2024-07', 'S04', 10117, '{"folha":3719,"aluguel":1275,"marketing":1562,"outros":1275}'::jsonb, 160, 5, 1, 15, 8, 12, 11, 1, 1445, '{"Instagram / tráfego pago":2,"Indicação":1,"Google":1,"Agregadores":0}'::jsonb, 200),
    (v_studio_1, '2024-08', 'S01', 13646, '{"folha":5013,"aluguel":1671,"marketing":2367,"outros":1893}'::jsonb, 165, 7, 2, 25, 9, 20, 18, 2, 2172, '{"Instagram / tráfego pago":3,"Indicação":2,"Google":1,"Agregadores":1}'::jsonb, 205),
    (v_studio_1, '2024-08', 'S02', 11165, '{"folha":4101,"aluguel":1367,"marketing":1937,"outros":1549}'::jsonb, 169, 6, 2, 20, 9, 16, 14, 2, 1777, '{"Instagram / tráfego pago":3,"Indicação":2,"Google":1,"Agregadores":1}'::jsonb, 205),
    (v_studio_1, '2024-08', 'S03', 15506, '{"folha":5696,"aluguel":1899,"marketing":2690,"outros":2151}'::jsonb, 175, 8, 2, 28, 9, 22, 19, 3, 2469, '{"Instagram / tráfego pago":3,"Indicação":2,"Google":1,"Agregadores":1}'::jsonb, 205),
    (v_studio_1, '2024-08', 'S04', 8683, '{"folha":3190,"aluguel":1063,"marketing":1506,"outros":1205}'::jsonb, 178, 4, 1, 16, 9, 12, 11, 1, 1382, '{"Instagram / tráfego pago":2,"Indicação":1,"Google":1,"Agregadores":0}'::jsonb, 205),
    (v_studio_2, '2024-07', 'S01', 6289, '{"folha":2700,"aluguel":1013,"marketing":810,"outros":630}'::jsonb, 47, 2, 1, 7, 18, 5, 4, 1, 810, '{"Indicação":1,"Instagram / tráfego pago":0}'::jsonb, 90),
    (v_studio_2, '2024-07', 'S02', 7686, '{"folha":3300,"aluguel":1238,"marketing":990,"outros":770}'::jsonb, 48, 3, 2, 8, 18, 6, 5, 1, 990, '{"Indicação":2,"Instagram / tráfego pago":1}'::jsonb, 90),
    (v_studio_2, '2024-07', 'S03', 6289, '{"folha":2700,"aluguel":1012,"marketing":810,"outros":630}'::jsonb, 49, 2, 1, 7, 18, 5, 4, 1, 810, '{"Indicação":1,"Instagram / tráfego pago":0}'::jsonb, 90),
    (v_studio_2, '2024-07', 'S04', 7686, '{"folha":3300,"aluguel":1237,"marketing":990,"outros":770}'::jsonb, 50, 2, 1, 8, 18, 6, 5, 1, 990, '{"Indicação":2,"Instagram / tráfego pago":1}'::jsonb, 90),
    (v_studio_2, '2024-08', 'S01', 8190, '{"folha":3750,"aluguel":1350,"marketing":1260,"outros":750}'::jsonb, 50, 2, 2, 10, 22, 7, 6, 1, 1260, '{"Indicação":1,"Instagram / tráfego pago":1}'::jsonb, 90),
    (v_studio_2, '2024-08', 'S02', 4095, '{"folha":1875,"aluguel":675,"marketing":630,"outros":375}'::jsonb, 50, 1, 1, 5, 22, 3, 2, 1, 630, '{"Indicação":1,"Instagram / tráfego pago":0}'::jsonb, 90),
    (v_studio_2, '2024-08', 'S03', 6143, '{"folha":2813,"aluguel":1013,"marketing":945,"outros":563}'::jsonb, 51, 2, 1, 8, 22, 5, 4, 1, 945, '{"Indicação":1,"Instagram / tráfego pago":0}'::jsonb, 90),
    (v_studio_2, '2024-08', 'S04', 8872, '{"folha":4062,"aluguel":1462,"marketing":1365,"outros":812}'::jsonb, 52, 3, 2, 11, 22, 8, 6, 2, 1365, '{"Indicação":2,"Instagram / tráfego pago":1}'::jsonb, 90),
    (v_studio_3, '2024-07', 'S01', 16320, '{"folha":6500,"aluguel":2375,"marketing":1150,"outros":1512}'::jsonb, 124, 5, 1, 13, 5, 10, 9, 1, 1150, '{"Parcerias médicas":2,"Google":1,"Instagram / tráfego pago":1,"Agregadores":1}'::jsonb, 178),
    (v_studio_3, '2024-07', 'S02', 13872, '{"folha":5525,"aluguel":2019,"marketing":978,"outros":1286}'::jsonb, 128, 4, 0, 11, 5, 9, 8, 1, 978, '{"Parcerias médicas":2,"Google":1,"Instagram / tráfego pago":1,"Agregadores":0}'::jsonb, 178),
    (v_studio_3, '2024-07', 'S03', 19584, '{"folha":7800,"aluguel":2850,"marketing":1380,"outros":1815}'::jsonb, 133, 6, 1, 16, 5, 12, 11, 1, 1380, '{"Parcerias médicas":2,"Google":2,"Instagram / tráfego pago":1,"Agregadores":1}'::jsonb, 178),
    (v_studio_3, '2024-07', 'S04', 15504, '{"folha":6175,"aluguel":2256,"marketing":1092,"outros":1437}'::jsonb, 136, 4, 1, 12, 5, 9, 8, 1, 1092, '{"Parcerias médicas":2,"Google":1,"Instagram / tráfego pago":1,"Agregadores":0}'::jsonb, 178),
    (v_studio_3, '2024-08', 'S01', 18865, '{"folha":7288,"aluguel":2613,"marketing":1375,"outros":1931}'::jsonb, 141, 6, 1, 16, 4, 12, 11, 1, 1375, '{"Parcerias médicas":2,"Google":2,"Instagram / tráfego pago":1,"Agregadores":1}'::jsonb, 178),
    (v_studio_3, '2024-08', 'S02', 15435, '{"folha":5962,"aluguel":2137,"marketing":1125,"outros":1579}'::jsonb, 145, 5, 1, 13, 4, 10, 9, 1, 1125, '{"Parcerias médicas":2,"Google":1,"Instagram / tráfego pago":1,"Agregadores":0}'::jsonb, 178),
    (v_studio_3, '2024-08', 'S03', 19723, '{"folha":7619,"aluguel":2731,"marketing":1438,"outros":2018}'::jsonb, 150, 6, 1, 17, 4, 13, 12, 1, 1438, '{"Parcerias médicas":3,"Google":2,"Instagram / tráfego pago":1,"Agregadores":1}'::jsonb, 178),
    (v_studio_3, '2024-08', 'S04', 14577, '{"folha":5631,"aluguel":2019,"marketing":1062,"outros":1492}'::jsonb, 154, 4, 0, 12, 4, 9, 8, 1, 1062, '{"Parcerias médicas":2,"Google":1,"Instagram / tráfego pago":1,"Agregadores":0}'::jsonb, 178);

  insert into crm_leads (studio_id, name, phone, origin, stage, responsible, lead_score, last_activity, obs) values
    (v_studio_1, 'Ana Beatriz Souza', '(11) 92000-3000', 'instagram', 'ativo', 'Marina', 92, '26/08 08:00', 'Fechou plano Mensal Plus'),
    (v_studio_1, 'Carlos Eduardo Lima', '(11) 92037-3053', 'referral', 'compareceu', 'Jonas', 68, '25/08 09:07', 'Gostou, vai decidir com a esposa'),
    (v_studio_1, 'Fernanda Torres', '(11) 92074-3106', 'googleAds', 'novo', 'Marina', 34, '24/08 10:14', 'Pediu tabela de planos'),
    (v_studio_1, 'Rafael Menezes', '(11) 92111-3159', 'direct', 'ativo', 'Jonas', 88, '23/08 11:21', 'Fechou trimestral'),
    (v_studio_1, 'Juliana Prado', '(11) 92148-3212', 'instagram', 'perdido', 'Marina', 15, '22/08 12:28', 'Sumiu após 3 tentativas'),
    (v_studio_1, 'Marcos Vinícius', '(11) 92185-3265', 'instagram', 'contato', 'Jonas', 45, '21/08 13:35', 'Perguntou horário de manhã'),
    (v_studio_1, 'Bianca Ferreira', '(11) 92222-3318', 'referral', 'experimental_agendada', 'Marina', 61, '20/08 14:42', 'Agendada para quinta 9h'),
    (v_studio_1, 'Diego Almeida', '(11) 92259-3371', 'googleAds', 'ativo', 'Jonas', 90, '19/08 15:49', 'Fechou mensal'),
    (v_studio_1, 'Patrícia Nunes', '(11) 92296-3424', 'instagram', 'qualificacao', 'Marina', 52, '18/08 16:56', 'Dor lombar, indicação médica'),
    (v_studio_1, 'Eduardo Castro', '(11) 92333-3477', 'aggregators', 'novo', 'Jonas', 28, '17/08 17:03', 'Só pediu preço'),
    (v_studio_1, 'Larissa Gomes', '(11) 92370-3530', 'instagram', 'compareceu', 'Marina', 71, '16/08 08:10', 'Achou o valor alto'),
    (v_studio_1, 'Thiago Rocha', '(11) 92407-3583', 'direct', 'experimental_agendada', 'Jonas', 58, '15/08 09:17', 'Confirmar presença amanhã'),
    (v_studio_2, 'Camila Duarte', '(11) 92000-3000', 'referral', 'novo', 'Marina', 30, '26/08 08:00', 'Indicação de aluna atual'),
    (v_studio_2, 'Marcelo Souza', '(11) 92037-3053', 'instagram', 'contato', 'Jonas', 22, '25/08 09:07', 'Lead frio, sem resposta há 2 dias'),
    (v_studio_2, 'Vanessa Ramos', '(11) 92074-3106', 'instagram', 'perdido', 'Marina', 12, '24/08 10:14', 'Achou caro comparado à academia'),
    (v_studio_2, 'Roberto Alves', '(11) 92111-3159', 'direct', 'qualificacao', 'Jonas', 40, '23/08 11:21', 'Passou na porta, quer saber de plano'),
    (v_studio_2, 'Simone Cardoso', '(11) 92148-3212', 'referral', 'experimental_agendada', 'Marina', 55, '22/08 12:28', 'Agendada sexta 18h'),
    (v_studio_2, 'André Teixeira', '(11) 92185-3265', 'other', 'novo', 'Jonas', 18, '21/08 13:35', 'Preencheu formulário do site'),
    (v_studio_2, 'Tatiane Pinto', '(11) 92222-3318', 'referral', 'ativo', 'Marina', 80, '20/08 14:42', 'Fechou 2x/semana'),
    (v_studio_3, 'Renata Azevedo', '(11) 92000-3000', 'medical', 'ativo', 'Marina', 95, '26/08 08:00', 'Encaminhada por ortopedista'),
    (v_studio_3, 'Felipe Barbosa', '(11) 92037-3053', 'google', 'compareceu', 'Jonas', 74, '25/08 09:07', 'Avaliação postural feita, decidindo'),
    (v_studio_3, 'Aline Freitas', '(11) 92074-3106', 'medical', 'experimental_agendada', 'Marina', 66, '24/08 10:14', 'Encaminhamento pós-cirúrgico'),
    (v_studio_3, 'Gustavo Mendes', '(11) 92111-3159', 'googleAds', 'ativo', 'Jonas', 89, '23/08 11:21', 'Fechou semestral'),
    (v_studio_3, 'Débora Lima', '(11) 92148-3212', 'aggregators', 'novo', 'Marina', 25, '22/08 12:28', 'Achou no Doctoralia'),
    (v_studio_3, 'Márcio Nunes', '(11) 92185-3265', 'medical', 'qualificacao', 'Jonas', 48, '21/08 13:35', 'Aguardando liberação médica'),
    (v_studio_3, 'Priscila Costa', '(11) 92222-3318', 'google', 'ativo', 'Marina', 91, '20/08 14:42', 'Fechou mensal'),
    (v_studio_3, 'Vinícius Rocha', '(11) 92259-3371', 'instagram', 'contato', 'Jonas', 33, '19/08 15:49', 'Perguntou sobre hérnia de disco');
end $$;
