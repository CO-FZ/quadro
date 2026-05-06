# Skill Template — `<nome-da-skill>`

> **Por que existe:** este template implementa a recomendação da análise do paper de Zhou et al. (2026), Seção 4, sobre skills como artefatos discretos de **expertise procedimental externalizada**. Ele complementa (não substitui) `AGENTS.md`, `02-nextjs-conventions.md` e ADRs.

> **Quando criar uma skill:** quando você se pegar repetindo a mesma orientação para o agente em múltiplas stories. Se uma orientação é única, deixe na story; se é geral, sobe para `AGENTS.md`; se é **uma classe de tarefa repetível** com procedimento + heurística + restrição, vira skill.

---

## Estrutura proposta no repositório

```
skills/
  README.md                      ← registry: 1 linha por skill
  <nome-da-skill>/
    SKILL.md                     ← este arquivo (manifest, ≤ 100 linhas)
    GUIDE.md                     ← guia completo (carregado sob demanda)
    examples/
      <caso>.ts
      <contra-caso>.ts
    CHANGELOG.md                 ← versionamento da skill
```

**Princípio: progressive disclosure.** O agente vê o nome no registry, depois lê SKILL.md (manifest curto), e só carrega GUIDE.md quando a tarefa requer.

---

## Template de `SKILL.md`

```markdown
# Skill: <nome-da-skill>

**Versão:** vX.Y
**Status:** experimental | stable | deprecated
**Última revisão:** YYYY-MM-DD
**Owner:** <nome>
**ADRs relacionados:** <lista>

---

## 1. Propósito (1 frase)

<O que essa skill faz? Pra que classe de tarefa serve?>

## 2. Capabilities

- O que essa skill **garante** ao ser seguida.
- Em bullets curtos, verificáveis.

## 3. Quando usar

- Sinais de que essa é a skill certa para a tarefa atual.
- Idealmente 3–5 marcadores.

## 4. Quando NÃO usar (boundary conditions)

- Cenários em que esta skill **não** se aplica.
- Cenários em que ela **degrada** (ex.: contexto X muito longo, banco Y).
- Cenários em que conflita com outra skill (referencie qual).

## 5. Preconditions

- O que precisa estar em pé antes de invocar.
- Ex.: "schema do DB tem `users` table"; "auth middleware aplicado".

## 6. Procedure (alto nível)

Lista numerada e curta. Detalhe vai em `GUIDE.md`.

1. ...
2. ...
3. ...

## 7. Decision heuristics

Regras de bolso para os branches da procedure. Quando há mais de uma opção plausível, qual escolher.

- Se A, prefira X. Se B, prefira Y.
- Default em caso de dúvida: Z.

## 8. Normative constraints

O que **deve** ser verdade no fim. Pode ser checado por:

- [ ] testes (quais)
- [ ] lint/typecheck
- [ ] revisão humana
- [ ] gates de CI

## 9. Compõe / é composta por

- **Compõe:** outras skills que esta skill chama internamente.
- **É composta por:** skills mais altas que usam esta como bloco.

## 10. Examples e counter-examples

Veja `examples/`. Mantenha pelo menos 1 exemplo positivo e 1 contra-exemplo.

## 11. Changelog

Veja `CHANGELOG.md`. Mudanças que afetam contrato exigem bump de versão major.

## 12. Boundary com tools/protocols

Esta skill **não é** um tool. Ela **usa** tools/protocols listados aqui:

- Tools: <ex.: Drizzle ORM, Zod>
- Protocols: <ex.: Server Action, MCP server X>

---

## Como o agente deve tratar esta skill

Quando uma story menciona explicitamente esta skill, ou quando o agente identificar que a tarefa atual cai nas seções 3 ou 5:

1. Ler este SKILL.md inteiro.
2. **Não** carregar GUIDE.md ainda — verificar se as 12 seções acima são suficientes para a story.
3. Carregar GUIDE.md somente se a complexidade da story exigir.
4. Após executar, anotar no log de execução qual skill foi usada e se houve desvio do procedure (vira input para revisão da skill).
```

---

## Template de `GUIDE.md`

```markdown
# Guide: <nome-da-skill>

> Documento de referência **profundo**. Carregado sob demanda. Pode ter exemplos longos, código real, screenshots, decisões históricas.
> **Não duplique** o que está em SKILL.md. Aqui é o "como fazer" detalhado.

## Step-by-step

### Passo 1: <nome>

[código real, comandos, decisões]

### Passo 2: <nome>

...

## Erros comuns

- <descrição> → <correção>

## Anti-padrões

- ❌ <coisa errada> — por quê
- ❌ <coisa errada> — por quê

## Referências externas

- <links de docs oficiais>

## Histórico de evolução

- v1.0: criação
- v1.1: ajuste tal por causa de tal observação em produção
```

---

## Template de `skills/README.md` (registry)

