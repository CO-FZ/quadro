---
sprint: 21
title: Planilha-Espelho da Matriz (Google Sheets como banco de atividades)
status: planejada
inicio: 2026-05-23
conclusao: ~
objetivo: Reorientar a sincronização Google Sheets para espelhar a Matriz de Atividades numa única aba (efetivo nas colunas, dias nas linhas, tarefas nas células), de forma cumulativa — banco histórico que nunca apaga dias anteriores, centrado no dia corrente — e ampliar a navegação de dias na aba Matriz do app.
---

# Sprint 21 — Planilha-Espelho da Matriz

- **Status:** PLANEJADA
- **Início:** 23/05/2026
- **Tamanho:** L

---

## Motivação

A Sprint 06 (ADR 0004) entregou a sincronização Supabase → Google Sheets via Database Webhook + Edge Function. Mas o modelo de dados da planilha é uma **lista plana de tarefas** (`Tasks!A:H` = `id, title, sector, status, description, created_at, end_date, created_by`, uma linha por tarefa). Isso **não espelha a Matriz de Atividades**, que é a tela de referência do efetivo.

A Matriz (`components/features/MatrizView.tsx`) é um **pivô**:

- **Colunas** = efetivo (patente + nome de guerra), ordenado por patente.
- **Linhas** = dias.
- **Células** = todas as tarefas alocadas àquele colaborador naquele dia.

Há duas incompatibilidades estruturais entre o sync atual e esse pivô:

1. **A alocação vive em `task_assignees`**, não em `tasks`. O trigger `on_task_mutation` dispara **apenas** em `tasks` (`migration 20260507000005`). Criar/editar a lista de alocados (`updateTaskAssignees` → `task_assignees` delete+insert em `supabase-task-repository.ts:51`) **não aciona o sync**. Mudanças no efetivo (`profiles`: nova pessoa, patente, nome de guerra, arquivamento) também não.
2. **Uma mutação em uma tarefa afeta N×M células** (N alocados × M dias do intervalo). Um modelo incremental de *append/update por linha* não consegue produzir o pivô — só um **rebuild** a partir do estado atual do banco produz a matriz corretamente.

Requisitos de produto adicionais (definidos com o solicitante):

- A planilha é um **banco histórico cumulativo**: **nunca apaga linhas/dias anteriores**. Dias passados ficam congelados como registro.
- A visualização deve ser **centrada no dia corrente**.
- Cada célula mostra, por tarefa: **título + setor (DT/DA) + status** (ou "Serviço" para tarefas de serviço).
- A aba **Matriz do app** deve permitir **navegar para fora da janela de ±7 dias**, mantendo o centramento no dia corrente.

---

## Stories

| ID | Título | Size | Status | Impacto |
|----|--------|------|--------|---------|
| 21.4 | Corrigir CI: alinhar versão do pnpm (workspace `ignoredBuiltDependencies`) | XS | 🔲 planejada | Alto (CI bloqueado) |
| 21.1 | Edge Function: rebuild pivotado da planilha-espelho (aba única) | L | 🔲 planejada | Alto (dado) |
| 21.2 | Cobertura de gatilhos: `task_assignees` e `profiles` disparam o sync | S | 🔲 planejada | Alto (correção) |
| 21.3 | Navegação de dias na Matriz (além de ±7d, centrada em hoje) | M | 🔲 planejada | Médio (UX) |

Detalhamento em [story-21.1.md](./story-21.1.md), [story-21.2.md](./story-21.2.md), [story-21.3.md](./story-21.3.md), [story-21.4.md](./story-21.4.md).

**Ordem de execução:** 21.4 → 21.1 → 21.2 → 21.3. A **21.4 é bloqueador** — o CI falha hoje no `setup-node` (cache pnpm) por mismatch de versão do pnpm (local 10 × CI fixado em 9), então nenhum PR mergeia sem ela. A 21.2 (gatilhos) depende da Edge Function da 21.1 aceitar payloads de `task_assignees`/`profiles` (hoje retorna `400 Invalid table`). A 21.3 é independente do backend, mas fecha o requisito de centramento/navegação de forma coerente entre app e planilha.

---

## Decisão arquitetural — ADR 0013 (a criar na Story 21.1)

Esta sprint **muda o modelo de dados da planilha** (lista plana → pivô da Matriz) e **a estratégia de escrita** (incremental append/update → rebuild idempotente do estado atual). O **transporte permanece** o decidido no ADR 0004 (Database Webhook + Edge Function + Service Account) — portanto **não contradiz** o ADR 0004, mas o refina substancialmente.

Conforme [AGENTS.md §5.3], abrir **ADR 0013 — "Planilha Google Sheets como espelho pivotado da Matriz (rebuild idempotente)"** e adicionar nota de remissão no ADR 0004. Critérios e racional consolidados na Story 21.1.

---

## Desenho transversal (cross-cutting)

### Rebuild pivotado, idempotente

