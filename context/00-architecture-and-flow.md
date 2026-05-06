# Arquitetura e Fluxo do Harness

> Como as peças deste harness se encaixam, em que ordem fluem, quem produz e quem consome cada artefato, e por que as restrições foram desenhadas assim.

> Leia este documento **antes** de qualquer outro. Ele é o mapa que dá sentido ao restante.

---

## 1. O que é o harness

Um **harness** é um arnês: um conjunto de cordas que prende o trabalho humano e o trabalho dos agentes a uma estrutura, evitando que qualquer dos dois caia no precipício.

Tecnicamente, este harness é:

- Um **conjunto de templates de documentos** (discovery, PRD, spec, ADR, sprint, story, runbook, checklist).
- Um **protocolo de contexto** que governa o que cada agente lê, lembra e esquece.
- Um **conjunto de rules** (`AGENTS.md`) que o Google Antigravity e outros runtimes agênticos compatíveis carregam automaticamente.
- Uma **convenção de stack** (Next.js 16.x + Tailwind v4 + TypeScript estrito) com seus padrões de código obrigatórios.
- Uma **pipeline de qualidade e segurança** (testes em pirâmide, checklists de release, runbook de deploy).

Tudo orientado a um objetivo: **delegar com segurança partes do trabalho a agentes de IA, sem perder controle, sem alucinação acumulada, sem dívida técnica invisível**.

---

## 2. Princípios arquiteturais

Cinco princípios sustentam todas as decisões deste harness. Quando algo parecer arbitrário, é porque deriva de um destes:

### P1 — Documento antes de código

Cada fase produz um artefato versionado em `docs/` que é a fonte de verdade para a fase seguinte. O agente nunca codifica a partir de um chat efêmero — ele codifica a partir de um documento aprovado.

### P2 — Contexto mínimo viável

Nenhum agente recebe mais informação do que precisa para sua tarefa. O custo do excesso de contexto não é só financeiro: é **degradação de qualidade**. Modelos diluem foco e começam a alucinar quando sobrecarregados. Por isso, o documento **`05-execution/00-context-protocol.md`** define quatro camadas de memória com regras estritas de transição.

### P3 — Artifacts, não prosa

A revisão humana acontece sobre **Artifacts** (o conceito nativo do Antigravity: planos, diffs, gravações, screenshots), não sobre logs de tool calls. O agente principal é responsável por consolidar evidência verificável em segundos, não em parágrafos.

### P4 — Humano no loop por padrão

O modo default é `agent-assisted`. `agent-driven` só é liberado quando há track record de confiança naquele tipo específico de tarefa, registrado em ADR. Tarefas com dinheiro, autenticação, dados pessoais ou deploy nunca migram para `agent-driven`.

### P5 — Sandbox sempre

Terminal Sandbox ligado, escopo restrito ao workspace, allowlist explícita de comandos. O agente não rasga o repositório nem o sistema de arquivos por engano.

---

## 3. Topologia do harness

