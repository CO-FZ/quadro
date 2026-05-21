---
id: 19.2
sprint: 19
title: TDD — Cobertura de utilitários e rota /historico
status: concluida
size: S
tipo: test
depends_on: []
---

# Story 19.2 — Cobertura TDD

## Gaps identificados

| Gap | Motivo | Risco |
|-----|--------|-------|
| `formatDateBr` sem unit test | Adicionada Sprint 14, sem cobertura | Regressão silenciosa de timezone shift |
| `formatDateTimeBr` sem unit test | Idem | Idem |
| `formatNomeCompleto` sem unit test | Idem | Formato de nome exibido errado |
| `/historico` sem E2E | Rota criada Sprint 18 | Bug de navegação, busca ou paginação não detectado |
| Clear button sem `aria-label` | Sprint 18 | Inacessível para screen readers; E2E não consegue selecionar por role |

## Solução

### 19.2.1 — Unit tests `lib/utils/format.ts`

Arquivo: `tests/unit/lib/utils/format.test.ts`

Casos obrigatórios:

**`formatDateBr`**
- `'2026-01-15'` → `'15/01/2026'` (verifica que não há timezone shift — UTC midnight sem `T00:00:00` retornaria dia anterior)
- `'2026-02-28'` → `'28/02/2026'` (último dia de fevereiro)
- `'2026-12-31'` → `'31/12/2026'` (último dia do ano)

**`formatDateTimeBr`**
- ISO com horário → formato `DD/MM/YYYY` (regex match, não valor exato — hora varia por TZ do runner)
- String vazia → não lança exceção (retorna `'Invalid Date'` ou similar — documentar comportamento)

**`formatNomeCompleto`**
- `('Ten', 'Silva')` → `'Ten Silva'`
- `(null, 'Silva')` → `'Silva'`
- `('Ten', null)` → `''`
- `(null, null)` → `''`
- `('Ten', '  ')` → `''` (nome só espaços → trimado → vazio)
- `('Ten', 'Silva Junior')` → `'Ten Silva Junior'` (nome composto)

### 19.2.2 — Fix acessibilidade: `aria-label` no botão de clear

Em `components/features/HistoricoView.tsx`, botão X da busca:

```tsx
// Antes:
<button onClick={() => setInputValue('')} className="...">

// Depois:
<button
  onClick={() => setInputValue('')}
  aria-label="Limpar busca"
  className="..."
>
```

### 19.2.3 — E2E `/historico`

Arquivo: `tests/e2e/historico.spec.ts`

Casos obrigatórios:

| Teste | Persona | Asserção |
|-------|---------|---------|
| Nav link visível | admin | `getByRole('link', { name: /histórico/i })` visível |
| Colunas da tabela | admin | 5 headers: Título, Setor, Status, Entrega, Responsáveis |
| Busca atualiza URL | admin | digitar texto → `waitForURL(/q=/)` |
| Clear remove param | admin | clicar `aria-label="Limpar busca"` → URL sem `q=` |
| Estado vazio | admin | busca sem resultado → mensagem "Nenhuma tarefa encontrada" |

**Dependência de seed**: verificado — os 5 cenários do spec não dependem de tasks preexistentes. Navegação, headers de tabela, busca URL, clear URL e estado vazio funcionam com DB vazio.

## Arquivos

- `tests/unit/lib/utils/format.test.ts` — novo
- `tests/e2e/historico.spec.ts` — novo
- `components/features/HistoricoView.tsx` — fix `aria-label` (1 linha)

## Critérios de aceite

- [x] `pnpm test:unit` passa com `format.test.ts` incluído (108 testes, 9 arquivos)
- [x] Todos os 16 casos de `formatDateBr/DateTimeBr/NomeCompleto` verde (5+2+9)
- [x] E2E `/historico` — 5 cenários implementados em `tests/e2e/historico.spec.ts` (execução requer Supabase local + Next.js)
- [x] Botão de clear tem `aria-label="Limpar busca"`
- [x] `pnpm typecheck` verde
