# Story 08.2: Architecture Baseline para Modular Monolith + Clean Architecture

**Status:** DONE — 2026-05-16
**Sprint:** 08 — ver [sprint-plan.md](sprint-plan.md)
**ADRs relacionadas:** [ADR 0001](../../spec/adr/0001-rbac-via-supabase-rls.md), [ADR 0003](../../spec/adr/0003-defesa-em-camadas-tasks.md), [ADR 0004](../../spec/adr/0004-google-sheets-sync.md), [ADR 0005](../../spec/adr/0005-estrategia-de-testes.md)
**Origem:** recomendação de evoluir o projeto para DDD + Clean Architecture + Modular Monolith + escalabilidade progressiva.

---

## 1. Visão geral

Definir a arquitetura alvo antes de mover código. Esta story produz os contratos arquiteturais que orientarão a Sprint 09: bounded contexts, módulos, regras de dependência, fluxo de eventos e plano incremental para extrair o módulo `task-board`.

---

## 2. Bounded contexts iniciais

Os contextos devem partir do produto atual e deixar espaços futuros explícitos:

| Contexto | Status | Responsabilidade |
|----------|--------|------------------|
| Identity & Access | atual | autenticação, perfis, roles, whitelist, RLS, autorização |
| Task Board | atual | tarefas, status, responsáveis, Kanban, regras de movimentação |
| Reporting | atual | dashboard, estatísticas, métricas por pessoa/status |
| Administration | atual | gestão de usuários, roles, arquivamento e auditoria administrativa |
| Integrations | atual | Google Sheets sync e futuros providers externos |
| Workspace | futuro | agrupamento multi-board/multi-time |
| Collaboration | futuro | presença, realtime, conflitos e broadcast |
| Asset | futuro | anexos, arquivos, storage e metadados |
| AI | futuro | embeddings, automações, agents e semantic search |

---

## 3. Arquitetura alvo

```text
src/
  modules/
    task-board/
      domain/
      application/
      infrastructure/
      presentation/
    identity/
      domain/
      application/
      infrastructure/
      presentation/
    reporting/
    administration/
    integrations/
  shared/
    domain/
    application/
    infrastructure/
    presentation/
```

Regras:

- `domain` não importa React, Next, Supabase, banco, storage ou browser APIs.
- `application` orquestra use cases e depende de portas/interfaces.
- `infrastructure` implementa adapters concretos: Supabase, cache, storage, realtime, providers.
- `presentation` adapta dados para UI e Server Actions.
- `app/` continua sendo a camada de roteamento Next.js.
- Server Actions devem ser facades finas chamando use cases.

---

## 4. Critérios de aceite

### CA-01 — Bounded contexts documentados

- **Given** os contextos atuais e futuros listados nesta story
- **When** `docs/architecture/bounded-contexts.md` for criado
- **Then** cada contexto tem responsabilidade, entidades principais, eventos candidatos, integrações e fronteiras explícitas.

### CA-02 — Clean Architecture documentada

- **Given** a estrutura alvo em `src/modules`
- **When** `docs/architecture/clean-architecture.md` for criado
- **Then** contém regras de dependência, exemplos permitidos/proibidos e sequência de migração.

### CA-03 — ADR de arquitetura aberto

- **Given** o projeto ainda não tem ADR sobre Modular Monolith + Clean Architecture
- **When** esta story terminar
- **Then** um ADR proposto existe para formalizar a decisão antes de mover código.

### CA-04 — ADR de state architecture aberto

- **Given** a recomendação cita Zustand, TanStack Query e Event Bus
- **When** esta story terminar
- **Then** um ADR proposto existe documentando a separação entre UI State, Domain State, Server State e Collaborative State, sem instalar dependências ainda.

### CA-05 — Event flow inicial

- **Given** tarefas são o principal domínio operacional atual
- **When** `docs/architecture/event-flow.md` for criado
- **Then** documenta pelo menos os fluxos `CreateTask`, `MoveTask`, `ArchiveTask` e `SyncTaskToSheets` no formato command → use case → domain event → adapter.

### CA-06 — Sprint 09 preparada

- **Given** a arquitetura alvo está documentada
- **When** esta story terminar
- **Then** há uma seção em `docs/sprints/08/sprint-plan.md` descrevendo a primeira fatia de código da Sprint 09 para `task-board`.

### CA-07 — Sem dependência nova

- **Given** esta sprint é baseline arquitetural
- **When** o diff é revisado
- **Then** `package.json`, lockfile, migrations e código de produção não mudam.

---

## 5. Escopo negativo

- Não criar `src/modules` ainda.
- Não migrar `lib/actions/tasks.ts`.
- Não substituir Supabase queries.
- Não criar Event Bus em runtime.
- Não instalar Zustand, TanStack Query, Turbo, OpenTelemetry, Sentry ou Yjs.
- Não mexer em auth, RLS, schema ou Google Sheets sync.

---

## 6. Como testar

```bash
pnpm typecheck
pnpm lint
```

Validação manual:

- Conferir se cada bounded context tem fronteira clara.
- Conferir se nenhuma regra contradiz ADRs aceitos.
- Conferir se Sprint 09 tem uma primeira fatia pequena o suficiente para revisão humana.