```
                          ┌────────────────────────────────────┐
                          │           HUMANO (você)            │
                          │     PM/arquiteto/release manager   │
                          └────────────────┬───────────────────┘
                                           │
                                           │ define objetivo, aprova Artifacts
                                           ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │              GOOGLE ANTIGRAVITY  —  Mission Control              │
        │                                                                  │
        │  ┌─────────────────┐      ┌─────────────────┐                    │
        │  │  Editor View    │      │  Agent Manager  │                    │
        │  │  (síncrono)     │      │  (paralelo)     │                    │
        │  └─────────────────┘      └─────────────────┘                    │
        │                                                                  │
        │  ┌──────────────────────────────────────────────────────────┐    │
        │  │              AGENTE PRINCIPAL (por workspace)            │    │
        │  │  lê: AGENTS.md + docs/ + story atual                     │    │
        │  └─────────────┬─────────────┬───────────────┬──────────────┘    │
        │                │             │               │                   │
        │     ┌──────────▼───┐  ┌──────▼─────────┐ ┌───▼──────────────┐    │
        │     │ Browser sub. │  │ Subagente      │ │ Subagente em     │    │
        │     │ (validação   │  │ paralelo       │ │ workspace        │    │
        │     │  visual)     │  │ (mesmo ws)     │ │ separado         │    │
        │     └──────────────┘  └────────────────┘ └──────────────────┘    │
        │                                                                  │
        │  ┌──────────────────────────────────────────────────────────┐    │
        │  │             KNOWLEDGE BASE (long-term)                   │    │
        │  │  padrões aprovados · ADRs accepted · snippets            │    │
        │  └──────────────────────────────────────────────────────────┘    │
        └──────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │                 REPOSITÓRIO  (source of truth)                   │
        │                                                                  │
        │  AGENTS.md  ←  rules globais lidas pelos agentes                 │
        │  docs/                                                           │
        │    discovery/ · prd/ · spec/ · adr/ · sprints/                   │
        │    memory/   · runbooks/                                         │
        │  app/ · components/ · lib/ · tests/                              │
        │  proxy.ts  ·  app/globals.css (Tailwind v4)                      │
        └──────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │                       CI / CD pipeline                           │
        │  typecheck · lint · unit · integration · e2e · a11y · perf       │
        │  audit · gitleaks · SAST · build · staging · canary · prod       │
        └──────────────────────────────────────────────────────────────────┘
```

Três planos coexistem:

1. **Plano humano** (topo): você define objetivo, aprova Artifacts, autoriza release.
2. **Plano agêntico** (Antigravity): orquestra agente principal, subagentes, browser subagent e Knowledge Base.
3. **Plano de produção** (repositório + pipeline): código versionado, CI, deploy auditável.

A interação entre os planos é **mediada por documentos**, nunca por chat efêmero.

---

## 4. As sete fases — fluxo macro

```
   Discovery ──► PRD ──► Spec ──► Sprint ──► Execução ──► Testes ──► Deploy
      │           │       │         │           │           │          │
      ▼           ▼       ▼         ▼           ▼           ▼          ▼
   brief +     PRD     Tech Spec  Sprint     código +    suíte de    runbook
   canvas    aprovado  + ADRs      plan      Artifacts   testes      executado
                                  + stories                          + smoke
```

Cada seta é um **gate**. Você não passa para a próxima fase sem o artefato da anterior aprovado. Cada gate dispara o **ritual de limpeza de contexto** descrito no protocolo.

### 4.1 Discovery (fase 01)

**Objetivo:** descobrir se o problema vale a pena, antes de gastar 1 linha de código.

**Inputs:** intuição, dor de usuário relatada, dados, conversas.

**Outputs:** `01-discovery/00-discovery-brief.md` preenchido + `01-opportunity-canvas.md`.

**Quem trabalha:** humano em diálogo com 1 agente. **Sem subagentes.** Modo conversacional, divergente.

**Critério de saída:** sponsor aprova o problema, hipótese e métrica de sucesso. Se o veredito é "no-go", o documento fica arquivado com a lição aprendida — isso também é entrega.

### 4.2 PRD (fase 02)

**Objetivo:** definir **o que** o produto faz e **para quem**, com critérios verificáveis.

**Inputs:** discovery aprovado.

**Outputs:** `02-prd/00-prd-template.md` preenchido com user stories, critérios Given/When/Then, requisitos não-funcionais, métricas, plano de lançamento.

**Quem trabalha:** humano + 1 agente. Mesmo agente da discovery? **Não** — sessão nova, contexto limpo, mindset convergente.

**Critério de saída:** todos os critérios de aceite são observáveis e binarizáveis. Aprovação dos stakeholders listados.

### 4.3 Spec (fase 03)

**Objetivo:** traduzir o PRD em arquitetura, contratos e decisões técnicas.

**Inputs:** PRD aprovado.

**Outputs:** `03-spec/00-tech-spec.md` + N arquivos `adr/NNNN-*.md`, um por decisão importante.

**Quem trabalha:** eng lead + 1 agente. Subagente paralelo só se houver ADRs ortogonais a redigir.

