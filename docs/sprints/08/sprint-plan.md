# Sprint 08 — Architecture Foundation & Docs Source of Truth

**Sprint goal (1 frase):** transformar `docs/` no source of truth de engenharia e criar a base incremental para refatorar o Quadro em Modular Monolith + Clean Architecture + DDD sem big rewrite.

**Data de início:** 2026-05-16
**Capacidade:** 1 dev humano + 1 agente
**Status:** aguardando aprovação do Plan Artifact
**Sprint precedente:** [Sprint 07-C — Fechar a suíte e os P0s remanescentes](../07C/sprint-plan.md)

---

## 1. Backlog selecionado

| ID | Story / Task | Tipo | Estimativa | Owner | Prioridade | Status |
|----|--------------|------|-----------|-------|------------|--------|
| Story 08.1 | Docs Source of Truth | story | M | agente | P0 | aguardando |
| Story 08.2 | Architecture Baseline para Modular Monolith + Clean Architecture | story | M | agente | P0 | aguardando |
| Gate G1 | Revisão humana do mapa de bounded contexts | gate humano | — | humano | P0 | aguardando |
| Gate G2 | Aprovação dos ADRs arquiteturais antes de mover código | gate humano | — | humano | P0 | aguardando |

---

## 2. Objetivo da sprint

Esta sprint inicia a execução das recomendações arquiteturais sem alterar comportamento de produto. O foco é criar contratos de engenharia que permitam refatoração progressiva:

- `docs/` deixa de ser apenas histórico de sprints e passa a ter áreas canônicas: arquitetura, produto, API e engenharia.
- Bounded contexts e linguagem ubíqua passam a ser explícitos.
- A arquitetura alvo é documentada com regras de dependência, módulos e sequência de migração.
- ADRs necessários são abertos antes de qualquer refactor estrutural.
- A primeira fatia técnica fica planejada para começar pelo módulo `task-board`, que hoje concentra o maior acoplamento entre UI, Server Actions e Supabase.

---

## 3. Diagnóstico usado como entrada

### Estado atual

- Next.js 16.2.4 com App Router, Tailwind v4, TypeScript strict e Supabase.
- CI já cobre typecheck, lint, unit, integration, db e e2e.
- `docs/` já contém PRD, glossary, ADRs, sprint plans e memory logs.
- O domínio de tarefas ainda está acoplado a `lib/supabase/types.ts`.
- Páginas Server Components consultam Supabase diretamente.
- Server Actions misturam autorização, regra de aplicação, persistência e cache invalidation.
- Componentes client conhecem actions e tipos de persistência diretamente.

### Implicação

O projeto não precisa de uma reescrita. Precisa de fronteiras explícitas para impedir acoplamento exponencial conforme entrarem colaboração, realtime, observabilidade, permissões avançadas e IA.

---

## 4. Sequência de execução

```text
[agente] Story 08.1 — criar estrutura canônica de docs
    |
    v
[agente] Story 08.2 — documentar arquitetura alvo e plano de migração
    |
    v
[humano] Gate G1 — revisar bounded contexts e linguagem ubíqua
    |
    v
[humano] Gate G2 — aprovar ADRs antes da Sprint 09 tocar código estrutural
```

---

## 5. Roadmap macro incorporado

Esta sprint não tenta executar todo o roadmap em uma única entrega. Ela transforma as recomendações em trilhas versionadas:

| Trilha | Sprints sugeridas | Resultado esperado |
|--------|-------------------|--------------------|
| Engineering Foundation | 08 | Docs canônicas, ADRs, git flow, coding standards, arquitetura alvo |
| Domain Discovery | 08-09 | Bounded contexts, glossary expandido, mapa de entidades e eventos |
| Clean Architecture Refactor | 09-10 | `src/modules/task-board` com domain/application/infrastructure/presentation |
| State Architecture | 10 | Separação UI State, Server State, Domain State e Optimistic State |
| CQRS + Application Services | 11 | Commands, queries, handlers e domain events |
| Realtime Architecture | 12 | Protocolo de sync, gateway realtime e estratégia futura CRDT/Yjs |
| Persistence & Infrastructure | 13 | Repositories concretos, transações, cache e storage abstraction |
| Observability | 14 | Logs, traces, metrics e eventos operacionais |
| Performance Engineering | 15 | Virtualization, memoization, lazy loading e rendering budget |
| Security & Multi-Tenancy | 16 | RBAC expandido, tenant isolation, CSP e rate limiting |
| AI Architecture | 17 | `modules/ai` desacoplado do core |
| Open Source Maturity | 18 | CONTRIBUTING, RFC process, issue/PR templates |

