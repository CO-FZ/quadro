# Resumo Sprint 06 — 2026-05-09 (reconstruído retroativamente)

**Owner da fase:** Eduardo Lima
**Sessões envolvidas:**
- Commit `7c6aa45` (2026-05-07) — Edge Function `sync-sheets` + ADR 0004 + Sprint 06 plan/story.
- Commit `77c0f06` (2026-05-09) — Database webhook (`pg_net`) + ajustes na Edge Function.

**Status de saída:** 🟡 entregue parcialmente — pipeline funcional ponta-a-ponta, mas com 4 débitos de produção rastreados e ADR 0004 ainda em status `Proposto`.

> **Nota sobre reconstrução.** Este `_summary.md` foi escrito em 2026-05-09 como parte da Story 07B.4. Conteúdo reconstruído a partir do diff dos dois commits, [story-06](../../sprints/06/story-06-google-sheets-sync.md) e [ADR 0004](../../../spec/adr/0004-google-sheets-sync.md). Não houve smoke manual contra Google Sheets registrado.

---

## 1. O que foi decidido / entregue

- **Edge Function `sync-sheets`** em Deno ([supabase/functions/sync-sheets/index.ts](../../../../supabase/functions/sync-sheets/index.ts)) cobrindo INSERT (append), UPDATE (lookup por ID + update da linha) e DELETE (marca status como "Deleted" — não remove a linha física).
- **Autenticação Google** via Service Account JSON em `GOOGLE_SERVICE_ACCOUNT_JSON` + spreadsheet ID em `GOOGLE_SHEET_ID` (ambos secrets do Supabase).
- **Database webhook nativo** via Postgres trigger `on_task_mutation` em `tasks` ([migration 20260507000005](../../../../supabase/migrations/20260507000005_google_sheets_webhook.sql)) usando `pg_net.http_post` para chamar a Edge Function — preserva o formato do Database Webhook do Supabase (`{type, table, schema, record, old_record}`).
- **Schema da planilha:** colunas A:H = `id, title, sector, status, description, created_at, end_date, created_by`. Range fixo `Tasks!A:H`.
- **Configuração Deno** ([deno.json](../../../../supabase/functions/sync-sheets/deno.json) e `.npmrc`) suportando o import `npm:googleapis@133.0.0`.
- **`is_admin()` RLS fix** ([migration 20260507000004](../../../../supabase/migrations/20260507000004_fix_admin_rls.sql)) entregue no mesmo commit do Edge Function — escopo lateral, **deveria** estar em Sprint 05 ou ter ADR próprio.

## 2. CAs vs estado real do código

