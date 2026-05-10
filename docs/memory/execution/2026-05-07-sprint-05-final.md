# Final Artifact — Sprint 05 / Story 05 (Admin Enhancements: soft-delete + busca + bulk add)

**Data:** 2026-05-07 (entrega original) / 2026-05-10 (Final Artifact reconstruído retroativamente)
**Story:** [docs/sprints/05/story-05-admin-enhancements.md](../../sprints/05/story-05-admin-enhancements.md)
**Sprint plan:** [docs/sprints/05/sprint-plan.md](../../sprints/05/sprint-plan.md)
**Resumo de fase:** [docs/memory/sprints/05/_summary.md](../sprints/05/_summary.md)
**Plan Artifact (Gate 1):** não registrado à época — sprint executada sem Plan Artifact formal.

> **Nota retroativa.** Este Final Artifact foi escrito em 2026-05-10 como parte da Story 07B.4 (CA-05). Conteúdo reconstruído a partir do diff do commit `7d7a7b3` + estado atual do código + [05/_summary.md](../sprints/05/_summary.md). Não houve Gate 2 humano formal à época.

---

## Sumário (≤ 5 linhas)

Sprint 05 entrega: soft-delete de usuários (`archived_at` em `profiles` + UI badge "Arquivado" + grayscale no avatar), Server Actions `archiveUser`/`restoreUser` com `LAST_ADMIN` guard estendido, busca client-side por `email`/`full_name` em `AdminView`, bulk add na whitelist com parsing por `[\n,;]+` e mensagem agregada de sucesso/duplicado. Migration aplicada em remoto (assumido — não há registro). Como escopo lateral, migration `20260507000004_fix_admin_rls.sql` introduziu `is_admin()` SECURITY DEFINER (deveria ser ADR próprio).

## Arquivos alterados

| Arquivo | Operação | Razão |
|---|---|---|
| [`supabase/migrations/20260507000003_profiles_archived_at.sql`](../../../supabase/migrations/20260507000003_profiles_archived_at.sql) | criar | `ADD COLUMN archived_at timestamptz` em `profiles` |
| [`lib/actions/admin.ts`](../../../lib/actions/admin.ts) | atualizar | `archiveUser`, `restoreUser` com `LAST_ADMIN` guard; `addToWhitelist` aceita lista (split `[\n,;]+`) e retorna mensagem agregada |
| [`lib/supabase/types.ts`](../../../lib/supabase/types.ts) | atualizar | `archived_at` opcional em `Profile` |
| [`components/features/AdminView.tsx`](../../../components/features/AdminView.tsx) | atualizar | `searchQuery` + `filteredProfiles` (useMemo); textarea + bulk parsing; botão "Arquivar"/"Restaurar"; badge "Arquivado"; opacidade + `grayscale` no avatar |
| [`components/features/KanbanBoard.tsx`](../../../components/features/KanbanBoard.tsx) | atualizar (1 linha) | ajuste de tipo decorrente do `archived_at` (sem mudança visível) |
| [`docs/sprints/05/sprint-plan.md`](../../sprints/05/sprint-plan.md) | criar | sprint plan |
| [`docs/sprints/05/story-05-admin-enhancements.md`](../../sprints/05/story-05-admin-enhancements.md) | criar | story |

> **Não alterado mas afetado:** `app/(app)/kanban/page.tsx` continua selecionando `profiles` sem filtrar `archived_at IS NULL` — assignee selector mostra usuários arquivados. Lacuna detectada na auditoria (ver "Riscos").

## Como testar

```bash
pnpm dev

# Soft-delete (CA-01/CA-02)
# 1. /admin → tab Usuários
# 2. Clicar "Arquivar" em um usuário não-admin → confirma → linha fica opaca + badge "Arquivado"
# 3. Clicar "Restaurar" → linha volta ao normal
# 4. Tentar arquivar o último admin → erro "Não é possível arquivar o único admin do sistema."

# Busca (CA-03)
# 5. Digitar parte de um email no input de busca → tabela filtra em tempo real
# 6. Digitar parte de um nome em `full_name` → também filtra

# Bulk add (CA-04)
# 7. Tab Whitelist → textarea
# 8. Colar "a@teste.com, b@teste.com\nc@teste.com" + role "Coordenador" → 3 entries criadas
# 9. Repetir o mesmo input → mensagem "0 adicionado(s), 3 ignorado(s) (já existiam)"

# Verificações automáticas (à época — assumidas verde, não há registro)
pnpm exec tsc --noEmit  # ⚠️ NA ÉPOCA assumido verde; HOJE vermelho desde commit 7c6aa45 (Edge Function não excluída)
pnpm lint               # ⚠️ idem
```

## Riscos conhecidos

- **🔴 Regra §2 da story não implementada.** "Usuários arquivados não devem aparecer como opções para serem alocados em novas tarefas" — `app/(app)/kanban/page.tsx` faz `select('*').from('profiles')` sem filtrar `archived_at IS NULL`. `TaskModal` lista arquivados como opções. **Vira ticket P0 da Sprint 07-B** (apêndice à Story 07B.4 ou story nova).
- **🔴 `is_admin()` SECURITY DEFINER em migration `20260507000004` sem ADR próprio.** Decisão arquitetural relevante (resolve recursividade de policies admin que ADR 0001 marcava como armadilha) entrou em commit misto. Recomendação: ADR 0006 ou revisão do ADR 0001 em sprint futura.
- **🟡 Sem Plan Artifact / Gate 1.** Sprint executada sem revisão prévia humana documentada.
- **🟡 Sem `_summary.md` à época.** Pago retroativamente em 2026-05-09 (Story 07B.4 CA-01).
- **🟡 Sem login hook que bloqueie acesso de arquivado** — fora de escopo (story §6). Acesso continua possível via OAuth.
- **🟡 Race condition multi-admin no `LAST_ADMIN` guard** estendido para `archiveUser` — mesma race herdada da Sprint 04.

## Verificações executadas (reconstrução 2026-05-10)

- [x] CA-01 implementado — `archiveUser` em `lib/actions/admin.ts:159-196`; UI em `AdminView.tsx`.
- [x] CA-02 implementado — `restoreUser` em `lib/actions/admin.ts:198-213`.
- [x] CA-03 implementado — `filteredProfiles` (useMemo) em `AdminView.tsx`.
- [x] CA-04 implementado — `addToWhitelist` aceita lista; mensagem agregada.
- [x] Migration `20260507000003` aplicada em remoto (assumido — coluna existe e é referenciada por queries em prod).
- [ ] Regra §2 (assignees arquivados) **não implementada** — débito.
- [ ] Smoke manual com 2+ personas — sem registro.

## Harness debt produzida nesta sprint

- **Decisão arquitetural sem ADR** (`is_admin()` SECURITY DEFINER).
- **`addToWhitelist` faz N inserts em loop** ([linhas 119-138](../../../lib/actions/admin.ts#L119)) — para listas grandes não é ideal. Refactor para `INSERT ... ON CONFLICT DO NOTHING` em batch é débito P3.
- **Commit misto** (`7c6aa45` da Sprint 06 incluiu `is_admin()` que pertencia a esta sprint).

## Próximo passo sugerido (à época)

1. Sincronização Google Sheets (US-05) — exige ADR 0004 → entregue em Sprint 06.
2. Filtrar `archived_at IS NULL` no assignee selector — não foi feito; vira débito P0 da Sprint 07-B.
3. ADR para `is_admin()` — não foi feito; vira débito P2 da Sprint 07-B.