A Edge Function deixa de processar `record`/`old_record` incrementalmente. Qualquer webhook relevante (`tasks`, `task_assignees`, `profiles`) passa a **disparar um rebuild** que: lê o estado atual via Supabase (service role), monta o pivô e escreve a aba inteira (`clear` + `batchUpdate`). Rebuild é idempotente — reprocessar o mesmo evento converge para o mesmo resultado.

### Aba única "Matriz"

A planilha terá **uma aba** chamada `Matriz`. A aba legada `Tasks` (lista plana) é **superada**. Não vamos apagá-la automaticamente (evitar destruição de dado sem revisão humana) — a limpeza/arquivamento da aba antiga é **passo manual** documentado na Story 21.1.

### Histórico cumulativo (append-only no passado)

- **Dias < hoje:** preservados. O rebuild lê o conteúdo já existente na planilha e reemite os dias passados **sem recomputar** — são registro histórico congelado.
- **Dias ≥ hoje:** recomputados a cada rebuild a partir do banco.
- **Chave estável de coluna:** uma **linha-cabeçalho oculta (linha 1)** guarda o `profile.id` (UUID) de cada coluna; a linha 2 (congelada, visível) mostra "patente nome_guerra". Isso permite **remapear** células históricas por colaborador quando a ordem das colunas muda (ex.: ingresso de alguém em posição intermediária por ordem de patente), **sem desalinhar** o passado.
- **Colunas:** união do efetivo ativo atual + qualquer `profile` referenciado por tarefa no intervalo (para não derrubar coluna de quem saiu mas tem histórico).

### Centramento no dia corrente

- Congelar linha-cabeçalho + coluna de datas.
- Destacar (fill) a linha do dia corrente.
- Manter um **buffer dianteiro fixo** de dias após hoje (configurável, default proposto: +30) para que "hoje" não fique no rodapé.
- Setar a célula ativa na linha de hoje a cada rebuild (enviesa o scroll inicial).
- **Limitação honesta:** a API do Google Sheets **não garante** posição de scroll por-visualizador. O "centramento" é aproximado (buffer + destaque + célula ativa); centramento pixel-perfeito persistente para todos não é alcançável via API. Registrado como risco.

### Coalescência de rebuilds

Criar uma tarefa com K alocados gera 1 webhook de `tasks` + K de `task_assignees` ⇒ K+1 rebuilds. Como o rebuild é idempotente, é **correto** mas potencialmente custoso. Mitigação proposta (não-bloqueante): guardar `last_rebuild_at` em `app_config` e debounce simples na Edge Function, ou aceitar e tratar como débito P2. Decisão final na Story 21.1.

---

## Dependências

- Secrets já existentes no Supabase: `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (a Edge Function passará a ler o banco com service role — já disponível no caminho de DLQ).
- `app_config` (já existe, `migration 20260517000006`) para parâmetros novos (`sheet_tab_name`, `sheet_forward_buffer_days`).
- Service Account com permissão de **edição** na planilha alvo (já requerido pelo ADR 0004).
- Sem nova dependência de pacote no app. A Edge Function continua em `npm:googleapis@133.0.0`.

---

## Riscos

- **Reescrita da Edge Function** é o item de maior risco: o caminho de escrita no Google Sheets **não tem teste automatizado** (débito da Sprint 06, mantido). Mitigação: extrair `buildMatrix()` puro e testá-lo com Deno (sem API); validar a escrita por smoke manual em planilha de staging (Story 21.1 §Como testar).
- **Desalinhamento histórico** se a chave de coluna não for estável. Mitigado pela linha-cabeçalho oculta com UUID.
- **"Hoje" desatualiza sem mutação:** o destaque do dia corrente é fixado no último rebuild; sem mutações por dias, o destaque pode apontar para um dia já passado. Mitigação opcional: rebuild diário via `pg_cron` (registrar como débito P2 / story futura se não couber).
- **Escala:** o rebuild lê a grade inteira a cada evento. Para o efetivo/horizonte atual é trivial; documentar limite e revisitar se a planilha crescer muito.
- **`profiles` UPDATE é frequente:** o gatilho da 21.2 deve usar `WHEN` para disparar só em mudanças relevantes (`patente`, `nome_guerra`, `full_name`, `archived_at`, `role`), evitando rebuild a cada toque de perfil.

## Critérios de conclusão (sprint)

- [ ] CI verde no `setup-node`/`install` (Story 21.4 — bloqueador): pnpm alinhado via `packageManager`.
- [ ] ADR 0013 criado e `Aceito`; nota de remissão adicionada ao ADR 0004.
- [ ] Aba `Matriz` reflete o pivô (efetivo × dias × tarefas) em staging, validado por smoke manual.
- [ ] Dias passados preservados após mutação em tarefa do passado (teste manual de não-regressão).
- [ ] Gatilhos de `task_assignees` e `profiles` disparam o sync (verificado por log da Edge Function).
- [ ] Navegação de dias na Matriz do app funcionando, centrada em hoje.
- [ ] `pnpm typecheck` verde · `pnpm lint` verde · `pnpm test:unit` verde · `deno test` da Edge Function verde.
- [ ] Diff revisado pelo humano (Artifact).
