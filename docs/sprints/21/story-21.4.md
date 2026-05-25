---
id: 21.4
sprint: 21
title: Corrigir CI — alinhar versão do pnpm (workspace ignoredBuiltDependencies)
status: planejada
size: XS
tipo: infra
depends_on: []
prioridade: bloqueador
---

# Story 21.4 — Corrigir CI: alinhar versão do pnpm

## Problema

Os jobs de CI falham no passo `actions/setup-node@v4` (com `cache: pnpm`), antes mesmo de `pnpm install`:

```
/home/runner/setup-pnpm/node_modules/.bin/pnpm store ...
ERROR  packages field missing or empty
For help, run: pnpm help store
```

Com isso, `Run pnpm install --frozen-lockfile` e `Run pnpm test:unit` (e typecheck/lint) ficam **skipped** — o job inteiro falha em ~2s. Bloqueia o merge de qualquer PR (inclusive o desta sprint).

## Causa raiz

**Mismatch de versão do pnpm entre ambiente local e CI.**

- O `pnpm-workspace.yaml` do repo contém **apenas**:
  ```yaml
  ignoredBuiltDependencies:
    - sharp
    - unrs-resolver
  ```
  A chave `ignoredBuiltDependencies` em `pnpm-workspace.yaml` é um recurso do **pnpm 10** (que migrou settings antes no campo `pnpm` do `package.json` para o arquivo de workspace). O pnpm local é **10.33.0** — por isso o arquivo foi escrito assim e funciona localmente (`pnpm store path` → exit 0).
- O CI fixa `pnpm/action-setup@v4` em **`version: 9`** ([ci.yml](../../../.github/workflows/ci.yml) — 5 jobs: typecheck, lint, unit, integration, db, e2e). Para o **pnpm 9**, um `pnpm-workspace.yaml` sem o campo `packages` é inválido ⇒ `ERROR packages field missing or empty`. O erro estoura logo no `pnpm store path` que o `setup-node` executa para montar o cache.

Não há `packageManager` no `package.json`, então nada fixa a versão de forma única — o drift entre local (10) e CI (9) passou despercebido.

## Solução

**Alinhar o pnpm em 10 via fonte única de verdade** — corrigir a versão, não remendar o workspace (adicionar `packages: ['.']` mascararia o problema e mudaria a semântica de workspace).

1. **`package.json`** — adicionar campo `packageManager`:
   ```json
   "packageManager": "pnpm@10.33.0"
   ```
   Fonte única da versão. `pnpm/action-setup@v4` e a Vercel leem este campo.

2. **`.github/workflows/ci.yml`** — nos 5 jobs, remover o pin desatualizado:
   ```yaml
   # antes
   - uses: pnpm/action-setup@v4
     with: { version: 9 }
   # depois (action-setup v4 lê a versão do packageManager do package.json)
   - uses: pnpm/action-setup@v4
   ```
   Alternativa equivalente, se preferir pin explícito: `with: { version: 10 }`. A remoção é melhor — evita drift futuro.

3. **`cd.yml` / Vercel** — `cd.yml` usa `npx vercel` (sem `pnpm/action-setup`), e o install da Vercel (`vercel.json`: `pnpm install --frozen-lockfile`) passa a respeitar `packageManager`. Nenhuma mudança adicional necessária; apenas confirmar no primeiro deploy.

### Por que não os atalhos

- **Adicionar `packages: ['.']` ao workspace:** satisfaz o pnpm 9, mas torna a raiz um pacote de workspace (efeitos colaterais em resolução/`--frozen-lockfile`) e mantém o drift de versão. Rejeitado.
- **Mover `ignoredBuiltDependencies` de volta ao `package.json`:** seria reverter para o formato pnpm 9, contra a versão local 10. Rejeitado.

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `package.json` | Adicionar `"packageManager": "pnpm@10.33.0"` |
| `.github/workflows/ci.yml` | Remover `with: { version: 9 }` dos 5 `pnpm/action-setup@v4` (ou trocar para `10`) |
| `docs/runbooks/vercel-deploy.md` | Nota: versão do pnpm fixada via `packageManager` |

## Critérios de aceite

- [ ] `package.json` com `packageManager: "pnpm@10.33.0"`.
- [ ] CI não fixa mais pnpm 9; usa a versão do `packageManager` (ou pin 10).
- [ ] Job `setup-node` (cache pnpm) passa — `pnpm store path` não erra mais.
- [ ] `pnpm install --frozen-lockfile`, typecheck, lint e `test:unit` executam (não mais skipped) e ficam verdes no CI.
- [ ] Deploy da Vercel continua usando pnpm 10 (verificar log do primeiro deploy).

## Como testar

```bash
# Local — garantir consistência com a versão fixada
pnpm --version            # deve casar com packageManager (10.33.0)
pnpm store path           # exit 0
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint && pnpm test:unit

# CI — abrir/atualizar o PR e confirmar que setup-node passa e os jobs ficam verdes
```

## Observações

- **Bloqueador:** deve ser a **primeira** story a aterrissar na sprint — sem CI verde, nenhum PR (inclusive 21.1–21.3) consegue mergear.
- Débito relacionado já no roadmap ("URL/anon-key hardcoded em migration" é outro item de Sprint 06); este é um drift de toolchain independente.