**Critério de saída:** stack travada, modelo de domínio definido, contratos das Server Actions especificados, ADRs aprovados.

### 4.4 Sprint planning (fase 04)

**Objetivo:** quebrar o escopo aprovado em unidades de trabalho cabíveis.

**Inputs:** PRD + Spec.

**Outputs:** `04-sprints/<n>/sprint-plan.md` + N stories no template `01-story-template.md`.

**Quem trabalha:** time + 1 agente. O agente sugere quebra; humanos validam DoR.

**Critério de saída:** stories no tamanho M ou menor, com critérios de aceite, mapa de workspaces e atribuição de agentes.

### 4.5 Execução (fase 05)

**Objetivo:** transformar story em código mergeado.

**Inputs:** uma story por vez.

**Outputs:** PR com código, testes, screenshots, log em `docs/memory/execution/`.

**Quem trabalha:** 1 agente principal por story + browser subagent quando há UI. Eventualmente subagente em workspace separado para tarefas ortogonais.

**Critério de saída:** DoD satisfeito (typecheck, lint, testes, revisão humana, deploy em staging).

**Particularidade:** cada story é uma **sessão nova** do agente. Não se arrasta contexto entre stories. Veja o protocolo na seção 6.

### 4.6 Qualidade (fase 06)

A fase 06 não é sequencial — ela é **transversal**. Testes nascem na fase 05 (TDD para domínio, test-after para UI) e a estratégia em `06-testing/00-testing-strategy.md` é o contrato que toda story respeita.

**Outputs específicos da fase:** suíte E2E cobrindo P0 do PRD, configuração de Lighthouse CI, gates de cobertura no pipeline, testes de a11y automatizados.

### 4.7 Deploy (fase 07)

**Objetivo:** levar a versão a produção de forma reversível.

**Inputs:** main com CI verde + smoke em staging.

**Outputs:** versão em produção + log em `docs/memory/deploys/`.

**Quem trabalha:** release manager humano executa o runbook. Agente **não** faz deploy em produção; pode preparar release notes e rodar smoke em staging.

**Critério de saída:** canário promovido para 100%, smoke pós-deploy verde, sem alertas em 1h.

---

## 5. As quatro camadas de memória

Este é o pedaço mais importante da arquitetura. Repete-se aqui o que está em `05-execution/00-context-protocol.md`, com foco em **por quê**.

```
┌──────────────────────────────────────────────────────┐
│  Camada 1: Knowledge Base (Antigravity)              │  long-term, atemporal
│  Decisões e padrões que valem para sempre.           │
├──────────────────────────────────────────────────────┤
│  Camada 2: Repositório (AGENTS.md + docs/)           │  source of truth versionado
│  Tudo que entra em PR e tem histórico git.           │
├──────────────────────────────────────────────────────┤
│  Camada 3: Logs de fase (docs/memory/<fase>/)        │  resumos auditáveis
│  Resumo final da sessão, não o log cru.              │
├──────────────────────────────────────────────────────┤
│  Camada 4: Context window do agente                  │  efêmero, descartável
│  O recorte mínimo da tarefa atual.                   │
└──────────────────────────────────────────────────────┘
```

**Por que quatro camadas e não uma só?**

Porque cada camada tem custo diferente e propósito diferente:

- **Camada 1** é cara de manter (cura humana) e barata de consultar. Boa para o que é estável.
- **Camada 2** é a fonte de verdade legal — entra em git, entra em revisão, entra em ADR.
- **Camada 3** existe para responder "o que aconteceu na sessão de ontem" sem reabrir o histórico inteiro do chat.
- **Camada 4** é volátil por design. Se ela sobrevive entre sessões, você está fazendo errado.

**A regra-mãe:** quando você passa de fase ou de story, **encerre a sessão do agente**. Comece nova. A Camada 4 zera. Camadas 1, 2 e 3 carregam o que importa.

---

## 6. O ciclo de uma story (fluxo zoom-in)

