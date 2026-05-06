# Glossário — quadro

> Vocabulário canônico do produto. Usado por agentes (carregado no bootstrap mínimo de toda story — [SKILL.md §D](../../.gemini/antigravity/skills/agent-product-harness/agent-product-harness/SKILL.md)) e por humanos novos no projeto.
>
> **Regra:** se um termo aparece em discovery, PRD, spec, story, ADR ou commit message, ele tem que estar aqui. Se não está, o termo é candidato a renomear ou a entrar.

**Última atualização:** 2026-05-06

---

## Organização

| Termo | Definição |
|---|---|
| **CO-FZ** | Comissão de Obras de Fortaleza. Cliente único da v1. |
| **DT** | Divisão Técnica da CO-FZ. Setor de tarefa. |
| **DA** | Divisão Administrativa da CO-FZ. Setor de tarefa. |
| **Setor** | DT ou DA. Atributo obrigatório de uma tarefa (`tasks.sector`). |

## Papéis (Roles)

Definidos como enum `public.app_role` no banco — ver [ADR 0001](../spec/adr/0001-rbac-via-supabase-rls.md).

| Termo | Definição |
|---|---|
| **Admin** | Acesso total. Gerencia Whitelist e roles de outros usuários. Bootstrap é manual via SQL ([ADR 0002](../spec/adr/0002-whitelist-emails-trigger.md)). |
| **Coordenador** | Cria e aloca tarefas. Não mexe em Whitelist nem em roles. |
| **Efetivo** | Default na criação do perfil. Vê todas as tarefas (RLS), mas só pode atualizar as em que está alocado. |

## Acesso

| Termo | Definição |
|---|---|
| **Whitelist** | Tabela `public.whitelist` com `identifier` que é e-mail exato ou domínio (`@cofz.gov.br`). Trigger `check_whitelist` barra signup fora dela. |
| **Profile** | Linha em `public.profiles`, criada por trigger pós-signup. Carrega `role`, `email`, `avatar_url`. |

## Tarefas e Kanban

| Termo | Definição |
|---|---|
| **Tarefa** (`task`) | Unidade de trabalho. Tem título, datas (start/end), setor, status, opcional drive_url. |
| **Alocação** | Relação N-M entre `task` e `profile` via `public.task_assignees`. Uma tarefa pode ter ≥1 alocados. |
| **Backlog** | Coluna 1. Tarefa criada, ainda sem responsável ou aguardando priorização. |
| **Alocada** | Coluna 2. Já vinculada a ≥1 efetivo, não iniciada. |
| **Em Desenvolvimento** | Coluna 3. Status enum `em_desenvolvimento`. Em execução ativa. |
| **Finalizada** | Coluna 4. Status enum `finalizada`. Idealmente com `drive_url` preenchido como evidência. |
| **Atrasada** | Estado calculado (não enum): `end_date < hoje AND status != 'finalizada'`. Vira flag visual no card. |

## UI

| Termo | Definição |
|---|---|
| **FAB** | Floating Action Button. Botão flutuante inferior-direito para "Nova Tarefa". Visível só para Admin/Coordenador. |
| **Mobile-first** | Layout primário desenhado para telas ≤ 414px. Desktop é redistribuição, não experiência separada. |
| **Drive URL** | Link Google Drive em `tasks.drive_url`. Renderizado no card com ícone oficial do GDrive. |

## Métricas

| Termo | Definição |
|---|---|
| **North Star** | Adesão diária. 100% da equipe DT+DA reportando atividade ≥1×/dia. |
| **`user_task_stats`** | View Postgres que agrega total / finalizadas / em desenvolvimento por usuário. Base do Dashboard. |
