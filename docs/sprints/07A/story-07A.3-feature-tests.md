# Story 07A.3: Feature/E2E tests (Playwright + screenshot diff mobile)

**Sprint:** 07-A — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [ADR 0005 — Estratégia de testes](../../spec/adr/0005-estrategia-de-testes.md), [ADR 0003 — Defesa em camadas](../../spec/adr/0003-defesa-em-camadas-tasks.md)
**Glossário:** [docs/prd/01-glossary.md](../../prd/01-glossary.md)
**Origem:** débito de "Validação visual mobile (CA-06 da Story 03)" registrado em [Sprint 03 §2](../../memory/sprints/03/_summary.md), débito de "Smoke multi-persona" da [Sprint 04 §2](../../memory/sprints/04/_summary.md), débito de "Smoke anti-spoofing" da Sprint 03.

---

## 1. Visão Geral

Estabelecer a **Camada 3** da estratégia (ADR 0005): Playwright cobrindo fluxos de usuário fim-a-fim em desktop e mobile, com **screenshot diff** mobile pagando o débito da CA-06 da Sprint 03.

Cobre os 3 fluxos críticos do PRD (Kanban, Admin, Auth callback) por todas as 3 personas, e garante que regressão visual em viewport 360x740 (Galaxy S8) é detectada antes de chegar em prod.

## 2. Requisitos de Negócio (Regras)

- **Kanban (US-02, US-03):**
  - Criar tarefa via FAB (qualquer persona, ADR 0003 §B).
  - Drag-and-drop entre colunas (efetivo só nas próprias).
  - Tentar mover para Finalizada como efetivo → Toast erro + card volta (optimistic rollback).
  - Editar/arquivar/excluir só admin/coord.
- **Dashboard (US-04):** carrega sem erro, mostra contadores por persona.
- **Admin:**
  - Whitelist: bulk add (parsing de `,;\n`); duplicado é avisado.
  - Roles: alterar role; rebaixar último admin → Toast LAST_ADMIN.
  - Soft-delete: arquivar usuário; restaurar.
- **Auth callback (US-01 + ADR 0002):**
  - Email whitelisted → `/kanban`.
  - Email não-whitelisted → erro amigável (não mensagem genérica). **Esta story é o gate de aceitação para o débito de "Mapear erro do trigger" do [ADR 0002 §"Riscos a fechar"](../../spec/adr/0002-whitelist-emails-trigger.md)** — se o teste falhar, é porque a Sprint 07-B precisa entregar o mapeamento antes.
- **Visual mobile:** todas as rotas acima rendered em 360x740 sem overflow horizontal e com layout legível. Screenshot diff contra baseline versionado.

## 3. Requisitos técnicos

- **Framework:** Playwright 1.49+ (latest). `@playwright/test`.
- **Browsers:** chromium e webkit. WebKit cobre iOS Safari (relevante porque alvo é mobile-first).
- **Auth sem hit em Google OAuth real.** Usar `supabase.auth.admin.createUser` + `supabase.auth.signInWithPassword` para gerar session, depois injetar cookies de sessão via `context.addCookies()` antes de navegar. Documentar fixture em `tests/e2e/fixtures/auth.ts`.
- **Servidor:** Playwright `webServer` config inicia `pnpm build && pnpm start` na porta 3000 com env apontando para Supabase local. Tentar reusar instância (`reuseExistingServer: !process.env.CI`).
- **Estrutura:**
  ```
  tests/
    e2e/
      fixtures/
        auth.ts                  ← signInAs(role) — devolve page autenticada
        seed.ts                  ← usa o mesmo seed de Story 07A.2; pode reaproveitar
        sheet-mock.ts            ← (não usado nesta sprint)
      kanban.spec.ts             ← drag-drop, FAB, edição
      admin.spec.ts              ← whitelist bulk, roles, soft-delete
      auth.spec.ts               ← login mockado, callback rejeição
      mobile-visual.spec.ts      ← screenshot diff em 4 rotas
      __screenshots__/
        kanban-mobile-Galaxy-S8.png
        dashboard-mobile-Galaxy-S8.png
        profile-mobile-Galaxy-S8.png
        admin-mobile-Galaxy-S8.png
      README.md                  ← workflow de update de baseline
    playwright.config.ts
  ```
