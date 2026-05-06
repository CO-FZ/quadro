# Sprint Plan — Sprint `<N>` (`<YYYY-MM-DD>` → `<YYYY-MM-DD>`)

> 1 sprint = 1–2 semanas. Documento curto, vivo durante a sprint, congelado ao final.

**Sprint goal (1 frase):**

```
[Qual o resultado de negócio/produto desta sprint?
ex: "Inspetor consegue criar e finalizar uma inspeção end-to-end."]
```

**Capacidade da equipe:** `<n dev-dias>` (humanos) + `<n agente-dias>` (Antigravity)

---

## 1. Backlog selecionado

| ID | Story / Task | Tipo | Estimativa | Owner | Prioridade | Status |
|----|--------------|------|-----------|-------|------------|--------|
| US-01 | Criar inspeção (form) | story | M | `<dev>` | P0 | ⬜ |
| US-02 | Listar inspeções | story | S | `<dev>` | P0 | ⬜ |
| TS-03 | Setup observabilidade | tech | M | `<dev>` | P1 | ⬜ |
| BUG-01 | Corrigir flicker no header | bug | XS | `<dev>` | P2 | ⬜ |

**Legenda tamanho:** XS (≤2h) · S (≤1d) · M (≤3d) · L (≤1sprint) · XL (quebrar!)
**Status:** ⬜ to do · 🟨 doing · 🟦 review · ✅ done

> Se aparecer **L ou XL**, quebre antes de iniciar. Subagente não rende em escopo gigante.

---

## 2. Definition of Ready (DoR)

Uma story só **entra na sprint** se:

- [ ] Tem critérios de aceite no formato Given/When/Then.
- [ ] Tem persona e prioridade definidas.
- [ ] Está referenciada no PRD ou em um ADR.
- [ ] Tem dependências mapeadas e desbloqueadas (ou plano para desbloquear).
- [ ] Cabe em até **M**. Se for **L**, foi quebrada.

---

## 3. Definition of Done (DoD)

Uma story só **sai da sprint** se:

- [ ] Critérios de aceite todos verdes (com evidência).
- [ ] `pnpm typecheck && pnpm lint && pnpm test:unit` passam.
- [ ] Cobertura de testes ≥ meta do projeto para o módulo.
- [ ] PR revisado por humano.
- [ ] Documentação atualizada (README, ADR ou docstring quando relevante).
- [ ] Telemetria adicionada para fluxos novos.
- [ ] Sem `TODO` órfão (se ficou TODO, virou story em `<sprint+1>`).
- [ ] Acessibilidade verificada nas telas afetadas.
- [ ] Deploy em staging realizado.
- [ ] Smoke test E2E passando em staging.

---

## 4. Compromissos & não-compromissos

**Vamos entregar:**

```
- US-01, US-02, TS-03
```

**NÃO vamos entregar (e está ok):**

```
- US-04 (depende de auth definitiva, ainda em PRD)
```

---

## 5. Riscos da sprint

| Risco | Mitigação |
|-------|-----------|
| `<dep externa atrasa>` | `<plano B>` |
| `<feriado X>` | `<rebaixar escopo>` |

---

## 6. Cerimônias

| Evento | Quando | Duração | Output |
|--------|--------|---------|--------|
| Planning | dia 1, manhã | 1h | este documento |
| Daily | todo dia útil | 10min | bloqueios atualizados |
| Demo | último dia | 30min | gravação no Knowledge Base |
| Retro | último dia | 45min | seção 8 abaixo |

---

## 7. Workspace por agente (Antigravity)

> Mapa de quem faz o quê em qual workspace. Evita conflito.

| Workspace | Agente | Story | Modo |
|-----------|--------|-------|------|
| `inspectai-web` | Agent A | US-01 | agent-assisted |
| `inspectai-web` (paralelo) | Agent B | TS-03 | agent-assisted |
| `inspectai-tests` (worktree separado) | Agent C | testes E2E | agent-driven |

> Ideal: **1 agente por workspace** quando o trabalho toca arquivos sobrepostos. Paralelizar só quando ortogonal.

---

## 8. Retrospectiva (preencher ao final)

**O que funcionou:**

- `[...]`

**O que não funcionou:**

- `[...]`

**O que vamos mudar na próxima sprint:**

- `[...]`

**Métrica da sprint:**

| Métrica | Valor |
|---------|-------|
| Stories planejadas | `<n>` |
| Stories concluídas | `<n>` |
| Bugs introduzidos | `<n>` |
| Bugs resolvidos | `<n>` |
| Cobertura no fim | `<%>` |
| Tempo médio de PR review | `<...>` |

---

## Como instruir o agente nesta fase

```
Sua tarefa é me ajudar a planejar a Sprint <N>.
1. Leia o PRD e a Tech Spec aprovados.
2. Sugira um conjunto de stories que cabem em <capacidade>.
3. Para cada story sugerida, verifique se passa no DoR.
4. Se uma story for grande (L/XL), proponha quebra em sub-stories M.
5. Mapeie dependências entre stories.
6. NÃO escreva código nesta fase.
Saída: este sprint plan preenchido + alertas em 🟡 do que está faltando.
```
