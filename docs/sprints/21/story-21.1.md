---
id: 21.1
sprint: 21
title: Edge Function — rebuild pivotado da planilha-espelho (aba única)
status: planejada
size: L
tipo: feature
depends_on: []
---

# Story 21.1 — Rebuild pivotado da planilha-espelho

## Problema

A Edge Function `sync-sheets` ([supabase/functions/sync-sheets/index.ts](../../../supabase/functions/sync-sheets/index.ts)) escreve uma **lista plana de tarefas** (`Tasks!A:H`) de forma incremental (append no INSERT, lookup+update no UPDATE, marca "Deleted" no DELETE). Isso não espelha a Matriz, que é um pivô **efetivo × dias × tarefas**. Além disso, o caminho incremental é incapaz de produzir um pivô: uma mutação em uma tarefa afeta N×M células.

## Solução

Reescrever a Edge Function para fazer **rebuild idempotente** da aba única `Matriz` a partir do estado atual do banco, preservando histórico.

### Modelo da aba `Matriz`

```
        | A (Data)      | B            | C            | D            | ...
Linha 1 | (oculta)      | <uuid-prof>  | <uuid-prof>  | <uuid-prof>  |   ← chave estável (profile.id)
Linha 2 | Data          | Cap FULANO   | Ten BELTRANO | SD CICRANO   |   ← cabeçalho visível (congelado)
Linha 3 | seg, 12 mai   | <célula>     | <célula>     | <célula>     |
...
Linha k | qua, 21 mai   | ...          | ...          | ...          |   ← HOJE (destacada)
...
```

- **Linha 1 (oculta, congelada):** `profile.id` de cada coluna — chave estável para remapear histórico quando a ordem/conjunto de colunas muda.
- **Linha 2 (visível, congelada):** `formatNomeCompleto(patente, nome_guerra)` (mesma regra de `lib/utils/format.ts`).
- **Coluna A (congelada):** data formatada pt-BR (`seg, 12 mai`), 1 linha por dia.
- **Colunas:** efetivo ativo (`archived_at IS NULL`) **∪** qualquer `profile` referenciado por tarefa no intervalo, ordenado por patente (`sortByPatente`, `lib/utils/patente.ts`).
- **Célula (efetivo × dia):** para cada tarefa alocada àquele colaborador naquele dia (mesma regra de `getTasksForCell` em `MatrizView.tsx`: `assigned && start_date <= dia <= end_date`), uma entrada no formato:
  - Tarefa normal: `Título · DT · Em revisão` (título · setor · status legível).
  - Tarefa de serviço (`is_servico=true`): `Serviço · DT` (rótulo "Serviço" no lugar do título).
  - Múltiplas tarefas na mesma célula: separadas por quebra de linha (`\n`) dentro da célula.
  - Labels de status: reusar um mapa `STATUS_LABEL` (pt-BR) — extrair para módulo compartilhável e cobrir por teste.

### Algoritmo de rebuild

1. **Validar payload e config** (mantém checagem de `GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_SHEET_ID`). **Relaxar** a checagem de tabela: aceitar `tasks`, `task_assignees`, `profiles` (hoje rejeita tudo ≠ `tasks` com `400`). Para qualquer uma, o fluxo é o mesmo: rebuild.
2. **Ler estado atual via Supabase** (service role — já disponível no caminho de DLQ):
   - `profiles` ativos (`id, full_name, nome_guerra, patente, role, archived_at`).
   - `tasks` não-arquivadas com `task_assignees(user_id)` (mesma query de `app/(app)/matriz/page.tsx`).
3. **Ler a grade existente da aba `Matriz`** (`values.get` em todo o range) para:
   - Mapear `data → (profile.id → texto da célula)` dos **dias passados** (via linha-1 oculta com UUIDs).
4. **Computar intervalo de dias:**
   - `earliest = min(menor data já presente na planilha, menor start_date de tarefa, hoje)`.
   - `latest = max(maior data já presente, maior end_date de tarefa, hoje + forwardBuffer)`.
   - `forwardBuffer` lido de `app_config` (`sheet_forward_buffer_days`, default 30).
   - Dias contíguos de `earliest` a `latest`.
5. **Montar a matriz** (`buildMatrix()` — função **pura**, testável):
   - `dia < hoje` ⇒ usar o conteúdo preservado do passo 3 (histórico congelado). Se o dia ainda não existia, gerar a partir do banco (primeira materialização).
   - `dia ≥ hoje` ⇒ recomputar do banco.
