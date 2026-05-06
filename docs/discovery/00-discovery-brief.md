# Discovery Brief — quadro

> Documento da fase 01. Objetivo: validar **se vale a pena construir** antes de gastar 1 linha de código.
> Tempo recomendado: 1–5 dias. Se passar disso, ou o problema é grande demais, ou não está claro.

**Owner:** Eng Carlos Eduardo
**Status:** `🔍 explorando`
**Última atualização:** 2026-05-06

---

## 1. Problema

> Descreva o problema em 3–5 linhas, no idioma do usuário. Evite jargão técnico.

```
Sistema web centralizado que substitui planilhas concorrentes pelo gerenciamento de alocação de efetivo das Divisões Técnica (DT) e Administrativa (DA), entregando um Kanban interativo, dashboard analítico e geração automática da matriz de disponibilidade do efetivo da Comissão de Obras de Fortaleza de acordo com as atividades planejadas e alocadas.
```

**Quem sente esse problema?**

```
Comissão de Obras de Fortaleza (Divisões Técnica e Administrativa)
```

**Com que frequência?**

```
Diariamente para atualização de status de atividades (o que estão fazendo, o que concluíram, o que falta terminar).
Semanalmente para observação gerencial e redistribuição de demandas (quem concluiu o que, quem está sobrecarregado, quem pode absorver mais tarefas).
```

**Qual a dor real?** (perda de tempo, dinheiro, qualidade, segurança, etc.)

```
Perda de prazos nas atividades e sobrecarga em determinados membros da equipe. A falta de visibilidade centralizada impede que tarefas sejam delegadas e redistribuídas para outras pessoas que poderiam absorver mais demandas.
```

---

## 2. Hipótese

> "Acreditamos que [solução] vai resolver [problema] para [pessoa] e isso vai gerar [resultado mensurável]."

```
Acreditamos que o sistema web (quadro) com Kanban e Dashboard vai resolver a desorganização de planilhas concorrentes para as Divisões Técnica (DT) e Administrativa (DA) da Comissão de Obras de Fortaleza e isso vai gerar a matriz de disponibilidade de efetivo automaticamente.
```

**Confiança atual:** `🟡 média` — justifique:

```
A ser validado com o protótipo: se a usabilidade via celular for simples e fluida o suficiente, a adoção chegará a 100% da equipe.
```

---

## 3. Evidências

Liste fontes — entrevistas, dados, suporte, concorrência.

| # | Fonte | Tipo | Insight |
|---|-------|------|---------|
| 1 | Vivência da Equipe | qualitativa | A sobrecarga e perda de prazos são reais. As pessoas farão o registro diário se a interface for extremamente fácil pelo celular. |

**Anti-evidências** (o que indica que pode estar errado):

```
Hipótese a validar: Se o sistema exigir cliques demais, os usuários podem abandonar o registro diário, retornando à desorganização das planilhas.
```

---

## 4. Não-objetivos

> O que **não** será resolvido por este produto. Tão importante quanto o que será.

- ❌ Não irá calcular folha de pagamento.
- ❌ Não irá controlar estoques ou materiais de obras.
- ❌ Não abrangerá nada fora do escopo de "pessoas" (foco apenas na escala de férias, serviços e acompanhamento de atividades da DT e DA).

---

## 5. Métrica de sucesso

> Uma métrica primária. Se subir, o produto está funcionando. Se não subir, falhamos.

**North Star Metric:**

```
100% da equipe (DT e DA) utilizando a ferramenta para registrar, atualizar e reportar suas tarefas diariamente.
```

**Métricas de guarda-corpo** (não devem piorar):

- Tempo médio gasto para registrar/atualizar uma tarefa pelo celular (deve ser o menor e mais fluido possível).

**Como vamos medir?**

```
Através do Dashboard analítico interno do sistema (quantidade de atividades reportadas por membro, em andamento vs. concluídas, e usuários ativos diariamente).
```

---

## 6. Restrições

| Tipo | Detalhe |
|------|---------|
| Orçamento | A definir |
| Prazo | A definir |
| Compliance | Controle de acesso interno à Comissão de Obras de Fortaleza |
| Tecnologia | Next.js 16, Tailwind v4, TypeScript, UX Mobile-first |
| Equipe | Eng Carlos Eduardo |

---

## 7. Stakeholders

| Papel | Pessoa | Decisão que toma |
|-------|--------|------------------|
| Sponsor | Eng Carlos Eduardo | go/no-go financeiro |
| Product | Eng Carlos Eduardo | escopo |
| Eng lead | Eng Carlos Eduardo | arquitetura |
| Usuário-piloto | Eng Carlos Eduardo | validação |

---

## 8. Riscos identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Baixa adesão no preenchimento diário | Média | Alto | Foco máximo em UX Mobile-first: registro simples e fluido para celular. |

---

## 9. Decisão

- [x] **Go** — avançar para PRD (`02-prd/`)
- [ ] **Pivot** — refazer hipótese, retornar à seção 2
- [ ] **No-go** — arquivar com lição aprendida abaixo

**Razão da decisão:**

```
O problema é bem delimitado e gera dor real na gestão (perda de prazos). Como o sucesso do projeto depende da adesão diária, o foco em usabilidade via celular e um Dashboard analítico com visão de andamento justificam plenamente a construção de uma aplicação web própria em vez do uso de planilhas de mercado.
```

**Lição aprendida (se no-go):**

```
N/A
```

---

## Como instruir o agente nesta fase

> Cole no chat do agente:

```
Sua tarefa é me ajudar a preencher este Discovery Brief.
Você NÃO vai escrever código nesta fase.
Faça perguntas até conseguir preencher cada seção com evidência ou explicitamente marcar como "hipótese a validar".
Quando terminar, gere um Artifact com o brief preenchido e liste 3 perguntas críticas que ainda não tenho resposta.
```
