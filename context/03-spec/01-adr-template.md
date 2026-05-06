# ADR-NNNN — `<Título curto da decisão>`

> Architecture Decision Record. 1 decisão = 1 arquivo. Pequeno, datado, imutável.
> Convenção de nome: `adr/NNNN-titulo-em-kebab.md`. Numeração sequencial.

**Status:** `proposed | accepted | superseded by ADR-XXXX | deprecated`
**Data:** `<YYYY-MM-DD>`
**Decisores:** `<lista>`
**Consultores:** `<lista>`

---

## Contexto

> Qual é a situação? Que forças estão em jogo (técnicas, de negócio, sociais, regulatórias)? Por que precisamos decidir agora?

```
[texto direto, 1–2 parágrafos]
```

---

## Decisão

> **Decidimos `<X>` porque `<razão central>`.**

Detalhamento:

```
[detalhes da decisão]
```

---

## Alternativas consideradas

### Opção A — `<X>` (escolhida)

- ✅ vantagens
- ❌ desvantagens

### Opção B — `<Y>`

- ✅ vantagens
- ❌ desvantagens

### Opção C — `<Z>`

- ✅ vantagens
- ❌ desvantagens

---

## Consequências

**Positivas:**

- `[...]`

**Negativas / dívidas aceitas:**

- `[...]`

**Impacto em outros sistemas:**

- `[...]`

---

## Plano de revisão

> Esta decisão deve ser reavaliada se acontecer X.

```
[ex: "Reavaliar se latência p95 > 1s por mais de 1 sprint" ou
"Revisitar quando Next.js 17 sair com mudanças no caching"]
```

---

## Referências

- PRD: `docs/prd/<arquivo>.md`
- Tech Spec: `docs/spec/00-tech-spec.md`
- Issue/discussão: `<link>`
- Documentação externa relevante: `<link>`

---

## Como o agente deve tratar este ADR

- Se uma instrução de chat **contradiz** um ADR `accepted`, o agente deve **parar**, citar o ADR e pedir confirmação ou abertura de ADR de substituição.
- ADRs `superseded` ficam no repositório como histórico — não devem ser usados como fonte ativa.
