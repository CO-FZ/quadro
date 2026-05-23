---
id: 21.3
sprint: 21
title: Navegação de dias na Matriz (além de ±7d, centrada em hoje)
status: planejada
size: M
tipo: feature
depends_on: []
---

# Story 21.3 — Navegação de dias na Matriz

## Problema

A Matriz do app mostra uma janela **fixa** de ±7 dias relativa a hoje, calculada no servidor ([app/(app)/matriz/page.tsx](../../../app/(app)/matriz/page.tsx)) e renderizada por [MatrizView.tsx](../../../components/features/MatrizView.tsx). O usuário **não consegue navegar** para dias fora dessa janela. Como a planilha-espelho (Story 21.1) passa a ser um banco histórico cumulativo, a tela precisa acompanhar: permitir andar para trás/frente, mantendo o centramento em hoje.

## Solução

Tornar a janela **navegável via URL** (Server Component, sem `useEffect` para fetch — conforme [AGENTS.md §4]). Um parâmetro de âncora controla o centro da janela; controles de navegação atualizam a URL.

### Mecanismo

- `page.tsx` lê `searchParams` (ex.: `?ref=YYYY-MM-DD`, default = hoje) e calcula a janela `[ref-7, ref+7]` (mantém o tamanho de ±7 dias por padrão; tamanho pode vir de config futura).
- Re-query no servidor com base em `ref` (mesma query atual, só muda o intervalo).
- `MatrizView` ganha cabeçalho com controles:
  - **‹ Anterior** / **Próximo ›** (deslocam `ref` em −7/+7 dias, ou semana a semana).
  - **Hoje** (volta `ref` para a data corrente) — visível só quando `ref ≠ hoje`.
  - Indicador do intervalo visível ("12–26 mai").
- Controles são links/`router` que mudam `?ref=` — navegação SSR, sem fetch client-side.
- **Centramento:** manter o comportamento atual de scroll-to-today (`todayRowRef` em `MatrizView.tsx:71`). Quando `ref ≠ hoje` e a linha de hoje não está no intervalo, centrar na linha da **âncora** (`ref`). Generalizar o `ref` de scroll de "hoje" para "dia âncora".

### Acessibilidade

- Botões com `aria-label` ("Semana anterior", "Próxima semana", "Ir para hoje").
- Foco visível; navegação por teclado.

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `app/(app)/matriz/page.tsx` | Ler `searchParams.ref`; calcular janela em torno da âncora; re-query |
| `components/features/MatrizView.tsx` | Props `ref`/âncora; controles ‹ Anterior / Hoje / Próximo ›; generalizar scroll-to-âncora; indicador de intervalo |
| `lib/utils/format.ts` (ou helper de datas) | Reuso/extração de helpers de janela de dias, se necessário (sem duplicar `addDays`/`buildDays`) |
| `tests/` (E2E) | Cenário: navegar semana anterior/próxima muda a URL e a grade; "Hoje" retorna |

## Critérios de aceite

- [ ] Controles ‹ Anterior / Próximo › deslocam a janela e atualizam `?ref=`.
- [ ] "Hoje" aparece quando `ref ≠ hoje` e retorna à data corrente.
- [ ] Janela default (sem `ref`) = hoje ±7 dias, idêntica ao comportamento atual.
- [ ] Scroll centraliza no dia âncora (hoje por padrão).
- [ ] Indicador de intervalo visível e correto (pt-BR).
- [ ] Controles com `aria-label` e foco visível.
- [ ] `pnpm typecheck` verde · `pnpm lint` verde.
- [ ] E2E de navegação verde.

## Como testar

```bash
pnpm dev
# /matriz → janela hoje ±7, sem botão "Hoje"
# Clicar 'Próximo' → URL vira ?ref=<hoje+7>, grade avança, botão "Hoje" aparece
# Clicar 'Hoje' → volta para janela corrente
# Verificar centramento (scroll) na linha âncora
pnpm typecheck && pnpm lint && pnpm test:e2e
```

## Notas

- Mantém o padrão Server Component + navegação por URL (sem `useEffect` para data fetching).
- Tamanho da janela permanece ±7 por simplicidade; parametrizar é melhoria futura, não escopo desta story.
