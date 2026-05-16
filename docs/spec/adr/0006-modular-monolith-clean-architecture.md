# ADR 0006 — Modular Monolith + Clean Architecture

**Status:** `Proposto`
**Data:** 2026-05-16
**Autor:** Agente (Sprint 08)
**Requer aprovação humana em Gate G2 antes da Sprint 09 mover código estrutural.**

---

## Contexto

O Quadro CO-FZ atingiu v1 com todas as user stories entregues. A codebase funciona, mas apresenta acoplamento crescente:

- Server Actions misturam autorização, regra de negócio, persistência e cache invalidation (`lib/actions/tasks.ts`).
- Páginas Server Components consultam Supabase diretamente.
- Componentes client conhecem tipos de persistência (`Database['public']['Tables']`).
- `is_admin()` SECURITY DEFINER foi introduzido em `20260507000004` sem ADR — funciona mas cria dependência implícita do banco no contrato de autorização.

O produto ainda é pequeno. Este é o momento certo para estabelecer fronteiras antes que o acoplamento se torne exponencial com features futuras (Workspace, Collaboration, AI).

---

## Decisão

Adotar **Modular Monolith + Clean Architecture** de forma incremental, sem big rewrite.

### Estrutura alvo

```text
src/
  modules/
    task-board/
      domain/
      application/
      infrastructure/
      presentation/
    identity/
    reporting/
    administration/
    integrations/
  shared/
    domain/
    application/
    infrastructure/
    presentation/
app/          ← roteamento Next.js (não muda)
```

### Regras de dependência

1. `domain` não importa React, Next, Supabase, banco ou browser APIs.
2. `application` depende de portas (interfaces) — nunca de adapters concretos.
3. `infrastructure` implementa adapters concretos (Supabase, cache, storage).
4. `presentation` adapta use cases para Server Components e Server Actions.
5. Server Actions são facades finas: Zod input validation → call use case → return `{ ok: true } | { ok: false, code }`.

### Sequência de migração

| Sprint | Entrega |
|--------|---------|
| 09 | `task-board/domain` + `task-board/application` + `SupabaseTaskRepository` |
| 10 | State architecture + `task-board/presentation` |
| 11 | `identity` module |
| 12+ | `reporting`, `administration`, `integrations` |

### `is_admin()` SECURITY DEFINER

A função `is_admin()` em `20260507000004` é um adapter de infraestrutura correto para RLS policies no banco. Permanece no banco. A camada `domain` **não** deve chamar `is_admin()` diretamente; a autorização server-side usa `requireRole()` de `lib/auth/`. ADR 0001 deve ser revisado com esta distinção na Sprint 09.

---

## Consequências

**Positivas:**

- Domínio testável com Vitest unit sem mocks de I/O.
- Acoplamento controlado por interfaces explícitas.
- Futuras features (Realtime, AI, multi-tenant) entram como novos módulos.
- Refatoração progressiva — sem parar entrega de produto.

**Negativas:**

- Custo de migração inicial (Sprint 09–11).
- Indireção adicional para features simples.
- Requer disciplina de revisão para não violar regras de dependência.

---

## Alternativas consideradas

| Alternativa | Descartada por |
|-------------|----------------|
| Manter estrutura flat atual | Acoplamento cresce com features futuras |
| Microfrontends | Overhead prematuro para equipe pequena |
| Big rewrite completa | Risco alto, paralisa produto |

---

## Referências

- [docs/architecture/clean-architecture.md](../architecture/clean-architecture.md)
- [docs/architecture/bounded-contexts.md](../architecture/bounded-contexts.md)
- [ADR 0003 — Defesa em Camadas](0003-defesa-em-camadas-tasks.md)
