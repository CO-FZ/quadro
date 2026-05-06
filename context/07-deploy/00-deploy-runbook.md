# Deploy Runbook

> Procedimento auditável e reversível para subir uma versão a produção. Vale para qualquer ambiente. Toda execução do runbook gera um log em `docs/memory/deploys/<YYYY-MM-DD>-<versão>.md`.

---

## Princípios

1. **Pequeno, frequente, reversível.** Deploys grandes são cargas de risco.
2. **Sem deploy manual em prod.** Tudo via pipeline automatizado.
3. **Feature flags > big-bang.** Ligue para % de usuários, observe, expanda.
4. **Rollback em < 5 min.** Se não consegue, o deploy não está pronto.
5. **Quem aprova ≠ quem executa** em prod.

---

## Ambientes

| Ambiente | Branch | URL | Banco | Auto-deploy? |
|----------|--------|-----|-------|--------------|
| Dev / preview | qualquer PR | `<vercel preview>` | DB ephemeral | sim |
| Staging | `main` | `staging.<dominio>` | staging | sim, após CI verde |
| Production | tag `vX.Y.Z` | `<dominio>` | prod | **não** — release manual aprovado |

---

## Pré-requisitos para deploy em produção

- [ ] CI 100% verde no commit a ser deployado.
- [ ] Deploy em staging há ≥ 1h sem alertas.
- [ ] Smoke test E2E em staging passou.
- [ ] Migrations aplicadas em staging com sucesso.
- [ ] Performance budgets em staging dentro do alvo (Lighthouse CI).
- [ ] Changelog atualizado.
- [ ] Aprovação de release registrada (PR aprovado por release manager).
- [ ] On-call avisado e disponível na próxima 1h.
- [ ] Janela de deploy respeitada (ver seção 7).

---

## Passo a passo

### 1. Preparação

```bash
git checkout main
git pull --ff-only
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint && pnpm test
```

### 2. Versionamento

```bash
# Bump conforme SemVer
pnpm version <patch|minor|major> -m "release: %s"
git push origin main --follow-tags
```

A tag `vX.Y.Z` dispara o workflow de release.

### 3. Migrations (se houver)

⚠️ **Sempre antes** do deploy do código que depende delas.

```bash
# Em job de pipeline, não localmente:
pnpm db:migrate
```

**Regras:**

- Migrations **expand-only** primeiro: adicione colunas/tabelas sem quebrar leitura antiga.
- Deploy do código novo.
- Migration de **contract** (remover colunas antigas) só na sprint seguinte, depois de confirmar que nenhuma instância antiga está rodando.
- Tenha plano de **rollback** para cada migration.

### 4. Deploy do código

Disparado pelo workflow `release.yml` ao detectar tag `vX.Y.Z`:

1. Build de produção (Turbopack) com vars de produção injetadas no runtime.
2. Push da imagem / artifact para o provedor (Vercel/Cloud Run/etc.).
3. Promoção para a URL de produção em modo **canário** (10% de tráfego).
4. Espera de 10 min observando métricas.
5. Se OK, promoção para 100%.
6. Se erro: rollback automático.

### 5. Smoke pós-deploy

Em ≤ 5 min após deploy 100%:

- [ ] Healthcheck `/api/health` retorna 200.
- [ ] Login funciona.
- [ ] Fluxo crítico #1 do PRD funciona (exec via Playwright em prod com user de teste).
- [ ] Sentry/observabilidade não disparou nada `level=error` novo.
- [ ] Latência p95 dentro do SLO.

### 6. Comunicação

- Postar em canal de release: versão, mudanças (link do changelog), responsável.
- Atualizar status page se houve mudança visível ao cliente.

---

## 7. Janelas de deploy

| Quando | Permitido? |
|--------|-----------|
| Seg–Qui, 09h–17h | ✅ ideal |
| Sex 09h–14h | ⚠️ apenas patches; nenhum lançamento de feature |
| Sex 14h+ até dom | ❌ proibido (exceto hotfix de incident em curso) |
| Vésperas de feriado | ❌ proibido |
| Período de freeze (anunciado) | ❌ proibido |

