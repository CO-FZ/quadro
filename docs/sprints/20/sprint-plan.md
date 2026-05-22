---
sprint: 20
title: Botão Google Sheets na Matriz
status: planejada
inicio: 2026-05-22
conclusao: ~
objetivo: Adicionar botão de acesso direto à planilha Google Sheets na página Matriz de Atividades, expondo o espelho de dados já sincronizado pela Sprint 06.
---

# Sprint 20 — Botão Google Sheets na Matriz

- **Status:** PLANEJADA
- **Início:** 22/05/2026
- **Tamanho:** XS

---

## Motivação

A sincronização com Google Sheets foi implementada na Sprint 06 (ADR 0004). A planilha existe em produção e é atualizada automaticamente, mas **não há entrada na UI para acessá-la**. O usuário precisa conhecer a URL de memória ou navegar manualmente pelo Google Drive.

A Matriz de Atividades é a tela de visão geral do efetivo — o local natural para expor esse link, já que a planilha espelha exatamente os dados exibidos na matriz.

---

## Stories

| ID | Título | Size | Status | Impacto |
|----|--------|------|--------|---------|
| 20.1 | Botão "Abrir no Google Sheets" na Matriz | XS | 🔲 planejada | Médio (UX) |

---

## Story 20.1 — Botão "Abrir no Google Sheets" na Matriz

### Descrição

Adicionar um botão no cabeçalho da página Matriz que abre a planilha do Google Sheets em nova aba. O botão deve ser renderizado condicionalmente: se a variável de ambiente `NEXT_PUBLIC_GOOGLE_SHEET_URL` não estiver configurada, o botão não aparece (sem erro, sem quebra).

### Critérios de aceite

- [ ] Botão visível no cabeçalho da Matriz ao lado do título "Matriz de Atividades"
- [ ] Clique abre a URL em `_blank` com `rel="noopener noreferrer"`
- [ ] Botão ausente quando `NEXT_PUBLIC_GOOGLE_SHEET_URL` não está definida
- [ ] `aria-label="Abrir planilha no Google Sheets"` presente
- [ ] `pnpm typecheck` verde
- [ ] `pnpm lint` verde

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `app/(app)/matriz/page.tsx` | Ler `process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL`, passar como prop `sheetsUrl` |
| `components/features/MatrizView.tsx` | Adicionar `sheetsUrl?: string` à interface de props; renderizar botão no cabeçalho |
| `.env.local.example` | Adicionar `NEXT_PUBLIC_GOOGLE_SHEET_URL=` com placeholder |

### Decisão de design

- **Onde ler o env:** `page.tsx` (Server Component) — lê, valida e passa como prop. `MatrizView` não acessa `process.env` diretamente.
- **URL format:** `https://docs.google.com/spreadsheets/d/{GOOGLE_SHEET_ID}` — configurada diretamente na variável (sem construção dinâmica no código).
- **Sem novo ADR:** mudança de UI, sem nova decisão arquitetural. ADR 0004 cobre a integração Google Sheets; este sprint apenas expõe a URL existente.
- **Sem novo componente:** o botão é inline no JSX de `MatrizView` — não justifica extração para `components/ui/`.

### Layout esperado

```
┌─────────────────────────────────────────────────────────────┐
│ Matriz de Atividades              [↗ Abrir no Google Sheets] │
│ Visão semanal do efetivo — ±7 dias                           │
└─────────────────────────────────────────────────────────────┘
```

Botão: outline/ghost, ícone de link externo (`↗` ou SVG), texto "Abrir no Google Sheets", tamanho `sm`.

### Como testar

```bash
# 1. Configurar a variável no .env.local
echo "NEXT_PUBLIC_GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/SEU_ID" >> .env.local

# 2. Subir o servidor
pnpm dev

# 3. Navegar para /matriz
# Verificar: botão visível no cabeçalho

# 4. Remover a variável e reiniciar
# Verificar: botão não aparece (sem erro)

# 5. Typecheck e lint
pnpm typecheck && pnpm lint
```

---

## Dependências

- `NEXT_PUBLIC_GOOGLE_SHEET_URL` configurada no dashboard da Vercel (produção + preview)
- URL da planilha — obter com o administrador do Google Workspace

## Riscos

- **Nenhum técnico.** Mudança cirúrgica, sem toque em lógica de dados ou autenticação.
- **Operacional:** se a URL não for configurada na Vercel antes do deploy, botão simplesmente não aparece (degradação graciosa, sem impacto funcional).

## Critérios de conclusão

- [ ] `pnpm typecheck` verde
- [ ] `pnpm lint` verde
- [ ] Diff revisado pelo humano
- [ ] `NEXT_PUBLIC_GOOGLE_SHEET_URL` adicionada nas env vars da Vercel (prod + preview)