6. **Escrever:** `values.clear` na aba + `values.update`/`batchUpdate` com a grade completa (linha-1 UUID, linha-2 cabeçalho, linhas de dias). `valueInputOption: "RAW"`.
7. **Formatar via `spreadsheets.batchUpdate`:** ocultar linha 1; congelar 2 linhas + 1 coluna; fill na linha de hoje; setar célula ativa na linha de hoje.
8. **Logar** (`lib/logger` da Edge — `_shared/logger.ts`) início/fim, contagem de dias e colunas, e manter o caminho de **DLQ** (`sync_sheets_failures`) já existente em caso de erro.

### Coalescência (decisão)

Recomendação: **aceitar K+1 rebuilds** (idempotentes) nesta sprint e registrar debounce como débito P2 — evita acoplar lock/estado na primeira entrega. Alternativa documentada: guardar `last_rebuild_at` em `app_config` e pular rebuilds < ~2s do anterior. Confirmar com o humano na revisão do Artifact.

### Aba legada `Tasks`

Superada. **Não** apagar via código. Passo manual pós-deploy: renomear/ocultar a aba `Tasks` ou arquivar a planilha antiga. Documentar no runbook de sync.

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/sync-sheets/index.ts` | Reescrita: rebuild pivotado; aceitar 3 tabelas; ler banco + grade; preservar passado; formatar/centrar |
| `supabase/functions/sync-sheets/matrix.ts` | **Novo** — `buildMatrix()` puro + `STATUS_LABEL` + formatação de célula (testável sem API) |
| `supabase/functions/sync-sheets/index.test.ts` | Manter testes de validação; **adicionar** testes de `buildMatrix()` (pivô, célula multi-tarefa, serviço, preservação de passado, remap de coluna) |
| `docs/spec/adr/0013-planilha-espelho-matriz.md` | **Novo** — ADR do modelo pivotado + rebuild idempotente |
| `docs/spec/adr/0004-google-sheets-sync.md` | Nota de remissão → ADR 0013 |
| `app_config` (via migration na 21.2 ou aqui) | Seeds `sheet_tab_name='Matriz'`, `sheet_forward_buffer_days='30'` |
| `docs/runbooks/` | Nota: aba `Matriz`, passo manual da aba `Tasks` legada |

## Critérios de aceite

- [ ] Aba `Matriz`: linha-1 oculta com UUIDs, linha-2 com "patente nome_guerra", coluna A com datas, células com `Título · setor · status`.
- [ ] Tarefa de serviço renderiza `Serviço · setor`.
- [ ] Múltiplas tarefas na mesma célula separadas por quebra de linha.
- [ ] `dia < hoje` preservado após nova mutação (não-regressão de histórico).
- [ ] Reordenação/ingresso de coluna **não desalinha** células históricas (remap por UUID).
- [ ] Linha de hoje destacada; cabeçalho + coluna de data congelados.
- [ ] Edge Function aceita `tasks`, `task_assignees`, `profiles` sem `400`.
- [ ] DLQ (`sync_sheets_failures`) preservado em erro.
- [ ] `buildMatrix()` puro coberto por `deno test`.
- [ ] ADR 0013 `Aceito`; ADR 0004 com nota de remissão.

## Como testar

```bash
# Unit (pura, sem Google API)
deno test --allow-env supabase/functions/sync-sheets/

# Smoke manual (staging) — planilha de teste com Service Account com permissão de edição:
# 1. Deploy: supabase functions deploy sync-sheets
# 2. Criar tarefa com 2 alocados de patentes diferentes, intervalo de 3 dias.
#    Verificar: aba Matriz, 2 colunas ordenadas por patente, 3 linhas de dia preenchidas.
# 3. Reatribuir alocados (updateTaskAssignees) → célula reflete a nova alocação (requer gatilho da 21.2).
# 4. Editar uma tarefa cujo intervalo está no PASSADO → confirmar que linhas de dias passados NÃO mudaram.
# 5. Arquivar um profile → coluna some do efetivo ativo, mas dias passados com alocação dele permanecem.
```

## Fora de escopo

- Sincronização bidirecional (planilha → banco). Mantém-se fora de escopo (PRD/ADR 0004).
- `pg_cron` para rebuild diário (manter "hoje" destacado sem mutação) — débito P2 / story futura.
- Debounce/coalescência formal — débito P2 (ver §Coalescência).