- **Projects no `playwright.config.ts`:**
  - `desktop-chromium` — viewport 1280x800.
  - `mobile-chromium` — viewport 360x740 (Galaxy S8). Toda spec roda em ambos por padrão; `mobile-visual.spec.ts` roda só em `mobile-chromium`.
  - `webkit` — viewport 1280x800. Roda smoke de `kanban.spec.ts` para detectar incompatibilidade Safari.
- **Scripts:**
  - `"test:e2e": "playwright test"`
  - `"test:e2e:ui": "playwright test --ui"`
  - `"test:e2e:update-snapshots": "playwright test --update-snapshots"`
- **Screenshot diff:** `await expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.01, mask: [page.locator('time'), page.locator('[data-testid="avatar"]')] })`. Mask de timestamps e avatares (que vêm de URLs do Google externas).
- **Toast assertions:** assertir conteúdo via `data-testid="toast"` em `ToastProvider.tsx` (refactor leve — adicionar test-id se ainda não existe).

## 4. Critérios de Aceite

### CA-01 — Setup Playwright

- **Given** repositório sem Playwright
- **When** agente roda `pnpm add -D @playwright/test` e `pnpm exec playwright install --with-deps chromium webkit`
- **Then** `pnpm test:e2e --list` enumera os specs sem erro. CI tem cache de `~/.cache/ms-playwright`.

### CA-02 — Auth fixture sem OAuth real

- **Given** seed de personas (de Story 07A.2)
- **When** spec chama `await signInAs('admin')`
- **Then** retorna `Page` com cookies de sessão Supabase válidos. `await page.goto('/kanban')` carrega sem redirect para login.

### CA-03 — Kanban: criar tarefa universal

- **Given** efetivo autenticado em `/kanban`
- **When** clica FAB "Nova Tarefa", preenche título "Tarefa de teste", setor DT, datas válidas, salva
- **Then** card aparece na coluna `Backlog` (sem assignees → status backlog). Toast de sucesso. Refresh da página mantém o card (persistido).

### CA-04 — Kanban: drag-drop com optimistic UI

- **Given** efetivo é assignee de task em `Backlog`
- **When** arrasta card para `Em Desenvolvimento`
- **Then** card aparece em `Em Desenvolvimento` **imediatamente** (otimistic). Após network resolve, posição se mantém. Estado persiste em refresh.

### CA-05 — Kanban: rollback ao mover para Finalizada como efetivo

- **Given** efetivo é assignee de task em `Em Desenvolvimento`
- **When** arrasta card para `Finalizada`
- **Then** card aparece em `Finalizada` por <1s (optimistic), Toast de erro `"Você não tem permissão para esta ação."`, e card **retorna** para `Em Desenvolvimento`. Confirma optimistic rollback (Sprint 03 ADR 0003).

### CA-06 — Kanban: admin/coord move para Finalizada

- **Given** admin (ou coord)
- **When** arrasta card para `Finalizada`
- **Then** card permanece em `Finalizada`. Toast de sucesso. Persiste em refresh.

### CA-07 — Kanban: efetivo não vê controles destrutivos

- **Given** efetivo no detalhe de task
- **When** abre modal
- **Then** botões "Editar", "Arquivar", "Excluir" **não aparecem**. Mostra apenas "Fechar" + (se assignee) controles permitidos.

### CA-08 — Admin: bulk add whitelist

- **Given** admin em `/admin` aba Whitelist
- **When** cola `"foo@x.com, bar@x.com\nbaz@x.com"` no input e clica Adicionar
- **Then** Toast `"3 adicionado(s) com sucesso."`. Lista mostra os 3 novos com badge "Pendente" (sem profile ainda).

### CA-09 — Admin: rebaixar último admin

- **Given** banco com exatamente 1 admin (cleanup setup)
- **When** admin tenta mudar a própria role para `efetivo` no select
- **Then** Toast `"Não é possível rebaixar o único admin do sistema..."`. Select volta para `admin`. Refresh confirma role inalterada.