| CA | Status | Evidência |
|---|---|---|
| CA-01 — Inserção | ✅ implementado | `values.append` em [index.ts:56-66](../../../../supabase/functions/sync-sheets/index.ts#L56). Smoke manual contra planilha real não registrado. |
| CA-02 — Atualização | ✅ implementado | lookup por ID + `values.update` em [index.ts:67-100](../../../../supabase/functions/sync-sheets/index.ts#L67). Fallback append se não encontrar. |
| CA-03 — Falhas e retentativas | 🟡 parcial | Edge Function retorna 500 em erro (UI não bloqueia, é assíncrono via `pg_net`). **Não há retry** — se Google API estiver indisponível, evento é perdido. Logs em `console.log`/`console.error` (sem `lib/logger`). |

## 3. O que ficou em aberto (lacunas detectadas em auditoria 2026-05-09)

- 🔴 **ADR 0004 ainda em status `Proposto`** apesar da implementação em prod desde 2026-05-07. Promover para `Aceito` na Story 07B.4.
- 🔴 **`anon_key` JWT hardcoded em migration** ([linha 13](../../../../supabase/migrations/20260507000005_google_sheets_webhook.sql#L13)). Não é segredo (anon key é pública), mas:
  - Vincula migration a um project_ref específico (`yanveevgpfjopcjnosqq`).
  - Se rotacionar key ou clonar para outro projeto, migration falha silenciosamente (sem erro 4xx óbvio — só não dispara).
  - **Recomendação:** mover para Vault Supabase ou variável de configuração via `app.settings.*`.
- 🔴 **URL da Edge Function hardcoded** (`https://yanveevgpfjopcjnosqq.supabase.co/...`) — mesma raiz: ambiente acoplado.
- 🔴 **Sem retry em falhas transitórias.** PRD §12 ("Falha no Sync com Google Sheets — Mitigação: rotas assíncronas sólidas e logs claros") aceita mas marca como risco médio. Vira débito P2.
- 🔴 **Sem testes da Edge Function.** Story 07-A integration cobre apenas a parte do banco; testar a Edge contra mock de Google Sheets é débito separado.
- 🔴 **DELETE não recupera idempotência.** Marca status como "Deleted" mas se trigger reaplicar, fica "Deleted" infinitas vezes (idempotente por sorte, não por design). Aceitável.
- 🟡 **Diagnóstico do erro inclui `credential_keys` no body** ([index.ts:132-141](../../../../supabase/functions/sync-sheets/index.ts#L132)). Não é vazamento (é só lista de chaves), mas é informação de diagnóstico que ideal não deveria voltar pro caller. Mover para log estruturado da Story 07B.1.
- 🟡 **Sincronização retroativa** explicitamente fora de escopo (story §"Não vamos entregar"). Não-débito.
- 🟡 **Sincronização bi-direcional** explicitamente fora de escopo. Não-débito.

## 4. ADRs criados nesta fase

| ADR | Título | Status |
|---|---|---|
| 0004 | Sincronização com Google Sheets via Webhooks e Edge Functions | `Proposto` (a promover para `Aceito` na Story 07B.4) |

**Faltando ADR para:** `is_admin()` SECURITY DEFINER (migration `20260507000004`) — entrou junto sem documento próprio.

## 5. Padrões salvos na Knowledge Base

- **Database webhook via `pg_net.http_post`** simulando o formato do Supabase Database Webhook nativo é alternativa viável quando o Webhook UI não está disponível.
- **Edge Function compatível com Deno + npm imports** (`npm:googleapis@133.0.0`) funciona desde Supabase Edge Runtime 1.x.
- **Service Account em secret JSON** + `google.auth.GoogleAuth({ credentials, scopes })` é o padrão para autenticação server-to-server com Google APIs.

## 6. Métricas / artefatos verificáveis

- **Migrations aplicadas:** `20260507000004_fix_admin_rls.sql`, `20260507000005_google_sheets_webhook.sql`. Total acumulado: 10 migrations.
- **Edge Function deployada:** assumido em prod (smoke manual não registrado).
- **`pnpm exec tsc --noEmit` à época:** **vermelho** desde este commit — `supabase/functions/sync-sheets/index.ts` não está excluído do `tsconfig.json`, gera 8 erros.
- **`pnpm lint`:** parcial — não cobre `supabase/functions/`.
- **Cobertura de testes:** 0% (mantida).

## 7. Avisos para o próximo agente

- **Antes de tocar `supabase/functions/sync-sheets/index.ts`**, lembrar: é Deno, não Node. Imports são `npm:` ou `https://`. `Deno.env.get(...)` em vez de `process.env`.
- **Migration com URL hardcoded é footgun.** Antes de qualquer migration nova que toque webhook, parametrizar via `app.settings.edge_function_url` ou Vault.
- **Não confiar em "sucesso" da Edge Function** sem checar a planilha — a função pode retornar 200 e a row não aparecer (ex.: se `GOOGLE_SHEET_ID` apontar para planilha sem permissão para a Service Account).
- **`handle_task_sync` é `SECURITY DEFINER`** — qualquer ajuste no trigger precisa rodar `SET search_path = public` (padrão da migration 20260506000002).

## 8. Harness debt observada

- **`_summary.md` e Final Artifact da Sprint 06 nunca foram escritos.** Sprint 07 (planejamento) começou sem fechamento da 06 — pago retroativamente nesta sessão.
- **ADR `Proposto` em prod por 2 dias.** Política do harness: ADR só fica em prod com status `Aceito`. Promover é trivial; o sinal é o gate ausente.
- **Mistura de escopos no commit `7c6aa45`:** Edge Function (Sprint 06) + `is_admin()` fix (deveria ser bugfix transversal ou Sprint 05). [AGENTS.md §6](../../../../AGENTS.md) prevê commits coesos.
- **`tsconfig.json` sem `exclude` para `supabase/functions/`** — débito que **só se manifesta** quando alguém executa `tsc` (que é exatamente o gate da Sprint 07-A). Sem o gate, passou despercebido.
- **Migration com JWT inline** — não é segredo, mas é prática que erodirá quando alguém futuro pensar "JWT em SQL é normal" e copiar o padrão para algo realmente sensível.
