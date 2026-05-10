# Final Artifact — Sprint 06 / Story 06 (Sincronização Google Sheets)

**Data:** 2026-05-07 (commit `7c6aa45`) + 2026-05-09 (commit `77c0f06`) / 2026-05-10 (Final Artifact reconstruído retroativamente)
**Story:** [docs/sprints/06/story-06-google-sheets-sync.md](../../sprints/06/story-06-google-sheets-sync.md)
**Sprint plan:** [docs/sprints/06/sprint-plan.md](../../sprints/06/sprint-plan.md)
**ADR:** [0004 — Google Sheets Sync](../../spec/adr/0004-google-sheets-sync.md) (`Aceito` retroativo, 2026-05-09)
**Resumo de fase:** [docs/memory/sprints/06/_summary.md](../sprints/06/_summary.md)
**Plan Artifact (Gate 1):** não registrado à época.

> **Nota retroativa.** Este Final Artifact foi escrito em 2026-05-10 como parte da Story 07B.4 (CA-04). Reconstruído a partir do diff dos dois commits e do estado atual de `supabase/functions/sync-sheets/`. Não houve Gate 2 humano formal à época; ADR 0004 ficou em status `Proposto` por ~2 dias depois da implementação ir para prod.

---

## Sumário (≤ 5 linhas)

Sprint 06 entrega: pipeline unidirecional Supabase → Google Sheets em 2 fases. Edge Function `sync-sheets` (Deno + `npm:googleapis@133`) trata INSERT (append na planilha), UPDATE (lookup por ID + update da linha) e DELETE (marca `Status = "Deleted"`). Database webhook em `tasks` via `pg_net.http_post` formata payload no formato Database Webhook nativo do Supabase. Auth via Service Account JSON em secrets (`GOOGLE_SERVICE_ACCOUNT_JSON` + `GOOGLE_SHEET_ID`). Como escopo lateral (commit `7c6aa45`), também entrou `is_admin()` SECURITY DEFINER (deveria ser ADR / Sprint 05).

## Arquivos alterados

| Arquivo | Operação | Razão |
|---|---|---|
| [`docs/spec/adr/0004-google-sheets-sync.md`](../../spec/adr/0004-google-sheets-sync.md) | criar (`Proposto`) → atualizar (`Aceito` retroativo em 2026-05-09 via Story 07B.4) | decisão arquitetural |
| [`supabase/functions/sync-sheets/index.ts`](../../../supabase/functions/sync-sheets/index.ts) | criar | Edge Function Deno; INSERT/UPDATE/DELETE; auth Service Account |
| [`supabase/functions/sync-sheets/deno.json`](../../../supabase/functions/sync-sheets/deno.json) | criar | imports map |
| [`supabase/functions/sync-sheets/.npmrc`](../../../supabase/functions/sync-sheets/.npmrc) | criar | suporte a `npm:` no Edge Runtime |
| [`supabase/migrations/20260507000004_fix_admin_rls.sql`](../../../supabase/migrations/20260507000004_fix_admin_rls.sql) | criar | `is_admin()` SECURITY DEFINER + reescrita de policies admin (escopo lateral; ver "Riscos") |
| [`supabase/migrations/20260507000005_google_sheets_webhook.sql`](../../../supabase/migrations/20260507000005_google_sheets_webhook.sql) | criar (em `77c0f06`) | trigger `on_task_mutation` em `tasks` chamando Edge Function via `pg_net.http_post` |
| [`supabase/config.toml`](../../../supabase/config.toml) | atualizar | configuração de Edge Functions |
| `.vscode/extensions.json` + `.vscode/settings.json` | criar | DX (Deno LSP local) |
| [`docs/sprints/06/sprint-plan.md`](../../sprints/06/sprint-plan.md) | criar / atualizar | sprint plan |
| [`docs/sprints/06/story-06-google-sheets-sync.md`](../../sprints/06/story-06-google-sheets-sync.md) | criar | story |

## Como testar

