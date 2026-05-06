# Retrospectiva do Harness — Iteração 01

**Data:** 2026-05-06
**Escopo coberto:** Discovery → Design System → Sprint 01 (User Management) + esboço Sprint 02 (Tarefas).
**Sessão de origem:** [`session-01-discovery-auth.md`](session-01-discovery-auth.md)
**Status:** proposta de melhorias para PR contra o repositório da skill `agent-product-harness`.

> Este documento é **harness debt**: padrões e gaps que apareceram aplicando o harness em um produto real (Quadro / CO-FZ) e que devem retroalimentar a skill em `.gemini/antigravity/skills/agent-product-harness/`.

---

## 1. Gaps estruturais observados

### 1.1 Falta uma fase de **Design System** entre PRD e Spec

**O que aconteceu:** logo da CO-FZ foi analisada, paleta extraída (Blue 800, Amber 500, Emerald 500…), tipografia e tokens definidos e gravados em [`docs/spec/01-design-system.md`](../spec/01-design-system.md) + `app/globals.css` (Tailwind v4 `@theme`). Tudo isso aconteceu **antes** da Tech Spec, mas o harness não prevê esse momento.

**Por que é um gap:**
- O fluxo macro do harness é `Discovery → PRD → Spec → Sprint → Execução` ([`references/00-architecture-and-flow.md`](../../.gemini/antigravity/skills/agent-product-harness/agent-product-harness/references/00-architecture-and-flow.md) §4). Design System cai como subproduto da Spec, sem template, sem gate.
- Sem template, a extração da paleta vira improviso. Sem gate, não há aprovação visual antes de o agente começar a montar componentes Shadcn.
- Tailwind v4 com `@theme` em `globals.css` exige tokens **antes** do primeiro componente; refazer depois custa caro.

**Proposta:**
- Criar fase **02.5 — Design Foundations** (ou subseção dedicada no PRD/Spec) com template em `references/02b-design/00-design-foundations.md` cobrindo:
  - Análise da identidade visual (logo, brand assets) e extração de paleta.
  - Tokens de cor (light/dark), tipografia, escala, raios, sombras, motion.
  - Princípios de UX (mobile-first, contraste, foco) com critérios verificáveis.
  - Estados de componentes-chave (botão, input, card, modal) com referência Shadcn.
  - Output esperado: `docs/spec/01-design-system.md` + bloco `@theme` em `app/globals.css` + screenshot do "starter kit" (browser subagent).
- Gate: aprovação visual humana em Artifact antes de qualquer story de UI entrar em execução.

---

### 1.2 Discovery não tem **elicitação guiada**

**O que aconteceu:** o template [`01-discovery/00-discovery-brief.md`](../../.gemini/antigravity/skills/agent-product-harness/agent-product-harness/references/01-discovery/00-discovery-brief.md) é um **formulário estático**. O bloco final "Como instruir o agente nesta fase" diz apenas *"faça perguntas até preencher"* — sem roteiro, sem ordem, sem follow-ups, sem critério para parar.

Resultado: o brief foi preenchido, mas com seções rasas — Stakeholders com 4 papéis apontando para a mesma pessoa, Restrições "a definir", Evidências com 1 entrada qualitativa. Tudo fica aprovado por inércia porque o agente não sabe quando empurrar.

**Por que é um gap:**
- A heurística "agente conduz a entrevista" só funciona com **roteiro discriminador**: que perguntas atacam cada hipótese, qual sinal é "vermelho" (contradição, lacuna, falta de evidência).
- Sem isso, o brief vira preenchimento de campo e perde o propósito do gate (`Critério de saída: sponsor aprova problema, hipótese e métrica`).

**Proposta:**
- Criar `references/01-discovery/02-elicitation-guide.md` com:
  - **Árvore de perguntas** por seção (Problema → "quem mais?", "quanto custa hoje?", "qual o workaround?"; Hipótese → "o que invalidaria?", "qual o menor experimento?").
  - **Padrões de challenge** que o agente deve aplicar: 1 stakeholder = 1 papel real; toda métrica precisa de baseline; toda restrição precisa de número.
  - **Critério de "pronto para PRD"**: ≥ 3 evidências (≥ 1 quantitativa), 1 anti-evidência testável, ≥ 1 não-objetivo concreto, métrica com baseline + meta + instrumento.
- Atualizar o bloco *"Como instruir o agente"* do brief para apontar para o guide e exigir que o agente registre, ao final, **as 3 perguntas que faltaram resposta** (já está no template, mas reforçar como gate).

---

### 1.3 Estrutura de `docs/sprints/` divergiu do harness

