# Story 23.6 — ADR 0014 + docs de sprint/memória

**Sprint:** 23
**Prioridade:** P2
**Depende de:** —
**Arquivos afetados:** `docs/spec/adr/0014-modelo-de-ferias-afastamentos.md`, `docs/memory/sprints/23/*`

## O que fazer

### 1. ADR 0014 — Modelo de Férias e Afastamentos

Criado nesta sprint (ver arquivo). Deve registrar:

- **Contexto:** necessidade de gerir indisponibilidade do efetivo (férias, instalação, dispensa) e refleti-la na Matriz.
- **Decisão:**
  - Novo bounded context `src/modules/personnel` (não estender `task-board`).
  - Tabela `leaves` + enum `leave_type` com 3 valores fixos.
  - RLS: leitura para todo autenticado; escrita admin/coordenador.
  - Reflexo na Matriz por badge na célula; aba Gantt anual no `/admin`.
  - Relaxamento do guard de `/admin` para admin+coordenador, com gating de abas por role.
- **Alternativas rejeitadas:** (a) modelar afastamento como `task is_servico` especial — polui o domínio de tarefas; (b) tabela única `events` genérica — over-engineering para 3 tipos.
- **Consequências:** novas políticas RLS, novo módulo, `/admin` deixa de ser exclusivamente admin.

### 2. Log de memória de execução

`docs/memory/sprints/23/` — resumo da execução conforme o protocolo de contexto do projeto (mesmo formato dos resumos existentes em `docs/memory/sprints/`).

## Critérios de aceite

- [ ] ADR 0014 commitado e referenciado no `sprint-plan.md`
- [ ] ADRs impactados (0001, 0006, 0007, 0009) citam 0014 onde fizer sentido
- [ ] Log de memória da sprint criado