```
   ┌───────────────────────────────────────────────────────────┐
   │  HUMANO seleciona story do sprint plan                    │
   └────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
   ┌───────────────────────────────────────────────────────────┐
   │  Nova sessão do AGENTE PRINCIPAL                          │
   │  Bootstrap mínimo:                                        │
   │    1. AGENTS.md (raiz)                                    │
   │    2. tech-spec — apenas seção do módulo afetado          │
   │    3. ADRs aplicáveis ao módulo                           │
   │    4. story.md atual                                      │
   │    5. arquivos do código que o plano vai tocar            │
   └────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
   ┌───────────────────────────────────────────────────────────┐
   │  AGENTE produz PLAN ARTIFACT                              │
   │  Lista arquivos, passos, dependências, subagentes         │
   └────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
   ┌───────────────────────────────────────────────────────────┐
   │  HUMANO revisa o plano (gate 1)                           │
   │  Aprovado? ──► segue                                      │
   │  Rejeitado? ──► volta a refinar                           │
   └────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
   ┌───────────────────────────────────────────────────────────┐
   │  AGENTE executa passo a passo                             │
   │  A cada passo:                                            │
   │    • implementa                                           │
   │    • roda typecheck + lint + test:unit                    │
   │    • se UI: invoca browser subagent + screenshot          │
   │  Pausa em dúvidas relevantes                              │
   └────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
   ┌───────────────────────────────────────────────────────────┐
   │  AGENTE entrega ARTIFACT FINAL                            │
   │  Sumário · arquivos alterados · como testar · riscos      │
   └────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
   ┌───────────────────────────────────────────────────────────┐
   │  HUMANO revisa diff (gate 2)                              │
   │  PR aprovado e mergeado                                   │
   └────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
   ┌───────────────────────────────────────────────────────────┐
   │  AGENTE escreve log em docs/memory/execution/             │
   │  Sessão é ENCERRADA                                       │
   │  Padrões reutilizáveis viram Knowledge Base               │
   └───────────────────────────────────────────────────────────┘
```

Dois gates humanos por story (plano e diff). Dois cleanups de contexto (entrada e saída). Resultado: rastreabilidade total e contexto sempre fresco.

---

## 7. O fluxo de delegação a subagentes

A heurística é simples: **delegação tem custo de coordenação**. Você só delega quando o ganho de paralelismo supera esse custo.

```
              "Tenho uma tarefa para o agente"
                          │
                          ▼
              ┌───────────────────────┐
              │ Cabe em 1 sessão?     │── sim ──► 1 AGENTE, sem subagentes
              └──────────┬────────────┘
                         │ não
                         ▼
              ┌───────────────────────┐
              │ Tem componente de UI  │── sim ──► + BROWSER SUBAGENT
              │ a validar?            │           para validação visual
              └──────────┬────────────┘
                         ▼
              ┌───────────────────────┐
              │ As subtarefas tocam   │── sim ──► 1 AGENTE sequencial
              │ arquivos sobrepostos? │           (paralelizar = merge hell)
              └──────────┬────────────┘
                         │ não
                         ▼
              ┌───────────────────────┐
              │ As subtarefas são     │── sim ──► WORKSPACES SEPARADOS
              │ ortogonais (ex: docs  │           via Agent Manager
              │ + testes)?            │
              └──────────┬────────────┘
                         │ não
                         ▼
                Default: 1 AGENTE, sequencial
```

**Regra de ouro:** o default é não delegar. Delegação é uma decisão consciente, não automática.

Para o briefing de cada subagente, há um template em `05-execution/01-subagent-delegation.md` com quatro campos: objetivo, pronto-quando, não-faça, leia-apenas. Sem isso, o subagente vira um agente tradicional que come o contexto inteiro.

---

## 8. Como o `AGENTS.md` se conecta a tudo

`AGENTS.md` é o arquivo mais importante do repositório, depois do código em si. Ele:

- É **lido automaticamente** pelo Antigravity, Claude Code, Codex, Cursor (convenção da indústria desde fim de 2025).
- É a **maior autoridade** em conflitos com instruções de chat.
- É **versionado** em git como qualquer outro arquivo — alterações passam por PR.
- É **enxuto** (alvo: ~200 linhas) — um agente lê em < 10 segundos.