### CA-10 — Admin: soft-delete e restore

- **Given** profile não-admin em `/admin` aba Usuários
- **When** admin clica "Arquivar" → confirma → depois clica "Restaurar"
- **Then** após arquivar: badge "Arquivado" + `archived_at` populado. Após restaurar: badge some, `archived_at = null`.

### CA-11 — Auth: rejeição de email não-whitelisted

- **Given** email `intruso@evil.com` não está na whitelist
- **When** spec simula callback do auth com esse email (via fixture que chama `signUp` direto no SDK e captura o erro)
- **Then** página de login mostra mensagem amigável tipo `"E-mail não autorizado. Fale com o Admin."`. **Se este teste falhar, registrar dependência em Story 07B.2** (mapeamento de erro RLS na callback).

### CA-12 — Mobile visual: 4 rotas em 360x740

- **Given** project `mobile-chromium`
- **When** roda `mobile-visual.spec.ts` autenticado como admin (cobre todas as rotas)
- **Then** screenshots gerados em `__screenshots__/` para `/kanban`, `/dashboard`, `/profile`, `/admin`. Diff contra baseline com `maxDiffPixelRatio: 0.01`. Mask aplicada em timestamps e avatares.

### CA-13 — Mobile visual: sem overflow horizontal

- **Given** mesma suite mobile
- **When** spec verifica `await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)` em cada rota
- **Then** retorna `true` em todas — confirma que layout não overflow horizontal em 360px.

### CA-14 — WebKit smoke

- **Given** project `webkit`
- **When** roda subset (apenas `kanban.spec.ts`)
- **Then** todas as asserts críticas (criar tarefa, drag-drop) passam. Detecta cedo incompatibilidade com Safari iOS.

### CA-15 — Workflow de baseline documentado

- **Given** dev quer atualizar screenshot baseline após mudança visual intencional
- **When** abre `tests/e2e/README.md`
- **Then** encontra: comando para atualizar (`pnpm test:e2e:update-snapshots`), checklist de revisão visual antes de commitar baseline novo, política de commits separados ("nunca commitar baseline junto com lógica").

### CA-16 — CI integrado

- **Given** PR aberto
- **When** GitHub Actions roda
- **Then** job `e2e` instala Playwright com cache, sobe Supabase local, roda `pnpm test:e2e`. Falhas anexam screenshots e traces como artefato. Tempo total < 8 min.

## 5. Modelagem de Dados

Nenhuma alteração de schema. Pode exigir adicionar `data-testid` em alguns elementos:

- `[data-testid="toast"]` em `components/ui/ToastProvider.tsx`.
- `[data-testid="task-card"][data-task-id="..."]` em `TaskCard.tsx` para drag-drop estável.
- `[data-testid="kanban-column"][data-status="..."]` em `KanbanBoard.tsx`.
- `[data-testid="fab-new-task"]` no FAB.
- `[data-testid="admin-tab-whitelist"]` / `[data-testid="admin-tab-users"]`.

**Refactor leve, sem mudança comportamental.**

## 6. Escopo negativo

- ❌ Testar fluxo completo de OAuth Google real — usamos `signInWithPassword` em accounts seed. Para OAuth real, considerar staging dedicado fora desta sprint.
- ❌ Testes em iOS/Android dispositivos reais — só emulação WebKit/Chromium em viewport.
- ❌ Acessibilidade automatizada (axe-core) — adicionar em sprint posterior se priorizado.
- ❌ Teste de `sync-sheets` Edge Function — fora desta sprint.
- ❌ Performance budgets (LCP/INP medidos em E2E) — visíveis nos traces de Playwright; medir formal em sprint dedicada se necessário.
- ❌ Visual diff desktop — só mobile. Desktop tem cobertura funcional, sem screenshot.

## 7. Dependências

- Story 07A.1 (Vitest + scripts + README base).
- Story 07A.2 (fixtures de seed reaproveitadas).
- Supabase local rodando.
- **Bloqueio condicional:** se CA-11 falhar, Story 07B.2 deve entregar o mapeamento de erro na auth callback antes do CI da Sprint 07-A poder fechar verde.
