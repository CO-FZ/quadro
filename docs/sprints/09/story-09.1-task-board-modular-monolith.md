# Story 09.1: Task Board (Modular Monolith)

**Status:** DONE  
**Épico:** Architecture & Tech Debt

## Contexto
O projeto definiu a migração para **Arquitetura Modular Monolith** (ADR 0006). A lógica do módulo "Task Board" precisa ser isolada em pacotes com fronteiras bem definidas: `domain`, `application`, `infrastructure` e `presentation`. 

## Requisitos
- Criar a camada de domínio para entidades de tarefas (`src/modules/task-board/domain/task.ts`).
- Criar a interface de repositório de tarefas na camada de domínio.
- Implementar repositório com o Supabase na camada `infrastructure`.
- Criar `TaskUseCases` (`application`) responsável por executar autorização, instanciar a model e persistir chamando o repositório.
- Transformar as Server Actions em `lib/actions/tasks.ts` apenas em facades de Presentation que delegam tudo para `TaskUseCases`.
- Os testes unitários que garantem pureza das funções de negócios devem passar (e o test de `_validation.ts` deve ser atualizado para `task.ts`).

## Implementação
- [x] Extração das entidades (`Task`, `NormalizedTaskInput`) para `domain/task.ts`.
- [x] Interface `TaskRepository`.
- [x] Implementação concreta `SupabaseTaskRepository`.
- [x] Classe `TaskUseCases` criada com verificação de papéis (Role).
- [x] `lib/actions/tasks.ts` refatorado para utilizar a camada de aplicação sem acoplamento a regras de domínio.
- [x] O export de `getCallerRole()` foi liberado em `lib/auth/require-role.ts` para permitir passagem do contexto do caller para o application core sem acoplar cache Next.js ao core.
- [x] Testes unitários atualizados e aprovados no vitest.
