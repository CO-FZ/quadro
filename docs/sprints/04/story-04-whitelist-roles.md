# Story 04: Whitelist com role pré-atribuída + last-admin guard + pendentes

**Sprint:** 04 — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [ADR 0001 RBAC RLS](../../spec/adr/0001-rbac-via-supabase-rls.md), **[ADR 0002 Whitelist trigger](../../spec/adr/0002-whitelist-emails-trigger.md) — revisar como passo 0**, [ADR 0003 defesa em camadas](../../spec/adr/0003-defesa-em-camadas-tasks.md)
**Glossário:** [docs/prd/01-glossary.md](../../prd/01-glossary.md)
**Origem:** gaps 1/2/3 priorizados em 2026-05-07.

---

## 1. Visão Geral

Hoje o fluxo de convite tem dois passos: admin adiciona email à whitelist → usuário loga (entra como `efetivo` via trigger `handle_new_user`) → admin abre `/admin` e altera role manualmente. Esta story:

1. **Whitelist com role pré-atribuída** — admin escolhe role no momento da adição. Trigger `handle_new_user` lê o role da whitelist no primeiro signup, em vez de fixar `'efetivo'`.
2. **Guard "último admin"** — `updateUserRole` rejeita rebaixar o único admin. Paga dívida da Sprint 03.
3. **Indicador de pendentes** — entries da whitelist sem profile correspondente aparecem destacadas na UI.

## 2. Requisitos de Negócio (Regras)

- **Adição à whitelist:** admin escolhe entre `efetivo` (padrão), `coordenador`, `admin`. Domínio (`@dominio.gov.br`) também aceita role default — todos do domínio entram com aquela role no primeiro login.
- **Trigger `handle_new_user`:** ao criar profile, busca match na whitelist (email exato primeiro, depois domínio). Usa `default_role` da entry. Se nenhuma entry tem role definida ou se nenhuma bate (não deveria ocorrer porque trigger de whitelist barra), fallback é `'efetivo'`.
- **Mudança de role pós-cadastro:** continua possível via `/admin` → tab Usuários (já implementado em Sprint 03 retroativa).
- **Guard "último admin":** `updateUserRole` consulta `COUNT(*) FROM profiles WHERE role='admin'` antes de aplicar. Se o caller está rebaixando o **único** admin (ele mesmo ou outro), retorna `{ ok: false, code: 'LAST_ADMIN' }` com mensagem amigável.
- **Pendentes:** entry da whitelist é "pendente" se nenhum profile tem o `email` igual à entry (para emails) ou se nenhum profile tem `email LIKE '%' || identifier` (para domínios — domínios podem ter múltiplos profiles, considera "tem ao menos um" ≠ pendente).

## 3. Requisitos de UI/UX

- **Form de whitelist:** input de identifier + select compacto de role (default 'efetivo'). Botão Adicionar do lado.
- **Lista de whitelist:** badge mostra a role default (cor consistente com `ROLE_COLORS` existente). Entries pendentes ganham badge adicional 🕐 "Pendente" e tooltip "Ainda não logou".
- **Tabela de usuários:** select de role mostra nova mensagem amigável se tentar rebaixar o último admin (Toast de erro vindo do code `LAST_ADMIN`).

## 4. Critérios de Aceite

### CA-01 — ADR 0002 revisado
- **Given** Sprint 04 começou
- **When** agente atualiza ADR 0002 com seção "Revisão 2026-05-07 — `default_role` na whitelist"
- **Then** ADR existe atualizado, mantém `aceito` com data de revisão.

### CA-02 — Whitelist com role default
- **Given** admin autenticado em `/admin`
- **When** adiciona `fulano@example.com` selecionando role `coordenador`
- **Then** entry é criada com `default_role='coordenador'`. Quando Fulano loga pela primeira vez, trigger cria profile com `role='coordenador'` (não 'efetivo').

### CA-03 — Domínio com role default
- **Given** admin adiciona `@cofz.gov.br` com role `efetivo`
- **When** qualquer usuário desse domínio loga pela primeira vez
- **Then** profile é criado com `role='efetivo'` (mesma da entry).

### CA-04 — Mudança de role manual continua funcionando
- **Given** profile existente com role `efetivo`
- **When** admin muda para `coordenador` via `/admin`
- **Then** UPDATE na tabela `profiles` direto, sem mexer na whitelist. Comportamento idêntico ao da Sprint 03.

### CA-05 — Guard "último admin"
- **Given** apenas 1 admin no sistema
- **When** esse admin tenta rebaixar a si mesmo (ou outro admin tenta rebaixá-lo, mas só há 1)
- **Then** `updateUserRole` retorna `{ ok: false, code: 'LAST_ADMIN', message: 'Não é possível rebaixar o único admin do sistema.' }` e Toast mostra mensagem.

### CA-06 — Indicador de pendentes
- **Given** entry `convidado@example.com` na whitelist sem profile correspondente
- **When** admin abre tab Whitelist em `/admin`
- **Then** entry mostra badge "Pendente" + tooltip. Após o usuário logar, badge desaparece.

### CA-07 — Backward compatibility
- **Given** entry da whitelist criada antes desta migration (sem `default_role`)
- **When** usuário loga
- **Then** trigger usa fallback `'efetivo'` (DEFAULT da coluna garante que não há NULL após migration).

## 5. Modelagem de Dados

Migration `20260507000002_whitelist_default_role.sql`:

| Tabela | Operação |
|---|---|
| `whitelist` | `ADD COLUMN default_role app_role NOT NULL DEFAULT 'efetivo'` |
| `handle_new_user()` | reescrita: busca entry da whitelist (match exato → match domínio) e usa `default_role`; fallback `'efetivo'` |

Sem alteração de policies RLS (whitelist já restrito a admin).

## 6. Escopo negativo

- ❌ Soft-delete em profiles
- ❌ Bulk add
- ❌ Busca/filtro na lista
- ❌ Logger FORBIDDEN
- ❌ Sincronização Google Sheets

## 7. Dependências

- ADR 0002 revisado é bloqueante (passo 0).
- Migration `20260507000001_relax_task_insert_policy.sql` aplicada (já feito na Sprint 03 via reset).