```markdown
# Skills Registry

> Catálogo de skills do projeto. 1 linha por skill — propósito + status + versão.
> Skills `experimental` podem ser revisadas/removidas a qualquer momento.
> Skills `stable` seguem versionamento semver.

| Skill | Status | Versão | Propósito (1 linha) |
|-------|--------|--------|---------------------|
| `server-action-with-zod` | stable | 1.0 | Toda mutação Server Action com input validado por Zod e auth check explícito |
| `cache-component-pattern` | stable | 1.0 | Quando e como aplicar `"use cache"` com tags + revalidação |
| `testing-pyramid` | stable | 1.0 | Distribuição correta unit/component/integration/e2e por feature |
| `proxy-security-headers` | stable | 1.0 | Configurar `proxy.ts` com CSP, HSTS, X-Frame-Options |
| `migration-expand-contract` | experimental | 0.3 | Migrations seguras: expand-only no deploy, contract no seguinte |
| `tailwind-tokens-via-theme` | stable | 1.0 | Tokens de design via `@theme` no `globals.css`, sem `tailwind.config.js` |

## Como adicionar uma skill

1. Crie `skills/<nome>/SKILL.md` seguindo o template em `harness/05-execution/03-skill-template.md`.
2. Adicione linha à tabela acima via PR.
3. Skill nova entra como `experimental`. Promove para `stable` após 2 sprints sem revisão de breaking change.
4. Skills são revisadas no ritual de "sprint de saúde" trimestral.
```

---

## Exemplo concreto: `skills/server-action-with-zod/SKILL.md`

```markdown
# Skill: server-action-with-zod

**Versão:** v1.0
**Status:** stable
**Última revisão:** 2026-05-04
**Owner:** Carlos
**ADRs relacionados:** ADR-0007 (Zod como validador de borda)

## 1. Propósito

Padronizar Server Actions Next.js como protocolo interno tipado, validado e auditável.

## 2. Capabilities

- Garante que toda mutação tem schema declarado e validado.
- Garante auth check explícito antes de qualquer efeito.
- Garante mensagens de erro seguras para o cliente (sem stack trace).
- Garante revalidação correta após mutação.

## 3. Quando usar

- Qualquer story que cria/atualiza/deleta dado.
- Qualquer formulário do App Router.
- Qualquer endpoint de mutação chamado do client.

## 4. Quando NÃO usar

- Webhooks externos (use Route Handler com HMAC).
- Endpoints públicos consumidos por terceiros (use Route Handler documentado).
- Leituras puras (use Server Component, não Action).

## 5. Preconditions

- `lib/auth.ts` exporta `auth()` que retorna user|null.
- Zod instalado.

## 6. Procedure

1. Definir schema Zod no topo do arquivo.
2. Marcar arquivo como `'use server'`.
3. Action: receber FormData ou objeto, parsear com Zod.
4. Auth check via `auth()`. Se null, retornar `{ ok: false, error: 'UNAUTHORIZED' }`.
5. Executar mutação no DB.
6. `revalidatePath` ou `revalidateTag` apropriado.
7. Retornar `{ ok: true, data }` ou `{ ok: false, errors }`.

## 7. Decision heuristics

- **Schema separado vs. inline:** se >5 campos ou reusado, separar em `schemas.ts`.
- **FormData vs. objeto:** FormData se vem de `<form action={…}>`; objeto se vem de chamada explícita do client.
- **Erro de validação:** retornar como `{ ok: false }`, não throw — UI precisa renderizar.

## 8. Normative constraints

- [ ] Schema Zod presente
- [ ] Auth check antes de qualquer efeito colateral
- [ ] Sem `any` no tipo de retorno
- [ ] Revalidação chamada
- [ ] Teste unitário do schema (válido + inválido)
- [ ] Teste integração da action com DB de teste

## 9. Compõe / é composta por

- Compõe: nada (skill atômica).
- É composta por: `crud-feature-skeleton`, `auth-protected-form`.

## 10. Examples e counter-examples

- ✅ `examples/basic.ts` — action típica de criar inspeção
- ✅ `examples/with-revalidate-tag.ts` — invalidação granular por tag
- ❌ `examples/anti-pattern-no-auth.ts` — sem auth check (não fazer)

## 11. Changelog

- v1.0 (2026-05-04): criação inicial.

## 12. Boundary com tools/protocols

- Tools: Zod, Drizzle ORM
- Protocols: Server Action (interno do Next.js)
```

---

## Por que isso resolve a lacuna apontada na análise

1. **Specification:** SKILL.md tem capability boundaries, scope, preconditions, constraints, examples + counterexamples — exatamente as 5 categorias da §4.3.1 do paper.
2. **Discovery:** registry centralizado em `skills/README.md`.
3. **Progressive disclosure:** SKILL.md fica curto (~80 linhas); GUIDE.md sob demanda.
4. **Execution binding:** seção 12 de cada SKILL declara explicitamente que tools/protocols a skill conecta — diferenciando-a de tool/protocol.
5. **Composition:** seção 9 de cada SKILL declara composição.

E satisfaz as duas vias de aquisição mais práticas que o paper menciona em §4.4: **authored** (cada SKILL.md é escrita) e **distilled** (logs de execução em `docs/memory/execution/` viram input para criar/revisar skills).

---

## Como introduzir no projeto sem trauma

1. **Não migrar tudo de uma vez.** Pegue 3 padrões de `02-nextjs-conventions.md` que mais reaparecem nas stories e converta em skills.
2. **Skills coexistem com `AGENTS.md`.** O AGENTS.md aponta para o registry: "para padrões procedurais detalhados, veja `skills/`". AGENTS.md fica menor.
3. **A primeira skill cria o caminho.** A segunda confirma o padrão. A partir da terceira, vira hábito.