**O que aconteceu:** stories foram criadas como [`docs/sprints/story-01-user-management.md`](../sprints/story-01-user-management.md) e [`docs/sprints/story-02-task-management.md`](../sprints/story-02-task-management.md), na raiz de `sprints/`. O harness manda `docs/sprints/<n>/<story-id>.md` ([`SKILL.md`](../../.gemini/antigravity/skills/agent-product-harness/agent-product-harness/SKILL.md) §D, [`04-sprints/00-sprint-plan.md`](../../.gemini/antigravity/skills/agent-product-harness/agent-product-harness/references/04-sprints/00-sprint-plan.md)).

Faltou também o `sprint-plan.md` da Sprint 01 — stories existem sem sprint que as agrupe.

**Proposta:**
- Reforçar no `SKILL.md` §A (Bootstrap) que o scaffolding deve criar `docs/sprints/01/` com `sprint-plan.md` placeholder, **não** apenas a pasta vazia `sprints/`.
- §D (Story execution) já cita o caminho — adicionar uma checagem de pré-flight: se `docs/sprints/<n>/sprint-plan.md` não existe, recusar e pedir para gerar primeiro.
- Migrar as duas stories existentes para `docs/sprints/01/story-01-user-management.md` e `02/story-02-task-management.md` na próxima sessão (custo baixo, paga dívida).

---

### 1.4 Decisões de **Auth / RBAC / Whitelist** sem ADR

**O que aconteceu:** a migration `20260506000000_user_management.sql` criou:
- Tabela `whitelist` + RLS.
- Tabela `profiles` + RLS.
- Trigger que bloqueia signup fora da whitelist.
- Trigger que atribui role `efetivo` por default.
- Seed do admin.

Tudo isso é **decisão arquitetural com impacto em segurança** — exatamente o que [`AGENTS.md`](../../AGENTS.md) §8 manda parar e abrir ADR antes de codificar:
> Pare e pergunte se… A tarefa envolve dinheiro, dados pessoais, autenticação ou autorização sem ADR.

Não há nenhum arquivo em `docs/spec/adr/`. A pasta sequer existe.

**Proposta:**
- Bloquear no `SKILL.md` §D step 2 ("Bootstrap mínimo") uma checagem: se a story toca auth/RBAC/billing/PII e não há ADR aplicável, **forçar** o agente a redigir o ADR como primeiro passo do plano (pré-implementação).
- Criar agora ADRs retroativos:
  - `docs/spec/adr/0001-rbac-via-supabase-rls.md`
  - `docs/spec/adr/0002-whitelist-de-emails-por-trigger.md`
- Tornar a pasta `docs/spec/adr/` obrigatória no scaffold de bootstrap (hoje só `spec/` é criada).

---

### 1.5 `docs/memory/` está plano em vez de fatiado por fase

**O que aconteceu:** [`session-01-discovery-auth.md`](session-01-discovery-auth.md) está na **raiz** de `docs/memory/`, não em `docs/memory/<fase>/`. O harness ([`05-execution/00-context-protocol.md`](../../.gemini/antigravity/skills/agent-product-harness/agent-product-harness/references/05-execution/00-context-protocol.md), [`SKILL.md`](../../.gemini/antigravity/skills/agent-product-harness/agent-product-harness/SKILL.md) §B) espera:
- `docs/memory/discovery/`
- `docs/memory/prd/`
- `docs/memory/spec/`
- `docs/memory/sprints/`
- `docs/memory/execution/<YYYY-MM-DD>-<story-id>.md`
- `docs/memory/deploys/`

E principalmente: `_summary.md` por fase, que é o que destrava a transição (§B "Refuse to advance if `_summary.md` is missing").

**Proposta:**
- Atualizar bootstrap para criar as subpastas vazias com `.gitkeep`.
- Adicionar `_summary.md` template em `references/05-execution/05-phase-summary-template.md`.
- Mover (ou desdobrar) `session-01-discovery-auth.md` em:
  - `docs/memory/discovery/_summary.md` — só a parte de discovery.
  - `docs/memory/spec/_summary.md` — design system + decisão de auth.
  - `docs/memory/execution/2026-05-06-bootstrap-auth.md` — migration + clients SSR + proxy.

---

### 1.6 Sessão pulou o **Plan Artifact + Gate humano**

**O que aconteceu:** a sessão 01 saltou da extração de paleta direto para `npx supabase init`, criação de migration, instalação de `@supabase/ssr`, criação dos clients e do `proxy.ts`. Não há registro de:
- Plan Artifact listando "vou tocar X arquivos por Y razão" antes de executar.
- Aprovação humana explícita do plano (Gate 1 do harness).
- Final Artifact com sumário ≤ 5 linhas / riscos / próximo passo.

`AGENTS.md` §5 exige Plan Artifact obrigatório para tasks que tocam ≥ 3 arquivos ou envolvem schema/auth/billing/deploy. As duas condições estavam presentes.

