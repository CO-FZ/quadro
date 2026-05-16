# Sprint 09: Refatoração da Camada de Tarefas & Design System

## Meta
Iniciar a transição para Arquitetura Modular Monolith (ADR 0006) isolando a lógica de tarefas no módulo `task-board`, além de implementar a fundação de um Design System com tipografia e cores estritas para um visual Premium e Dark Mode first.

## Stories

1. **[Story 09.1] Task Board: Modular Monolith**
   - Extrair lógicas de regras de negócio (`normalizeTaskInput`, `initialStatusFor`) para a camada de `domain/task.ts`.
   - Criar interface do repositório em `domain/repository.ts`.
   - Implementar `SupabaseTaskRepository` em `infrastructure/supabase-task-repository.ts`.
   - Criar orchestrador `TaskUseCases` na camada `application/use-cases.ts`.
   - Refatorar as Server Actions em `lib/actions/tasks.ts` para servir apenas como camada de apresentação, invocando os casos de uso sem lógica de negócio.
   - Preservar integridade de `requireRole` e os testes unitários.

2. **[Story 09.2] Premium Dark Mode UI**
   - Atualizar `app/globals.css` para um design premium Dark Mode.
   - Definir tipografia (Inter) e paleta HSL customizada.
   - Configurar variáveis CSS para cores primárias (teal), backgrounds e card colors com glassmorphism.
   - Implementar utilitários Tailwind via `@theme`.

## Status da Sprint
- **Início:** 16/05/2026
- **Status Atual:** **CONCLUÍDA**
- **Riscos Mitigados:** Mudança estrutural em repositório poderia quebrar tipagem; testes garantem integridade.
