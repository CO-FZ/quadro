# ADR Index — Quadro CO-FZ

Arquivo de índice canônico. ADRs vivem fisicamente em [`docs/spec/adr/`](../spec/adr/).
Migração física para `docs/adr/` planejada para sprint dedicada futura.

---

## ADRs existentes

| # | Título | Status | Arquivo |
|---|--------|--------|---------|
| 0001 | RBAC via Supabase RLS | Aceito | [0001-rbac-via-supabase-rls.md](../spec/adr/0001-rbac-via-supabase-rls.md) |
| 0002 | Whitelist Emails Trigger | Aceito | [0002-whitelist-emails-trigger.md](../spec/adr/0002-whitelist-emails-trigger.md) |
| 0003 | Defesa em Camadas — Tasks | Aceito | [0003-defesa-em-camadas-tasks.md](../spec/adr/0003-defesa-em-camadas-tasks.md) |
| 0004 | Google Sheets Sync | Aceito | [0004-google-sheets-sync.md](../spec/adr/0004-google-sheets-sync.md) |
| 0005 | Estratégia de Testes em Camadas | Proposto | [0005-estrategia-de-testes.md](../spec/adr/0005-estrategia-de-testes.md) |
| 0006 | Modular Monolith + Clean Architecture | Proposto | [0006-modular-monolith-clean-architecture.md](../spec/adr/0006-modular-monolith-clean-architecture.md) |
| 0007 | State Architecture | Proposto | [0007-state-architecture.md](../spec/adr/0007-state-architecture.md) |

---

## Status

| Status | Significado |
|--------|------------|
| Proposto | Aberto para revisão — não implementar até aprovação humana |
| Aceito | Decisão final — seguir obrigatoriamente |
| Substituído | Superado por ADR mais novo — ver link |
| Obsoleto | Não mais aplicável |

---

## Como abrir um novo ADR

1. Copie o template de qualquer ADR aceito.
2. Nomeie `NNNN-titulo-kebab-case.md` seguindo a sequência.
3. Status inicial: `Proposto`.
4. Abra PR — o ADR só vira `Aceito` após revisão humana explícita.
5. Adicione entrada neste índice no mesmo PR.