---

## 8. Rollback

### Critério de gatilho (rollback automático)

- Erro 5xx > 1% por 2 min consecutivos
- Latência p95 > 2x baseline por 5 min
- Spike anormal de erros no Sentry/log

### Rollback de código

```bash
# Promove a tag anterior
gh workflow run release.yml -f tag=v<X.Y.Z-1>
```

ou via UI do provedor de hospedagem (Vercel: "Promote previous deployment").

**Tempo alvo:** ≤ 5 min do gatilho.

### Rollback de migration

- Para migrations expand-only (default): **nenhum rollback necessário** no DB.
- Para migrations contract: ter o script `down` testado antes; aplicar manualmente com aprovação dupla.
- **Regra:** se você não tem confiança de reverter a migration, **não faça o deploy**.

---

## 9. Hotfix

Quando produção está quebrada e não pode esperar a próxima sprint:

1. Branch `hotfix/<descrição>` saindo da tag em produção.
2. Mudança **mínima** que resolve o incidente.
3. Testes que reproduzem o bug + cobrem a correção.
4. PR aprovado por 2 pessoas (release manager + on-call).
5. Pipeline passa.
6. Tag `vX.Y.(Z+1)` → deploy.
7. **Pós-mortem** em até 48h (template em `docs/runbooks/postmortem-template.md`).

---

## 10. Feature flags

- Toda feature **não-trivial** sai atrás de flag.
- Default: **off** em produção.
- Plano de rollout no PRD (% por dia/semana).
- Plano de cleanup: **delete a flag** em ≤ 30 dias após 100%.

Flags antigas e zumbis viram dívida técnica (ADR de cleanup obrigatório).

---

## 11. Observabilidade durante deploy

Dashboard de release deve ter, lado a lado:

- Versão atualmente em prod.
- Erro rate (1m, 5m, 15m).
- Latência p50/p95/p99.
- Taxa de cache hit.
- Health checks externos.
- Comparação canary vs. estável.

Ferramentas sugeridas: **Grafana** (métricas) + **Sentry** (erros) + **PostHog** (web vitals/produto).

---

## 12. Como o agente atua em deploy

- ❌ O agente **não** executa deploy em produção.
- ✅ O agente **pode** executar deploy em staging, com aprovação prévia explícita.
- ✅ O agente **pode** preparar release notes a partir de commits.
- ✅ O agente **pode** rodar smoke E2E em staging via browser subagent.
- ✅ O agente **deve** verificar `AGENTS.md` allowlist antes de qualquer comando que modifique infraestrutura.

**Briefing padrão para o agente em release:**

```
OBJETIVO
Preparar release vX.Y.Z e abrir PR com release notes.

PRONTO QUANDO
- [ ] CHANGELOG.md atualizado com formato Keep a Changelog
- [ ] PR aberto contra main com tag draft anotada
- [ ] Smoke em staging registrado em docs/memory/deploys/

NÃO FAÇA
- Não rode `git push --tags` sem minha aprovação
- Não dispare workflow de release
- Não promova para produção em hipótese alguma

OUTPUT ESPERADO
Artifact com diff do CHANGELOG e link do PR.
```

---

## 13. Log de deploy (template)

`docs/memory/deploys/<YYYY-MM-DD>-vX.Y.Z.md`:

```markdown
# Deploy vX.Y.Z — <data>

**Responsável:** <nome>
**Início:** <hh:mm>
**Fim:** <hh:mm>
**Status:** ✅ sucesso | ⚠️ rollback | ❌ falha

## Mudanças
- ...

## Migrations
- <id> — <descrição> — expand-only sim/não

## Smoke pós-deploy
- [ ] healthcheck
- [ ] fluxo crítico
- [ ] métricas dentro do SLO

## Incidentes
- nenhum / descrição

## Lições aprendidas
- ...
```
