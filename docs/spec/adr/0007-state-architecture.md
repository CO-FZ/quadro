# ADR 0007 — State Architecture

**Status:** `Proposto`
**Data:** 2026-05-16
**Autor:** Agente (Sprint 08)
**Requer aprovação humana em Gate G2. Nenhuma dependência instalada nesta sprint.**

---

## Contexto

O estado do Quadro hoje é gerenciado implicitamente:

- **Server State:** Server Components leem Supabase diretamente; invalidado com `revalidatePath`.
- **UI State:** `useState` local para modais, formulários e drag-and-drop.
- **Optimistic State:** `useOptimistic` no Kanban para drag-and-drop.
- **Domain State:** inexistente como camada explícita — regras inline nas Server Actions.

Esta mistura funciona para v1. Com Collaboration (realtime), AI (embeddings) e Workspace (multi-board) entrando, a falta de separação vai gerar conflitos de estado e loops de atualização.

---

## Decisão

Separar estado em 4 categorias explícitas:

| Categoria | Responsabilidade | Tecnologia atual | Tecnologia alvo |
|-----------|-----------------|-----------------|----------------|
| **UI State** | Estado local de componentes (modais, forms, hover) | `useState` | `useState` (mantém) |
| **Server State** | Cache de dados remotos, refetch, invalidation | `revalidatePath` + Server Components | TanStack Query (Sprint 10) |
| **Domain State** | Regras de negócio e transições de estado | inline em actions | `domain/` module (Sprint 09) |
| **Collaborative State** | Presença, cursores, conflitos realtime | inexistente | Yjs/CRDT (Sprint 12+) |

### Princípios

1. **UI State** nunca contém dados de servidor — apenas estado efêmero de interface.
2. **Server State** é o cache de queries — nunca fonte de verdade de regras de negócio.
3. **Domain State** vive no módulo `domain/` — imutável, testável, sem I/O.
4. **Collaborative State** é isolado no contexto Collaboration — não contamina domain.

### Sequência de adoção

- **Sprint 09:** Domain State explícito via `task-board/domain`.
- **Sprint 10:** Instalar e configurar TanStack Query para Server State client-side.
- **Sprint 10:** Avaliar necessidade de Zustand para UI State global (hoje: `useState` por componente).
- **Sprint 12+:** Collaborative State com Supabase Realtime + avaliação CRDT.

---

## Consequências

**Positivas:**

- Fonte de verdade clara por categoria de estado.
- Server State client-side com cache, retries e refetch automático (TanStack Query).
- Domain State testável em isolamento.
- Collaborative State desacoplado do core.

**Negativas:**

- TanStack Query adiciona indireção para queries simples.
- Migração de `revalidatePath` para TanStack Query requer trabalho em Sprint 10.
- Zustand só justifica se UI State global crescer — avaliar em Sprint 10.

---

## O que NÃO fazer antes deste ADR ser aceito

- Não instalar Zustand, TanStack Query, Yjs ou qualquer dependência nova.
- Não criar Event Bus em runtime.
- Não alterar `lib/actions/`, `app/` ou componentes.

---

## Referências

- [ADR 0006 — Modular Monolith + Clean Architecture](0006-modular-monolith-clean-architecture.md)
- [docs/architecture/overview.md](../architecture/overview.md)
- [docs/architecture/event-flow.md](../architecture/event-flow.md)
