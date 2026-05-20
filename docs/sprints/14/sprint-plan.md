# Sprint 14 — Qualidade e Robustez

- **Status:** CONCLUÍDA
- **Início:** 19/05/2026
- **Conclusão:** 19/05/2026
- **Objetivo:** Eliminar duplicação de código de formatação de datas; corrigir race condition do LAST_ADMIN a nível de banco.

---

## Stories

### Story 14.1 — Utilitários de Data `pt-BR`

**Problema:** 8 ocorrências de `new Date(...).toLocaleDateString('pt-BR')` espalhadas em 4 componentes. Sem centralização: timezone bugs se replicam.

**Solução:**

- `formatDateBr(dateStr: string)` — para strings `YYYY-MM-DD` (appende `T00:00:00` para evitar UTC shift)
- `formatDateTimeBr(isoStr: string)` — para timestamps ISO completos
- Substituir todas as ocorrências em AdminView, TaskDetailModal, TaskCard, ProfileView
- MatrizView: `formatDay()` encapsulada com opções específicas — manter como está

**Arquivos:** `lib/utils/format.ts`, 4 componentes

---

### Story 14.2 — LAST_ADMIN Race Condition (DB-level)

**Problema:** Guard atual (`count admins → if <= 1, block`) tem TOCTOU: dois admins simultâneos podem ambos passar o check e ambos rebaixar o último admin, deixando o sistema sem admin.

**Solução:** BEFORE UPDATE trigger na tabela `profiles` com `pg_advisory_xact_lock()` e contagem no momento do lock. A nível de aplicação o guard continua para UX imediata; o trigger é a barreira definitiva.

**Arquivos:** nova migration `supabase/migrations/`

---

## Critérios de aceite

- [ ] `pnpm typecheck` verde
- [ ] `pnpm test:unit` verde
- [ ] Zero ocorrências de `toLocaleDateString` fora de `formatDay` no MatrizView
- [ ] Trigger LAST_ADMIN presente na migration e sem quebrar RLS
