# Story 08.1: Docs Source of Truth

**Status:** DONE — 2026-05-16
**Sprint:** 08 — ver [sprint-plan.md](sprint-plan.md)
**ADRs relacionadas:** [ADR 0001](../../spec/adr/0001-rbac-via-supabase-rls.md), [ADR 0003](../../spec/adr/0003-defesa-em-camadas-tasks.md), [ADR 0005](../../spec/adr/0005-estrategia-de-testes.md)
**Origem:** recomendação arquitetural de transformar `docs/` no source of truth da engenharia do projeto.

---

## 1. Visão geral

Criar a estrutura canônica de documentação para separar documentos estáveis de engenharia do histórico de execução. A estrutura atual de `docs/` já é útil, mas mistura PRD, ADRs, sprints e memória. Esta story cria uma camada de navegação clara para arquitetura, produto, API e engenharia.

---

## 2. Problema

Hoje, um novo dev/agente precisa descobrir o sistema lendo vários pontos:

- PRD em `docs/prd/`.
- ADRs em `docs/spec/adr/`.
- Design system em `docs/spec/`.
- Sprints em `docs/sprints/`.
- Histórico em `docs/memory/`.

Isso funciona para auditoria, mas não funciona como fonte de verdade operacional. A refatoração para DDD/Clean Architecture precisa de docs que respondam rapidamente:

- Qual é a arquitetura alvo?
- Quais são os bounded contexts?
- Quais regras de dependência não podem ser violadas?
- Qual é o fluxo de eventos?
- Como o time testa, observa, versiona e entrega?

---

## 3. Requisitos técnicos

Criar ou consolidar:

```text
docs/
  architecture/
    overview.md
    clean-architecture.md
    bounded-contexts.md
    event-flow.md
    realtime.md
    deployment.md
  adr/
    README.md
  product/
    vision.md
    roadmap.md
    user-flows.md
    requirements/
  api/
    contracts.md
    websocket-events.md
    auth.md
  engineering/
    coding-standards.md
    git-flow.md
    testing-strategy.md
    ci-cd.md
    observability.md
  diagrams/
```

`docs/spec/adr/` não deve ser removido nesta story. O novo `docs/adr/README.md` deve funcionar como índice canônico e explicar se os ADRs serão migrados fisicamente ou mantidos no caminho atual até uma sprint dedicada.

---

## 4. Critérios de aceite

### CA-01 — Estrutura canônica criada

- **Given** repositório com `docs/` atual
- **When** esta story terminar
- **Then** as pastas `architecture`, `adr`, `product`, `api`, `engineering` e `diagrams` existem e têm pelo menos um documento guia.

### CA-02 — Overview arquitetural

- **Given** um novo dev/agente abre `docs/architecture/overview.md`
- **When** lê o documento
- **Then** entende a arquitetura atual, a arquitetura alvo, os módulos principais e a estratégia incremental de migração.

### CA-03 — Product docs derivados do PRD

- **Given** `docs/prd/00-prd.md` existe
- **When** `docs/product/vision.md` e `docs/product/roadmap.md` são criados
- **Then** eles derivam do PRD sem contradizer escopo, personas, métricas ou riscos.

### CA-04 — Engineering docs consolidadas

- **Given** AGENTS.md e ADR 0005 já definem regras de engenharia e testes
- **When** `docs/engineering/*.md` são criados
- **Then** eles consolidam comandos, gates, CI, padrões de código e testing strategy sem duplicar regras conflitantes.

### CA-05 — ADR index

- **Given** ADRs atuais vivem em `docs/spec/adr/`
- **When** `docs/adr/README.md` é criado
- **Then** lista todos os ADRs existentes, status, tema e link relativo para cada arquivo.

### CA-06 — Sem mudança comportamental

- **Given** esta story é documental
- **When** o diff é revisado
- **Then** nenhum arquivo de código de produção, migration ou teste é alterado.

---

## 5. Escopo negativo

- Não mover ADRs fisicamente ainda.
- Não apagar `docs/prd`, `docs/spec`, `docs/sprints` ou `docs/memory`.
- Não mudar código de aplicação.
- Não alterar CI.
- Não instalar dependências.

---

## 6. Como testar

```bash
pnpm typecheck
pnpm lint
```

Validação manual:

- Abrir `docs/architecture/overview.md` e confirmar que ele aponta para os documentos canônicos.
- Abrir `docs/adr/README.md` e confirmar que todos os ADRs existentes aparecem no índice.
- Confirmar que não há contradição com `AGENTS.md` e ADRs aceitos.
