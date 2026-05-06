# Discovery Brief — `<NOME-DO-PRODUTO>`

> Documento da fase 01. Objetivo: validar **se vale a pena construir** antes de gastar 1 linha de código.
> Tempo recomendado: 1–5 dias. Se passar disso, ou o problema é grande demais, ou não está claro.

**Owner:** `<nome>`
**Status:** `🔍 explorando | ✅ validado | ❌ descartado`
**Última atualização:** `<YYYY-MM-DD>`

---

## 1. Problema

> Descreva o problema em 3–5 linhas, no idioma do usuário. Evite jargão técnico.

```
[descrever]
```

**Quem sente esse problema?**

```
[persona ou segmento]
```

**Com que frequência?**

```
[diária / semanal / situacional]
```

**Qual a dor real?** (perda de tempo, dinheiro, qualidade, segurança, etc.)

```
[quantificar se possível]
```

---

## 2. Hipótese

> "Acreditamos que [solução] vai resolver [problema] para [pessoa] e isso vai gerar [resultado mensurável]."

```
Acreditamos que [...] vai resolver [...] para [...]
e isso vai gerar [...]
```

**Confiança atual:** `🔴 baixa | 🟡 média | 🟢 alta` — justifique:

```
[justificativa]
```

---

## 3. Evidências

Liste fontes — entrevistas, dados, suporte, concorrência.

| # | Fonte | Tipo | Insight |
|---|-------|------|---------|
| 1 | `<entrevista com X>` | qualitativa | `<insight em 1 linha>` |
| 2 | `<analytics de Y>` | quantitativa | `<insight>` |
| 3 | `<concorrente Z>` | desk research | `<insight>` |

**Anti-evidências** (o que indica que pode estar errado):

```
[listar]
```

---

## 4. Não-objetivos

> O que **não** será resolvido por este produto. Tão importante quanto o que será.

- ❌ `<não-objetivo 1>`
- ❌ `<não-objetivo 2>`
- ❌ `<não-objetivo 3>`

---

## 5. Métrica de sucesso

> Uma métrica primária. Se subir, o produto está funcionando. Se não subir, falhamos.

**North Star Metric:**

```
[ex: % de inspeções concluídas em < 1h]
```

**Métricas de guarda-corpo** (não devem piorar):

- `[ex: erro do usuário em formulário]`
- `[ex: latência de página]`
- `[ex: custo por inspeção]`

**Como vamos medir?**

```
[ferramenta + dashboard + cadência]
```

---

## 6. Restrições

| Tipo | Detalhe |
|------|---------|
| Orçamento | `<R$ ...>` ou `<horas-pessoa>` |
| Prazo | `<data>` ou `<sprints>` |
| Compliance | `<LGPD, ABNT, ISO, etc.>` |
| Tecnologia | `<obrigatórios e proibidos>` |
| Equipe | `<tamanho e perfis>` |

---

## 7. Stakeholders

| Papel | Pessoa | Decisão que toma |
|-------|--------|------------------|
| Sponsor | `<nome>` | go/no-go financeiro |
| Product | `<nome>` | escopo |
| Eng lead | `<nome>` | arquitetura |
| Usuário-piloto | `<nome>` | validação |

---

## 8. Riscos identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| `<risco>` | A/M/B | A/M/B | `<ação>` |

---

## 9. Decisão

- [ ] **Go** — avançar para PRD (`02-prd/`)
- [ ] **Pivot** — refazer hipótese, retornar à seção 2
- [ ] **No-go** — arquivar com lição aprendida abaixo

**Razão da decisão:**

```
[texto]
```

**Lição aprendida (se no-go):**

```
[para não repetir o erro]
```

---

## Como instruir o agente nesta fase

> Cole no chat do agente:

```
Sua tarefa é me ajudar a preencher este Discovery Brief.
Você NÃO vai escrever código nesta fase.
Faça perguntas até conseguir preencher cada seção com evidência ou
explicitamente marcar como "hipótese a validar".
Quando terminar, gere um Artifact com o brief preenchido e
liste 3 perguntas críticas que ainda não tenho resposta.
```