```bash
# Pré-condições
# 1. Service Account criada no Google Cloud + Sheets API habilitada
# 2. Planilha com header em A1:H1 = id,title,sector,status,description,created_at,end_date,created_by
# 3. Service Account com permissão "Editor" na planilha
# 4. Secrets no Supabase:
#    supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='{...}'
#    supabase secrets set GOOGLE_SHEET_ID='1abc...'
# 5. Deploy:
#    supabase functions deploy sync-sheets
#    supabase db push  # aplica migration 20260507000005

# CA-01 — Inserção
# 6. /kanban → criar task → Sheets recebe nova linha em até 10s

# CA-02 — Atualização
# 7. Mover task para "Finalizada" no Kanban → coluna Status na Sheets atualiza

# CA-03 — Falhas
# 8. Inverter um caractere de GOOGLE_SHEET_ID → criar task → UI não trava;
#    logs da Edge Function (`supabase functions logs sync-sheets`) mostram erro 404 do Google.
#    Não há retry — evento é perdido.
```

## Riscos conhecidos (todos rastreados em [06/_summary.md §3](../sprints/06/_summary.md))

- **🔴 ADR 0004 ficou em `Proposto` por 2 dias enquanto código já rodava em prod.** Promovido a `Aceito` retroativamente em 2026-05-09 (Story 07B.4 CA-03).
- **🔴 URL e anon-key JWT hardcoded em `20260507000005`** — vincula migration a um project_ref específico. Aceito em v1; refactor (`app.settings.*` ou Vault) é débito P2.
- **🔴 Sem retry em falhas transitórias** da Google API. Aceito em v1; débito P2.
- **🔴 Sem testes da Edge Function.** Story 07A.2 (integration) cobre apenas o lado do banco. Mock da Google API contra a Edge Function é débito separado.
- **🟡 Diagnóstico expõe `credential_keys` no body do erro** ([index.ts:132-141](../../../supabase/functions/sync-sheets/index.ts#L132)). Não é vazamento (lista de chaves, não valores), mas idealmente fica só no log estruturado. Story 07B.1 já migrou os `console.*` para `lib/logger`; refactor adicional fica para débito.
- **🟡 DELETE não é estritamente idempotente** — se trigger reaplicar, sobrescreve "Deleted" indefinidamente. Aceito.
- **🟡 Commit `7c6aa45` misturou Edge Function (Sprint 06) com `is_admin()` fix (deveria ser Sprint 05 ou ADR próprio).**
- **🟡 Sem `_summary.md` / Final Artifact à época.** Pago retroativamente: `_summary.md` em 2026-05-09 (Story 07B.4 CA-02), Final Artifact (este doc) em 2026-05-10 (Story 07B.4 CA-04).

## Verificações executadas (reconstrução 2026-05-10)

- [x] CA-01 implementado — `values.append` em `index.ts:56-66`.
- [x] CA-02 implementado — lookup por ID + `values.update` em `index.ts:67-100`; fallback append.
- [~] CA-03 parcial — erro logado, UI não bloqueia (assíncrono via `pg_net`); sem retry.
- [x] Migrations `20260507000004` e `20260507000005` aplicadas em remoto (assumido — código que depende roda em prod).
- [ ] Smoke manual contra planilha real — sem registro.
- [ ] `pnpm typecheck` à época — **vermelho** desde este commit (8 erros em `sync-sheets/index.ts` no tsconfig do Next). Pago em Sprint 07-A passo 0 (commit `92d769a`).

## Harness debt produzida nesta sprint

- **ADR `Proposto` em prod por 2 dias** — política do harness exige `Aceito` antes de prod.
- **Commit misto** (Edge Function + `is_admin()` fix). [AGENTS.md §6](../../../AGENTS.md) prevê commits coesos.
- **`tsconfig.json` sem `exclude` para `supabase/functions/`** — débito que só se manifestou quando Sprint 07-A introduziu o gate `pnpm typecheck`.
- **Migration com JWT inline** — não é segredo (anon key é pública), mas erode disciplina futura.

## Próximo passo sugerido (à época)

1. Smoke manual contra planilha real, registrar em `_summary.md`.
2. Promover ADR 0004 a `Aceito`.
3. Adicionar retry / dead-letter para falhas da Google API.
4. Cobertura automatizada (mock da Google API) para a Edge Function.

> Itens 1 e 2 fechados em 2026-05-09 / 2026-05-10 via Story 07B.4. Itens 3 e 4 ficam como débito P2 pós-Sprint 07.
