# Story `<ID>` — `<Título curto>`

> Unidade de trabalho da sprint. 1 story = 1 PR (ou conjunto pequeno de PRs).
> Salvar em `docs/sprints/<sprint-N>/<id>.md`.

**Tipo:** `story | bug | tech-task | spike | chore`
**Prioridade:** `P0 | P1 | P2`
**Tamanho:** `XS | S | M | L`
**Sprint:** `<N>`
**Owner:** `<dev>`
**Status:** `⬜ to do | 🟨 doing | 🟦 review | ✅ done`

---

## Contexto

> Por que esta story existe? Liga ao PRD/Spec.

```
PRD: <link/seção>
Spec: <link/seção>
```

---

## Como usuário

> Formato narrativo curto.

```
Como <persona>, quero <ação>, para que <benefício>.
```

---

## Critérios de aceite

**AC-1:**
- **Dado** `<contexto>`
- **Quando** `<ação>`
- **Então** `<resultado observável>`

**AC-2:** … (repetir)

**Casos de erro:**

- [ ] `<comportamento em caso de input inválido>`
- [ ] `<comportamento offline>`
- [ ] `<comportamento sem permissão>`

**Acessibilidade:**

- [ ] Navegação por teclado funciona
- [ ] Leitor de tela anuncia mudanças relevantes
- [ ] Contraste AA verificado

**Performance:**

- [ ] Não regride o budget de bundle
- [ ] LCP/INP da rota afetada dentro do budget

---

## Plano de implementação (Plan Artifact do agente)

> Preenchido pelo agente **antes** de tocar em código. Aprovado pelo humano.

**Arquivos a criar/modificar:**

| Arquivo | Ação | Motivo |
|---------|------|--------|
| `app/(app)/inspections/new/page.tsx` | criar | tela do formulário |
| `app/(app)/inspections/actions.ts` | modificar | adicionar `createInspection` |
| `lib/db/schema.ts` | modificar | nova coluna `notes` |

**Migrations necessárias:** `<sim/não, qual>`

**Quebra em passos:**

1. `[ ]` Atualizar schema + gerar migration
2. `[ ]` Criar Server Action validada com Zod
3. `[ ]` Criar página com Server Component + `<Form>`
4. `[ ]` Tratar estados loading/error com `useFormStatus`
5. `[ ]` Adicionar testes (unit do Zod + integration da action)
6. `[ ]` Adicionar E2E "criar inspeção" no Playwright
7. `[ ]` Validar a11y manualmente + axe
8. `[ ]` Atualizar README do módulo

**Dependências:**

```
[liste stories ou serviços que precisam estar prontos antes]
```

**Subagentes envolvidos:**

- Browser subagent: validar formulário e capturar screenshot do estado de erro.
- Nenhum agente paralelo recomendado (toca arquivos sobrepostos a outras stories).

---

## Testes a adicionar

| Tipo | O que testa | Arquivo |
|------|-------------|---------|
| Unit | validação Zod do input | `tests/unit/inspections.schema.test.ts` |
| Integration | action grava no DB | `tests/integration/inspections.action.test.ts` |
| E2E | criar inspeção fim-a-fim | `tests/e2e/inspections.spec.ts` |

---

## Riscos / pontos de atenção

```
[ex: "esta story toca o módulo de auth — revisar com cuidado autorização"]
```

---

## Definition of Done para esta story

- [ ] Todos AC verdes com evidência (screenshot/gif/log)
- [ ] Migrations aplicadas em staging
- [ ] Testes adicionados e passando
- [ ] PR aprovado
- [ ] Telemetria do novo evento configurada
- [ ] Documentação atualizada
- [ ] Smoke test em staging

---

## Como instruir o agente

```
Trabalhe nesta story <ID>.
1. Leia esta página inteira.
2. Leia AGENTS.md e a Tech Spec.
3. Antes de qualquer arquivo: gere o Plan Artifact (acima) preenchido e ESPERE minha aprovação.
4. Após aprovado, implemente passo a passo. Pause após cada passo se houver dúvida.
5. Rode `pnpm typecheck && pnpm lint && pnpm test:unit` no fim de cada passo.
6. Para validação visual, invoque o browser subagent e anexe screenshot ao Artifact.
7. Não rode `git push`. Não toque em arquivos fora da lista do plano sem perguntar.
```