Funções:

```
┌──────────────────────────────────────────┐
│ AGENTS.md                                │
├──────────────────────────────────────────┤
│ identidade do agente                     │  ← "você é um eng sênior"
│ modo de operação (agent-assisted)        │  ← evita autonomia indevida
│ allowlist de comandos                    │  ← evita rm -rf surpresa
│ stack obrigatória                        │  ← Next 16, Tailwind v4
│ padrões de código                        │  ← Server Components default
│ gates antes de modificar                 │  ← Plan Artifact obrigatório
│ gates antes de commit                    │  ← typecheck/lint/test
│ regras de secrets                        │  ← nunca lê .env em chat
│ quando parar e perguntar                 │  ← critérios ausentes, $$, auth
│ regras de memória                        │  ← Knowledge Base curada
│ formato de output                        │  ← sumário 5 linhas, riscos, próximo passo
└──────────────────────────────────────────┘
```

Quando uma rule do `AGENTS.md` ficar obsoleta, a alteração passa por **PR** — porque mudar a regra do jogo precisa de revisão humana. Não se altera por chat.

---

## 9. Como a stack escolhida apoia o fluxo

A stack não foi escolhida só por "ser moderna". Cada peça apoia o fluxo agêntico:

**Next.js 16.2+** — tem `AGENTS.md` nativo no `create-next-app`, browser log forwarding (erros do browser vão direto para o terminal do agente), Cache Components com `"use cache"` explícito (sem caching mágico que confunde o agente), `proxy.ts` substituindo `middleware.ts` (nome menos ambíguo), e MCP devtools experimentais.

**Tailwind v4** — config CSS-first via `@theme` em `globals.css`. Sem `tailwind.config.js`. **Um arquivo a menos** para o agente confundir, e tokens de design ficam na mesma camada do CSS (mais previsível ao gerar UI).

**TypeScript estrito** — o compilador é o primeiro revisor do agente. Sem `any`, sem implicit. Quando o agente erra, o tipo grita antes do humano ler.

**Server Components + Server Actions** — menos cerimônia, menos boilerplate, menos chance do agente inventar API routes desnecessárias. Validação Zod na borda em toda action é regra inegociável.

**Vitest + Playwright + axe** — feedback rápido em três escalas. O agente sabe se errou em segundos (unit), em minutos (integration), em < 5 min (E2E completo).

**pnpm** — lockfile estável e mais rápido; comportamento mais previsível em CI.

---

## 10. Como o pipeline traduz o harness em garantia

```
   Push em PR
        │
        ▼
   ┌─────────────────────┐
   │ quality job         │  typecheck · lint · unit · audit · gitleaks
   └──────────┬──────────┘
              │ paralelo
              ▼
   ┌─────────────────────┐
   │ integration job     │  Server Actions contra Postgres efêmero
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │ e2e job             │  Playwright em build de produção
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │ lighthouse job      │  performance + a11y budgets
   └──────────┬──────────┘
              │
              ▼
   Merge para main ──► auto-deploy em staging
              │
              ▼
   Tag vX.Y.Z ──► canário 10% ──► observação 10min ──► 100% ou rollback
```

Cada gate do pipeline corresponde a uma garantia que o harness promete:

- `typecheck` valida o **AGENTS.md sobre tipos**.
- `unit + integration` valida a **estratégia de testes**.
- `e2e` valida os **critérios de aceite do PRD**.
- `lighthouse` valida os **budgets de performance da Spec**.
- `audit + gitleaks + SAST` valida a **checklist de segurança**.
- `canário` valida o **runbook de deploy**.

Se um gate falha, o agente **não pode** declarar a tarefa pronta. O humano **não pode** mergear. Não há atalho.

---

## 11. O que cada papel faz no harness