**Proposta:**
- Adicionar ao `SKILL.md` §D uma seção curta **"Gate 1 obrigatório"** com 4 itens-checklist que o agente deve produzir antes de tocar código (lista de arquivos, justificativa, subagentes, riscos). Sem isso, o agente recusa avançar.
- Criar `references/05-execution/06-plan-artifact-template.md` (hoje o formato é descrito em prosa em vários lugares; vira template único).

---

### 1.7 Falta template para revisão de **migration / schema**

**O que aconteceu:** a migration foi escrita em uma única passada. Não há checklist de revisão para:
- RLS coerente (políticas por role para `select`/`insert`/`update`/`delete`).
- Idempotência (`if not exists`, `on conflict`).
- Rollback (a migration tem `down`?).
- Seed de admin não vaza segredos no git.
- Triggers cobrem casos de borda (delete de profile, troca de email).

**Proposta:**
- Criar `references/05-execution/07-migration-checklist.md` (Postgres + Supabase) — invocado pela skill externa `supabase` em complemento.
- Cobrar esse checklist no Final Artifact de qualquer story que mexa em schema (gate de PR).

---

### 1.8 **Glossário do produto** não vive em lugar nenhum

**O que aconteceu:** termos `DT`, `DA`, `Efetivo`, `Coordenador`, `Whitelist`, `FAB`, `Setor` aparecem soltos em discovery, design system e stories. Cada nova sessão vai precisar reconstruir o vocabulário. O harness não tem um lugar canônico para isso — só PRD §3 (Personas), que é insuficiente para terminologia operacional.

**Proposta:**
- Adicionar `references/02-prd/01-glossary-template.md` e gerar `docs/prd/01-glossary.md` no bootstrap.
- Tornar o glossário parte do **bootstrap mínimo** ([`SKILL.md`](../../.gemini/antigravity/skills/agent-product-harness/agent-product-harness/SKILL.md) §D step 2) — o agente sempre carrega.

---

## 2. O que funcionou bem (manter)

- **Tailwind v4 via `@theme` em `globals.css`** — sem `tailwind.config.js` evitou ramificação de configuração. Tokens ficaram a 1 arquivo do CSS de cada componente.
- **`proxy.ts` substituindo `middleware.ts`** — nome menos ambíguo, alinhado com Next 16. Agente não confundiu.
- **AGENTS.md em PT-BR no repositório** — leitura direta, gates citados textualmente nas decisões.
- **Skill externa `supabase`** preencheu a lacuna onde o harness é silencioso (RLS, triggers, clients SSR).

---

## 3. Punch list — itens prontos para virar PR contra a skill

| # | Mudança | Arquivo na skill |
|---|---------|------------------|
| 1 | Nova fase Design Foundations + template | `references/02b-design/00-design-foundations.md` (novo) |
| 2 | Discovery elicitation guide | `references/01-discovery/02-elicitation-guide.md` (novo) |
| 3 | Phase summary template | `references/05-execution/05-phase-summary-template.md` (novo) |
| 4 | Plan Artifact template | `references/05-execution/06-plan-artifact-template.md` (novo) |
| 5 | Migration / schema checklist | `references/05-execution/07-migration-checklist.md` (novo) |
| 6 | Glossary template | `references/02-prd/01-glossary-template.md` (novo) |
| 7 | Bootstrap cria `docs/spec/adr/` + `docs/memory/<fase>/` + `docs/sprints/01/` | `SKILL.md` §A |
| 8 | §D recusa story sem `sprint-plan.md` ou sem ADR (em domínios sensíveis) | `SKILL.md` §D |
| 9 | §B exige `_summary.md` por fase para destravar a próxima (já está, reforçar) | `SKILL.md` §B |
| 10 | Atualizar fluxo macro em `00-architecture-and-flow.md` §4 incluindo Design Foundations | `references/00-architecture-and-flow.md` |

---

## 4. Punch list — itens locais (próxima sessão deste produto)

- [ ] Reorganizar `docs/sprints/` em `01/` e `02/` com `sprint-plan.md` por sprint.
- [ ] Criar `docs/spec/adr/0001-rbac-via-supabase-rls.md` e `0002-whitelist-emails-trigger.md`.
- [ ] Criar `docs/memory/{discovery,prd,spec,sprints,execution,deploys}/` e mover o conteúdo de `session-01` para os respectivos `_summary.md`.
- [ ] Criar `docs/prd/01-glossary.md` com DT, DA, Efetivo, Coordenador, Whitelist, Setor, FAB.
- [ ] Antes da próxima execução (login UI / painel admin): produzir Plan Artifact e pausar para aprovação humana.

---

## 5. Próximo passo sugerido

Aprovar este documento → abrir uma sessão de "saúde de processo" para executar a punch list local (§4). Os itens da §3 viram PRs contra `.gemini/antigravity/skills/agent-product-harness/` em paralelo, sem bloquear a Sprint 02.