---

## 6. Definition of Ready

- [x] PRD inicial existe em `docs/prd/00-prd.md`.
- [x] Glossário inicial existe em `docs/prd/01-glossary.md`.
- [x] ADRs existentes cobrem RBAC/RLS, whitelist, defesa em camadas, Google Sheets e estratégia de testes.
- [x] Suite operacional existe e passa em typecheck/lint no WSL.
- [ ] Humano aprova este Plan Artifact antes de execução.

---

## 7. Definition of Done

- [ ] `docs/architecture/overview.md` criado com visão macro.
- [ ] `docs/architecture/clean-architecture.md` criado com regras de dependência.
- [ ] `docs/architecture/bounded-contexts.md` criado com contextos atuais e futuros.
- [ ] `docs/architecture/event-flow.md` criado com fluxo command → domain event → adapters.
- [ ] `docs/product/vision.md` e `docs/product/roadmap.md` criados ou derivados do PRD.
- [ ] `docs/api/contracts.md` criado com contratos internos relevantes.
- [ ] `docs/engineering/coding-standards.md`, `git-flow.md`, `testing-strategy.md` e `ci-cd.md` criados ou consolidados.
- [ ] `docs/adr/README.md` criado com índice e relação com `docs/spec/adr`.
- [ ] ADR de Modular Monolith + Clean Architecture aberto como proposto.
- [ ] ADR de State Architecture aberto como proposto, sem instalar dependências ainda.
- [ ] Plano da Sprint 09 preparado para primeira fatia de código no módulo `task-board`.
- [ ] `pnpm typecheck && pnpm lint` verdes.

---

## 8. Escopo negativo

- Não mover código para `src/modules` nesta sprint.
- Não instalar Turbo, Husky, Commitlint, Prettier, Zustand, TanStack Query, Sentry, OpenTelemetry ou Yjs nesta sprint.
- Não alterar schema Supabase.
- Não alterar rotas públicas, SEO, auth ou policies RLS.
- Não criar realtime engine ainda.
- Não implementar multi-tenancy.
- Não criar módulo de IA ainda.

---

## 9. Riscos

| Risco | Mitigação |
|-------|-----------|
| Big rewrite disfarçada de arquitetura | Escopo desta sprint é docs + ADRs; código estrutural só na Sprint 09 |
| Arquitetura genérica demais | Bounded contexts partem do produto atual: tarefas, identidade, relatório, administração e integrações |
| Docs virarem duplicação morta | Cada doc canônica aponta para ADRs, sprints e arquivos de código responsáveis |
| Conflito entre ADR existente e arquitetura nova | Se houver conflito, abrir ADR substitutiva antes de implementar |
| Overengineering inspirado em Miro/Figma cedo demais | Contextos futuros ficam documentados como futuro, não implementados agora |

---

## 10. Plano para Sprint 09

Se Sprint 08 fechar, a Sprint 09 deve iniciar a primeira refatoração com baixo risco:

1. Criar `src/modules/task-board/domain` com tipos puros de tarefa.
2. Migrar regras puras de status e normalização para domínio/application.
3. Criar porta `TaskRepository`.
4. Criar adapter Supabase sem mudar comportamento.
5. Fazer `lib/actions/tasks.ts` virar facade temporária para use cases.
6. Manter `app/` e componentes funcionando com os mesmos props até a camada presentation ser extraída.

---

## 11. Retrospectiva (preencher ao final)

**O que funcionou:**
- `[...]`

**O que não funcionou:**
- `[...]`

**O que vamos mudar na próxima sprint:**
- `[...]`

**Métrica da sprint:**

| Métrica | Valor |
|---------|-------|
| Docs canônicas criadas | — |
| ADRs abertas | — |
| Bounded contexts aprovados | — |
| Arquivos de código alterados | 0 esperado |
