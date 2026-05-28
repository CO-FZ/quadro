# Sprint 23 — Gestão de Férias e Afastamentos do Efetivo

**Data:** 2026-05-28
**Gatilho:** Solicitação de produto — a chefia precisa lançar e visualizar férias/afastamentos de todo o efetivo num Gantt anual, e essa indisponibilidade precisa aparecer na Matriz de Atividades.

---

## Objetivo

Introduzir um novo domínio **Afastamentos** (`personnel`) que registra períodos em que um colaborador está indisponível (Férias, Instalação, Dispensa) e expô-lo em duas superfícies:

1. **Nova aba `Férias`** dentro do painel `/admin` (após `Auditoria`), com visão Gantt anual: linha = colaborador, colunas = meses do ano, barras = períodos de afastamento. Clicar no nome do colaborador abre um modal para incluir/editar períodos.
2. **Reflexo na Matriz** (`/matriz`): nos dias dentro de um período de afastamento, a célula do membro exibe um badge colorido por tipo.

---

## Decisões de produto (confirmadas com o humano em 2026-05-28)

| Tema | Decisão |
|------|---------|
| **Permissão de gestão** | Admin **e** Coordenador gerenciam (criar/editar/excluir) férias de qualquer membro. Efetivo não acessa `/admin`. Leitura dos afastamentos liberada a todo autenticado (a Matriz é vista por todos). |
| **Reflexo na Matriz** | Badge colorido na célula do membro nos dias do período (verde = Férias, laranja = Instalação, cinza/azul = Dispensa), junto às tarefas. Sem mudança estrutural no layout. |
| **Escopo do Gantt** | Ano corrente com navegação de ano (`‹ 2026 ›`). Barras posicionadas por data início/fim dentro dos 12 meses. |
| **Tipos** | Enum fixo: `ferias`, `instalacao`, `dispensa` (rótulos pt-BR: Férias, Instalação, Dispensa). |

---

## Impacto arquitetural

### Novo bounded context `src/modules/personnel` (ADR 0006)

Afastamentos pertencem ao **pessoal**, não ao quadro de tarefas. Em vez de poluir o módulo `task-board`, cria-se um módulo irmão seguindo a mesma Clean Architecture (domain / application / infrastructure). Formaliza-se em **ADR 0014**.

```
src/modules/personnel/
  domain/
    entities.ts        ← Leave, LeaveType, RawLeaveInput, NormalizedLeaveInput, LeaveDatesValidation
    leave.ts           ← normalizeLeaveInput(), validateLeaveDates()
    repository.ts       ← LeaveRepository (interface)
  application/
    use-cases.ts        ← LeaveUseCases (create/update/delete/list, guard via Caller)
  infrastructure/
    supabase-leave-repository.ts
```

### Banco (ADR 0001 — RLS)

Nova tabela `public.leaves` + enum `public.leave_type`. SELECT liberado a `authenticated`; INSERT/UPDATE/DELETE restrito a admin/coordenador via `EXISTS profiles role IN ('admin','coordenador')`. Trigger `handle_updated_at`. Índices em `profile_id` e `(start_date, end_date)`.

### Acesso ao painel `/admin`

Hoje `app/(app)/admin/page.tsx:17` redireciona qualquer não-admin para `/kanban`. Para o coordenador gerenciar férias **sem** ver Usuários/Whitelist/Auditoria:

- Relaxar o guard da página para `admin` **ou** `coordenador`.
- Passar `currentUserRole` real para `AdminView`.
- Gatear as abas por role: `usuarios`/`whitelist`/`auditoria` permanecem **admin-only**; `ferias` aparece para `admin` e `coordenador`.
- Para coordenador, a aba default vira `ferias` (é a única que ele vê).

> O título/subtítulo do painel passa a ser condicional ao role (coordenador vê "Gestão de Férias", não "Painel Administrativo").

---

## Stories

| # | Título | Prioridade | Depende de | Arquivos |
|---|--------|-----------|-----------|----------|
| 23.1 | DB — tabela `leaves` + enum + RLS | P0 | — | 1 migration |
| 23.2 | Domínio `personnel` + Server Actions `leaves` | P0 | 23.1 | módulo novo, `lib/actions/leaves.ts`, `types.ts`, unit tests |
| 23.3 | UI — aba Férias (Gantt anual + modal) | P1 | 23.2 | `FeriasView.tsx`, `AdminView.tsx`, `admin/page.tsx`, i18n |
| 23.4 | Reflexo na Matriz (badge por célula) | P1 | 23.2 | `MatrizView.tsx`, `matriz/page.tsx` |
| 23.5 | Testes — integração (actions + RLS) + e2e | P2 | 23.3, 23.4 | `tests/integration/*`, `tests/e2e/ferias.spec.ts`, seed |
| 23.6 | ADR 0014 + docs de sprint/memória | P2 | — | `docs/spec/adr/0014-*`, `docs/memory/sprints/23` |

---

## Ordem de execução recomendada

```
23.1 (migration)
  └─► 23.2 (domínio + actions + unit)
        ├─► 23.3 (UI aba Férias)
        └─► 23.4 (Matriz)
              └─► 23.5 (integração + e2e)
23.6 (ADR/docs) — em paralelo, fechado no fim
```

23.1 → 23.2 desbloqueiam tudo. 23.3 e 23.4 são ortogonais (podem rodar em paralelo com workspaces separados — ver `AGENTS.md §10`).

---

## ADRs impactados

| ADR | Título | Impacto |
|-----|--------|---------|
| 0001 | RBAC via Supabase RLS | Novas políticas para a tabela `leaves` |
| 0006 | Modular Monolith / Clean Architecture | Novo bounded context `personnel` |
| 0007 | State Architecture | Server Component carrega; mutações via Server Action + revalidate |
| 0009 | Centralização de Guards | `leaves` actions usam `requirePrivileged()` |
| **0014** | **Modelo de Férias e Afastamentos** (NOVO) | Documenta tabela, enum, módulo e reflexo na Matriz |

Nenhum ADR existente é violado. 0014 formaliza a adição.

---

## Riscos conhecidos

- **Posicionamento das barras no Gantt** com larguras percentuais por mês exige cuidado com fusos: tratar todas as datas como `DATE` puro (`'YYYY-MM-DD' + 'T00:00:00'`) como já faz `MatrizView`/`matriz/page`. Sem `Date` em UTC implícito.
- **Coordenador no `/admin`**: validar que o relaxamento do guard NÃO expõe Usuários/Whitelist/Auditoria ao coordenador (gating por role testado em e2e).
- **Sobreposição de períodos** do mesmo membro: decisão = permitir (ex: instalação dentro de férias). Validação só garante `end_date >= start_date`. Documentar.
- **Performance da Matriz**: janela ±7 dias é pequena; filtrar `leaves` por janela na query do server (`lte/gte`) como já se faz com tasks.

---

## Checklist Pré-PR

- [ ] `pnpm typecheck` passou
- [ ] `pnpm lint` passou
- [ ] `pnpm test:unit` passou (validação de datas + posicionamento Gantt + getLeavesForCell)
- [ ] `pnpm test` (integração: actions + RLS de `leaves`)
- [ ] `pnpm test:e2e` (`ferias.spec.ts`)
- [ ] Migration aplicada localmente (`supabase db reset`) sem erro
- [ ] Screenshot da aba Férias (admin e coordenador) anexado
- [ ] Screenshot da Matriz com badge de afastamento anexado
- [ ] ADR 0014 revisado
- [ ] Sem `console.log`; mensagens via `lib/i18n`; sem secret hardcoded
