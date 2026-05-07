# Story 05: Admin Enhancements (Soft-delete, Busca e Bulk Add)

**Sprint:** 05 — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [ADR 0001 RBAC RLS](../../spec/adr/0001-rbac-via-supabase-rls.md)
**Glossário:** [docs/prd/01-glossary.md](../../prd/01-glossary.md)
**Origem:** Gaps 4, 5 e 6 identificados após a Sprint 04.

---

## 1. Visão Geral

Esta story tem como foco entregar melhorias de usabilidade e segurança para os administradores no gerenciamento de usuários.

1. **Busca e Filtro de Usuários (Gap 4):** Uma barra de busca na tab "Usuários" do painel de administração que permite filtrar os perfis por e-mail rapidamente.
2. **Soft-delete de Usuários (Gap 5):** Permite arquivar um usuário (adicionando a data em `archived_at`) em vez de excluí-lo fisicamente do banco de dados, para preservar o histórico de tarefas.
3. **Adição em Lote na Whitelist (Gap 6):** Permite colar múltiplos e-mails ou domínios (separados por vírgula ou linha) e adicionar todos de uma vez à whitelist.

## 2. Requisitos de Negócio (Regras)

- **Soft-delete:**
  - O painel admin terá a opção de "Arquivar" (ou "Suspender") um usuário.
  - A ação preenche a coluna `archived_at` no banco com a data atual.
  - Pode haver opção de "Restaurar" para remover o `archived_at` (setar para NULL).
  - Usuários arquivados não devem aparecer como opções para serem alocados em novas tarefas, mas continuam existindo no banco.
  - Como não podemos impedir o login via Supabase Auth sem uma function complexa de login hook ou bloqueio no middleware, a implementação primária é visual e em permissões de alocação (se aplicável), e visual na lista de usuários.
- **Busca e Filtro:**
  - Apenas um input de texto que filtra a lista de usuários no client-side usando `email` (e `full_name` se existir).
- **Bulk Add:**
  - O form de adicionar à whitelist aceita um texto com múltiplos e-mails (separados por espaço, vírgula, ponto-e-vírgula ou quebras de linha).
  - O servidor processa a string, extrai todos os identificadores válidos e tenta adicionar todos com a mesma `default_role`.
  - Retorna um resultado com o sucesso ou os e-mails que já estavam duplicados.

## 3. Requisitos de UI/UX

- **Busca:** Input de texto simples com ícone de lupa, localizado acima da tabela de usuários.
- **Soft-delete:** Um botão de ação na tabela de usuários ("Arquivar") que fica cinza/vermelho. Quando arquivado, a linha do usuário fica opaca/acinzentada. O botão muda para "Restaurar".
- **Bulk Add na Whitelist:** O input de texto existente na aba de Whitelist deve se transformar em um `textarea` ou aceitar vírgulas naturalmente. Pode exibir um tooltip explicando que suporta múltiplos e-mails.

## 4. Critérios de Aceite

### CA-01 — Soft-delete
- **Given** admin autenticado em `/admin` e visualizando um usuário ativo
- **When** clica em "Arquivar" e confirma
- **Then** chama a server action `archiveUser`, que define `archived_at = NOW()`. A linha na tabela ganha opacidade reduzida e um badge de "Arquivado".

### CA-02 — Restauração de usuário
- **Given** admin visualizando um usuário com `archived_at` preenchido
- **When** clica em "Restaurar"
- **Then** chama a server action `restoreUser`, que define `archived_at = NULL`. A linha volta ao normal.

### CA-03 — Busca de Usuários
- **Given** uma lista de 10 usuários
- **When** admin digita "joao@" na barra de busca
- **Then** a tabela mostra instantaneamente apenas o(s) usuário(s) cujo e-mail contém "joao@".

### CA-04 — Bulk Add na Whitelist
- **Given** admin na tab Whitelist
- **When** insere `a@teste.com, b@teste.com` no input/textarea e clica em Adicionar
- **Then** ambas as entries são criadas com a role selecionada e a UI lista ambas como sucesso.

## 5. Modelagem de Dados

Migration `20260507000003_profiles_archived_at.sql`:

| Tabela | Operação |
|---|---|
| `profiles` | `ADD COLUMN archived_at timestamptz DEFAULT NULL` |

Sem alteração de policies RLS nesta fase, já que admin pode atualizar `profiles`.

## 6. Escopo negativo

- ❌ Bloqueio hard de login no Auth Hook (Supabase Auth). O usuário tecnicamente ainda pode fazer login, mas a interface e o acesso aos dados podem tratá-lo como suspenso caso a UI do app decida isso no futuro.
- ❌ Sincronização com Google Sheets.
