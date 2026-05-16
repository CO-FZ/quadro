# WebSocket / Realtime Events — Quadro CO-FZ

**Status:** futuro — Sprint 12+

Nenhum evento realtime implementado em v1. O produto opera em modo request-response com `revalidatePath` e `useOptimistic`.

Quando o contexto Collaboration for implementado, este documento descreverá:

- Protocolo de conexão (Supabase Realtime Broadcast vs. WebSocket próprio).
- Eventos publicados e subscritos por contexto.
- Estratégia de conflito e reconexão.

Ver [docs/architecture/realtime.md](../architecture/realtime.md) e ADR correspondente (a abrir na sprint de Collaboration).
