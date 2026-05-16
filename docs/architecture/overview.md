# Architecture Overview — Quadro CO-FZ

**Última atualização:** 2026-05-16
**Sprint:** 08 — Architecture Foundation

---

## Estado atual

```text
Next.js 16.2 (App Router)
  app/
    (marketing)/    ← login, callback
    (app)/          ← rotas autenticadas (kanban, dashboard, admin, profile)
  components/
    ui/             ← primitives (ThemeToggle, toast, drag-and-drop)
    features/       ← KanbanBoard, TaskCard, AdminPanel, etc.
  lib/
    actions/        ← Server Actions (tasks.ts, admin.ts)
    auth/           ← requireRole, helpers
    i18n/           ← mensagens UI (parcial)
    logger/         ← logger estruturado com redação
    supabase/       ← clients SSR/server
    utils/          ← helpers puros
  supabase/
    migrations/     ← 10 migrations
    functions/      ← Edge Function sync-sheets (Deno)
    tests/          ← pgTAP (3 suítes)
  tests/
    unit/           ← Vitest (59 testes)
    integration/    ← Vitest + Supabase local (scaffolded)
    e2e/            ← Playwright (scaffolded)
```

**Banco de dados:** Supabase PostgreSQL
**Autenticação:** Supabase Auth (Google OAuth + whitelist trigger)
**Deploy:** Vercel (Next.js) + Supabase Cloud
**CI:** GitHub Actions (5 jobs paralelos)

---

## Problemas atuais de acoplamento

| Sintoma | Local | Impacto |
|---------|-------|---------|
| Server Actions misturam auth + regra de negócio + persistência + cache invalidation | `lib/actions/tasks.ts` | baixa testabilidade isolada |
| Páginas consultam Supabase diretamente | `app/(app)/*/page.tsx` | infraestrutura visível na presentation |
| Componentes client conhecem tipos de persistência (`Database['public']['Tables']`) | `components/features/*` | acoplamento com Supabase schema |
| `is_admin()` SECURITY DEFINER sem ADR formal | `supabase/migrations/20260507000004` | risco de quebra silenciosa em refactor |

---

## Arquitetura alvo

Modular Monolith com Clean Architecture. Detalhes em [clean-architecture.md](clean-architecture.md) e [ADR 0006](../spec/adr/0006-modular-monolith-clean-architecture.md).

```text
src/
  modules/
    task-board/         ← primeiro módulo (Sprint 09)
      domain/           ← tipos puros, regras de negócio, sem I/O
      application/      ← use cases, portas/interfaces
      infrastructure/   ← adapters concretos (Supabase, cache)
      presentation/     ← adapters para Server Components e Actions
    identity/
    reporting/
    administration/
    integrations/
  shared/
    domain/
    application/
    infrastructure/
    presentation/
app/                    ← roteamento Next.js (não muda estrutura)
```

---

## Bounded contexts

Ver [bounded-contexts.md](bounded-contexts.md).

---

## Estratégia de migração incremental

```text
Sprint 09  → task-board/domain + task-board/application (sem mover UI)
Sprint 10  → state architecture (TanStack Query) + task-board/presentation
Sprint 11+ → identity, reporting, administration
```

Zero big rewrite. Cada sprint entrega valor sem quebrar comportamento existente.

---

## Decisões arquiteturais

Ver [docs/adr/README.md](../adr/README.md) para índice completo.

---

## Deploy e infra

Ver [deployment.md](deployment.md).

---

## Testes

Ver [docs/engineering/testing-strategy.md](../engineering/testing-strategy.md).