| Papel | O que produz | O que aprova | O que nunca faz |
|-------|--------------|--------------|------------------|
| **Sponsor** | direção estratégica | go/no-go de discovery, GA | escolhe stack |
| **Product owner** | discovery, PRD | escopo de sprint | define arquitetura |
| **Eng lead** | tech spec, ADRs | arquitetura, releases | merge sem revisão |
| **Dev / contribuidor** | stories, código, testes | PR de outros | push em main direto |
| **Release manager** | runbook, release notes | promoção a prod | bypass do CI |
| **Agente principal** | plan artifact, código, log de sessão | nada | deploy em prod, push, secrets |
| **Browser subagent** | screenshots, smoke visual | nada | edição de código |
| **Subagente paralelo** | artefato escopado, contido | nada | tocar fora do briefing |

A coluna mais importante é **"o que nunca faz"**. É o que define os limites do harness.

---

## 12. Como o harness evolui

Este harness não é estático. Ele evolui sob as mesmas regras que governa:

1. **Mudanças de stack ou padrão obrigatório** → ADR.
2. **Mudanças no `AGENTS.md`** → PR com revisão.
3. **Novos templates ou checklists** → contribuição via PR.
4. **Lições aprendidas em retro** → entram no canvas da próxima sprint, e em casos relevantes, sobem para `docs/memory/<fase>/_summary.md` ou para a Knowledge Base.

Sinais de que o harness precisa de revisão:

- O agente está repetidamente quebrando uma rule que não está clara.
- Uma fase está consistentemente atrasando o release.
- Um template está sendo ignorado porque "não cabe".
- Subagentes estão sendo subutilizados ou superutilizados.
- A taxa de retrabalho de plano-rejeitado está alta.

Trate qualquer um desses sinais como dívida do harness e abra story para resolver na sprint de "saúde de processo".

---

## 13. Anti-padrões que o harness existe para impedir

Estes são os erros recorrentes que motivaram cada peça:

| Anti-padrão | O que acontece | O harness evita via |
|-------------|----------------|---------------------|
| "Vou só prototipar primeiro" | protótipo vira produção, sem testes | gates de DoR/DoD |
| "Cole o repo inteiro no chat" | contexto saturado, alucinação | bootstrap mínimo |
| "Deixa o agente decidir a arquitetura" | decisão sem revisão, sem rastro | ADR obrigatório |
| "Vou rodar 5 agentes em paralelo" | merge hell, retrabalho | matriz de delegação |
| "Salva tudo na memória" | Knowledge Base poluída | curadoria explícita |
| "Push direto em prod, é só um patchzinho" | incidente | runbook + canário |
| "Esse secret eu coloco no .env.example só pra exemplo" | vazamento | `gitleaks` + checklist |
| "Esse warning de typecheck depois eu vejo" | bug em prod | gate de CI |
| "O agente escreveu, então deve estar certo" | regressão silenciosa | gates de testes + revisão |

---

## 14. Resumo em uma frase

> **O harness é um conjunto de documentos e protocolos que transforma agentes de IA em colaboradores rastreáveis: contexto recortado, decisões versionadas, código auditado e deploy reversível, com humano nos gates certos.**

Se em algum momento o trabalho começar a parecer mais lento por causa do harness, **provavelmente está**. E é proposital — a velocidade que importa é a de **shipping seguro recorrente**, não a de pull request individual.

---

## 15. Onde ir agora

| Você é... | Leia em seguida |
|-----------|-----------------|
| Novo no projeto | `README.md` → `AGENTS.md` → `05-execution/00-context-protocol.md` |
| Vai começar produto novo | `01-discovery/00-discovery-brief.md` |
| Vai escrever PRD | `02-prd/00-prd-template.md` |
| Vai desenhar arquitetura | `03-spec/00-tech-spec.md` + `01-adr-template.md` |
| Vai planejar sprint | `04-sprints/00-sprint-plan.md` + `01-story-template.md` |
| Vai implementar story | `05-execution/02-nextjs-conventions.md` |
| Vai delegar a subagente | `05-execution/01-subagent-delegation.md` |
| Vai escrever testes | `06-testing/00-testing-strategy.md` |
| Vai fazer release | `07-deploy/00-deploy-runbook.md` + `01-security-checklist.md` |
