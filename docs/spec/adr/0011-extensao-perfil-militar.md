# ADR 0011 — Extensão de Perfil: Campos Militares

**Status:** `Aceito`
**Data:** 2026-05-17
**Aprovado retroativamente:** Sprint 09 (migrations `20260517000000` a `20260517000003`)
**Autor:** Agente (Sprint 10 — retroativo)
**Relaciona-se com:** [ADR 0001 — RBAC](0001-rbac-via-supabase-rls.md), [ADR 0006 — Modular Monolith](0006-modular-monolith-clean-architecture.md)

---

## Contexto

O Quadro CO-FZ opera em contexto militar. Identificadores funcionais (patente, nome de guerra, divisão) são necessários para:
1. Exibir identidade funcional nos cards de tarefa e no perfil de usuário.
2. Filtrar e agrupar tarefas por divisão.
3. Compor relatórios com nomenclatura militar correta.

Nas Sprints 09, estes campos foram adicionados à tabela `profiles` sem um ADR formal.

---

## Decisão

### Campos adicionados a `profiles`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `patente` | `text` (enum `PatenteType`) | Não | Posto/graduação militar |
| `nome_guerra` | `text` | Não | Nome de guerra / apelido funcional |
| `divisao` | `text` (enum `TaskSector`) | Não | Divisão/seção do usuário |

### Gerenciamento

- **Quem edita:** apenas admins, via Server Actions em `lib/actions/admin.ts`.
- **Quem lê:** todos os usuários autenticados, via RLS (campo público em `profiles`).
- **View atualizada:** `user_task_stats` inclui `patente`, `nome_guerra` e `divisao` para relatórios.

### Exibição

A hierarquia de exibição de nome é:
```
nome_guerra → full_name (metadata Google) → email
```

---

## Migrations relacionadas

| Migration | Conteúdo |
|-----------|----------|
| `20260517000000_add_patente_to_profiles.sql` | Coluna `patente` + enum `PatenteType` |
| `20260517000001_update_user_task_stats_patente.sql` | Atualização da view com `patente` |
| `20260517000002_add_nome_guerra_divisao_to_profiles.sql` | Colunas `nome_guerra` e `divisao` |
| `20260517000003_update_user_task_stats_alocadas.sql` | View com campos completos |

---

## Débito registrado

- **DT-01 (parcial):** a view `user_task_stats` foi recriada iterativamente via migrations. Em cenário futuro, considerar uma única migration de criação e um padrão de versionamento de views.

---

## Referências

- [`lib/actions/admin.ts`](../../../../lib/actions/admin.ts)
- [`lib/supabase/types.ts`](../../../../lib/supabase/types.ts)
- [ADR 0006 — Modular Monolith](0006-modular-monolith-clean-architecture.md)
