# Story 02: Gestão de Tarefas (Kanban e Dashboard)

**Sprint:** 02 — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [0001 RBAC RLS](../../spec/adr/0001-rbac-via-supabase-rls.md)
**Glossário:** [docs/prd/01-glossary.md](../../prd/01-glossary.md)

## 1. Visão Geral
O sistema de Gestão de Tarefas visa permitir que coordenadores e efetivos registrem, aloquem e acompanhem as atividades diárias por meio de um Kanban visual e um Dashboard gerencial. O objetivo é evitar a perda de prazos e otimizar a distribuição de demandas entre a Divisão Técnica (DT) e a Divisão Administrativa (DA).

## 2. Requisitos de Negócio (Regras)
- **Criação de Tarefa:** A tarefa deve conter:
  - Título
  - Data de Início
  - Data de Fim (Prazo)
  - Setor (DT ou DA)
  - URL do Google Drive (opcional, para evidências do trabalho)
- **Alocação Múltipla:** Uma tarefa pode ter um ou mais usuários alocados.
- **Avatares:** O card da tarefa e a visualização detalhada devem exibir as fotos de perfil (Google/Gmail) dos usuários alocados.
- **Integração Visual com GDrive:** O link para a evidência no Google Drive deve ser clicável e utilizar o ícone oficial do Google Drive.
- **Indicadores de Prazo:** O card da tarefa deve exibir visualmente se a tarefa está "No Prazo" ou "Atrasada", baseando-se na Data de Fim versus data atual (para tarefas não finalizadas).
- **Colunas do Kanban:**
  1. **Backlog:** Tarefa criada, mas ainda sem responsável ou aguardando priorização.
  2. **Alocada:** Tarefa foi vinculada a um ou mais usuários, mas ainda não iniciada.
  3. **Em Desenvolvimento:** Usuário(s) trabalhando ativamente na tarefa.
  4. **Finalizada:** Tarefa concluída (evidência do Drive preenchida, caso aplicável).

## 3. Requisitos de UI/UX
- **Kanban Board:** Interface drag-and-drop (ou botões de ação para mobile) para mover tarefas entre as colunas.
- **Resumo no Card:** O card no Kanban deve ser conciso:
  - Título
  - Avatares (fotos) dos participantes
  - Ícone do Google Drive (se houver link)
  - Badge/Flag do Setor (DT ou DA)
  - Badge/Flag de Prazo (Verde = No Prazo / Vermelho = Atrasada)
- **Dashboard Geral:** Uma tela separada contendo:
  - Número total de atividades por usuário.
  - Indicador de status (Quantas Finalizadas vs Quantas Em Desenvolvimento).

## 4. Critérios de Aceite
- [ ] Coordenadores podem criar tarefas e alocá-las a qualquer usuário.
- [ ] Usuários podem visualizar o Kanban com as tarefas do seu setor.
- [ ] O Card do Kanban mostra as informações resumidas exigidas e o link do GDrive é funcional.
- [ ] A flag de Atraso é calculada automaticamente (ex: `data_fim < hoje` e `status != 'finalizada'`).
- [ ] Ao arrastar/mover um card, o banco de dados é atualizado em tempo real (ou optimistic UI).
- [ ] O Dashboard reflete corretamente as contagens por usuário baseadas no banco de dados.

## 5. Modelagem de Dados Prevista (Schema)

> **Implementado** em [supabase/migrations/20260506000001_task_management.sql](../../../supabase/migrations/20260506000001_task_management.sql).

**Tabela `tasks`**
- `id` (uuid)
- `title` (text)
- `description` (text, opcional)
- `start_date` (date)
- `end_date` (date)
- `sector` (enum: 'DT', 'DA')
- `status` (enum: 'backlog', 'alocada', 'em_desenvolvimento', 'finalizada')
- `drive_url` (text, nullable)
- `created_by` (uuid, fk -> profiles)
- `created_at` (timestamptz)

**Tabela `task_assignees`**
- `task_id` (uuid, fk -> tasks)
- `user_id` (uuid, fk -> profiles)
- `assigned_at` (timestamptz)
- *(Primary Key: task_id, user_id)*
