# Realtime Architecture — Quadro CO-FZ

**Status:** futuro — Sprint 12+
**Contexto alvo:** Collaboration (ver [bounded-contexts.md](bounded-contexts.md))

---

## Estado atual

Sem realtime. Dados atualizados via:

- Server Components: re-fetch na navegação.
- `useOptimistic`: atualização local otimista no drag-and-drop Kanban.
- `revalidatePath`: invalidação server-side após mutação.

Suficiente para v1 (equipe pequena, sem edição simultânea crítica).

---

## Arquitetura alvo (Sprint 12+)

```text
Supabase Realtime (Postgres Changes / Broadcast)
  │
  ▼
RealtimeGateway (infrastructure/realtime/)
  │
  ├─ onTaskMoved(event) → dispatch local state update
  ├─ onPresenceUpdate(event) → Collaboration context
  └─ onBroadcast(event) → futuro CRDT/Yjs
```

**Decisões pendentes:**

- Supabase Realtime Broadcast vs. WebSocket próprio.
- Estratégia de conflito: last-write-wins vs. CRDT (Yjs).
- Quando criar: ao entrar o contexto Workspace/Collaboration.

**Restrição:** não implementar antes de ADR formal e aprovação no Gate G2 da sprint correspondente.
