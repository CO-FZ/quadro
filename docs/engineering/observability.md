# Observability — Quadro CO-FZ

---

## Estado atual

**Logger:** `lib/logger/` — logger estruturado com redação automática de campos sensíveis (Sprint 07-B).

Integrado em:
- Server Actions (erros e eventos críticos)
- Edge Function `sync-sheets` (falhas de sync)
- Callback de auth (erros de OAuth e whitelist)

**Redação automática:** campos `password`, `token`, `key`, `secret`, `credential` são substituídos por `[REDACTED]` no output.

---

## Uso

```typescript
import { logger } from '@/lib/logger'

logger.info('task.created', { task_id: id, created_by: userId })
logger.warn('sync.failed', { task_id: id, error: err.message })
logger.error('auth.callback.error', { code, message })
```

---

## Lacunas atuais

| Item | Prioridade | Sprint |
|------|-----------|--------|
| Trace IDs / correlation IDs | P2 | backlog |
| Logs da Edge Function expõem `credential_keys` no body do erro | P2 | backlog |
| Métricas / alertas (Datadog, Sentry, OpenTelemetry) | P3 | Sprint 14 |

---

## Roadmap (Sprint 14+)

Trilha Observability prevista no Sprint 08 sprint-plan:

1. Correlation IDs em todas as requisições (`x-request-id`).
2. Structured logging com níveis e destinos configuráveis por ambiente.
3. Integração Sentry para error tracking.
4. OpenTelemetry para traces distribuídos (quando Edge Functions escalarem).
5. Dashboard de métricas operacionais (SLO: LCP, INP, sync latency).

Nenhuma dependência instalada antes de ADR formal.
