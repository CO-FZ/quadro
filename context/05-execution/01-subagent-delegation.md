# Subagent Delegation — Quando, Como e Para Quê

> Antigravity permite orquestrar múltiplos agentes em paralelo via **Agent Manager** (Mission Control), além de subagentes especializados (browser subagent). Este documento dita as regras de quando vale paralelizar, quando vale especializar, e quando é melhor manter **um único agente**.

---

## Modelo mental

```
                ┌──────────────────────┐
                │   Você (humano)      │
                │   Arquiteto / PM     │
                └──────────┬───────────┘
                           │ define objetivo
                           ▼
                ┌──────────────────────┐
                │  Agente principal    │  ← faz o plano, executa o grosso
                │  (conversa de chat)  │
                └──────────┬───────────┘
                           │ delega
                ┌──────────┼──────────┐
                ▼          ▼          ▼
        Browser sub.   Outro agente   Outro workspace
        (validação    (workspace      (tarefa
        visual)        paralelo)      ortogonal)
```

---

## Tipos de delegação

### 1. Subagente embutido (browser subagent)

Já existe no Antigravity. **Use sempre** que precisar de:

- Validação visual de uma rota / componente / fluxo.
- Smoke test E2E rápido durante implementação.
- Captura de screenshot/gravação para Artifact de revisão.
- Verificar console errors no browser real.

**Comando padrão para o agente principal:**

```
Use o browser subagent para abrir <URL>, executar <ação>,
capturar screenshot do resultado e anexar ao Artifact.
Pare se houver erro no console.
```

### 2. Agente paralelo no mesmo workspace

⚠️ **Evitar** quando os agentes podem tocar arquivos sobrepostos. Conflito de edição é o cenário mais comum de retrabalho.

**Use só quando:**

- As tarefas são **estritamente ortogonais** (ex.: agente A escreve documentação, agente B escreve testes que **não** dependem do código que A está alterando).
- Há mecanismo de coordenação (branches diferentes, worktrees).

### 3. Agente em workspace separado

✅ **Padrão para paralelização real.**

Cenários típicos:

- Workspace `app/` (frontend) e `infra/` (terraform/CI) avançando em paralelo.
- Workspace `web/` e `mobile/` compartilhando contratos.
- Worktree separado dedicado a refactoring grande, isolado da feature em andamento.

### 4. Não delegar (manter agente único)

Use **um agente, um chat, uma story** quando:

- A story é coesa e cabe em uma sessão.
- Há acoplamento alto entre arquivos.
- O custo de coordenação > benefício do paralelismo.

> **Default deve ser não delegar.** Delegação tem custo cognitivo, e às vezes você sai com 3 PRs meia-boca quando teria saído com 1 PR sólido.

---

## Matriz de decisão

| Situação | Decisão |
|----------|---------|
| Story M, 3–5 arquivos, 1 módulo | 1 agente |
| Validação visual durante a story | + browser subagent |
| Refactor grande + feature ao mesmo tempo | 2 workspaces (worktree) |
| Documentação extensa + código | 1 agente, sequencial; ou 2 workspaces se ortogonais |
| Migration de schema + UI dependente | 1 agente, sequencial. **Nunca paralelo.** |
| Setup de CI + setup de auth | 2 workspaces, ortogonal ✅ |
| Bug em produção | 1 agente, foco total, sem paralelismo |

---

## Como instruir cada subagente

### Princípio: Briefing mínimo, contexto recortado

Cada subagente recebe **apenas**:

1. **Objetivo único** — uma frase.
2. **Critério de pronto** — observável, verificável.
3. **Restrições** — o que **não** fazer.
4. **Recursos** — links para docs específicas (não o repo inteiro).

### Template — briefing de subagente

```
OBJETIVO
<uma frase clara, verbo no imperativo>

PRONTO QUANDO
- [ ] <critério 1>
- [ ] <critério 2>

NÃO FAÇA
- <fora do escopo 1>
- <fora do escopo 2>

LEIA APENAS
- AGENTS.md
- docs/spec/00-tech-spec.md (seção <X>)
- <arquivo específico>

OUTPUT ESPERADO
- Artifact com diff + 5 linhas de sumário
```

### Exemplo concreto

```
OBJETIVO
Adicionar testes E2E para o fluxo "criar inspeção" no Playwright.

PRONTO QUANDO
- [ ] tests/e2e/inspections.spec.ts existe e passa
- [ ] Cobre: usuário logado, formulário válido, formulário inválido, persistência
- [ ] Roda em < 30s no CI

NÃO FAÇA
- Não modifique app/(app)/inspections/* (essa é outra story)
- Não introduza dependências novas sem ADR

LEIA APENAS
- AGENTS.md
- harness/06-testing/00-testing-strategy.md
- docs/sprints/<n>/US-01.md
- playwright.config.ts existente

OUTPUT ESPERADO
- Artifact com o teste, screenshot da execução verde, sumário em 5 linhas
```

---

## Regras de coordenação

### Quem é o "tech lead" da sessão?

Sempre o **agente principal** com quem você está conversando. Subagentes reportam para ele, não para você diretamente. Você fala com o principal; ele decompõe.

### Sincronização

- Subagentes finalizam **antes** do principal consolidar.
- O principal **valida** os Artifacts dos subagentes antes de declarar tarefa pronta.
- Conflitos: o principal **escolhe** e justifica no Artifact final.

### Falha de subagente

Se um subagente:

- ❌ Excede orçamento de tempo/turnos → cancele e refaça com escopo menor.
- ❌ Toca arquivos fora do briefing → reverta a alteração; refaça o briefing.
- ❌ Produz código que quebra typecheck do projeto → o principal **não** integra; pede correção ou refaz.

---

## Padrões de delegação por fase

| Fase | Recomendação |
|------|--------------|
| Discovery | 1 agente, modo conversacional. Sem subagentes. |
| PRD | 1 agente. Eventualmente subagente para validação de concorrência via web. |
| Spec | 1 agente. Subagente paralelo só se houver ADRs independentes a redigir. |
| Sprint planning | 1 agente. |
| Execução de story | 1 agente principal + browser subagent quando há UI. |
| Refatoração grande | Workspace dedicado, agente separado, agent-driven com revisão. |
| Hotfix | 1 agente, foco máximo, sem paralelismo. |
| Documentação extensa | 1 agente sequencial, ou workspace separado em paralelo se docs são ortogonais ao código. |

---

## Anti-padrões

- ❌ Subir 5 agentes "para acelerar" sem delimitar workspace e escopo. Resultado: merge hell.
- ❌ Pedir para o subagente "ler tudo do projeto antes de começar". Resultado: token gasto, foco perdido.
- ❌ Usar `agent-driven` em subagente novo, sem track record de confiança no domínio.
- ❌ Delegar decisão de arquitetura para subagente. Decisões vão para ADR, não para chat efêmero.
- ❌ Manter subagente vivo entre stories diferentes. Encerre, abra nova sessão com briefing limpo.
