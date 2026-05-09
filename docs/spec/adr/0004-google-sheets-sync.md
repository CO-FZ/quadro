# ADR 0004: Sincronização com Google Sheets via Webhooks e Edge Functions

## Status
`Aceito (retroativo — promovido em 2026-05-09)`

> **Nota retroativa.** Este ADR foi escrito em 2026-05-07 com status `Proposto` e implementado em prod no mesmo dia (commit `7c6aa45` + complemento `77c0f06` em 2026-05-09) sem ser promovido formalmente. Promovido para `Aceito` em 2026-05-09 como parte da Story 07B.4, após auditoria confirmar que migration `20260507000005_google_sheets_webhook.sql` e Edge Function `sync-sheets` estão em produção. Débitos descobertos na auditoria estão registrados em [docs/memory/sprints/06/_summary.md §3](../../memory/sprints/06/_summary.md): URL e anon key hardcoded na migration, ausência de retry, falta de testes da Edge Function. Esses débitos viram trabalho de Sprint 07-A/07-B; **não invalidam a decisão**, apenas refinam a implementação.

## Contexto
O PRD (US-05) exige que os dados do Kanban sejam sincronizados automaticamente com uma planilha do Google Sheets, servindo como uma base espelho acessível para relatórios extras. Na Sprint 05, adiamos essa implementação pois ela exigia uma definição arquitetural (este ADR).
Precisamos de um mecanismo que observe as mudanças na tabela `tasks` no Supabase e as reflita em uma planilha do Google Sheets de forma confiável e rápida.

## Opções Consideradas

### 1. Sincronização via Server Actions (Next.js)
A aplicação Next.js faria a chamada para a API do Google Sheets logo após criar, atualizar ou deletar uma tarefa no lado do cliente/servidor.
- **Prós:** Fácil de implementar, reaproveita o backend existente.
- **Contras:** Não captura mudanças feitas fora do app (ex: via Supabase Studio, ou por triggers de banco). Se a API do Google Sheets falhar ou demorar, a requisição do usuário fica lenta ou falha parcialmente.

### 2. Sincronização via Supabase Database Webhooks + Edge Functions
Um trigger no Postgres (Database Webhook) detecta INSERT, UPDATE e DELETE na tabela `tasks` e dispara uma requisição HTTP para uma Supabase Edge Function. A Edge Function autentica na API do Google Sheets via Service Account e aplica a alteração.
- **Prós:** Processamento assíncrono (não bloqueia a UI do usuário). Captura toda e qualquer alteração no banco, não importa a origem. Arquitetura robusta orientada a eventos.
- **Contras:** Requer configuração de Edge Function e gerenciamento de segredos (Google Service Account) no Supabase.

### 3. n8n ou Make (Automação Externa)
Usar ferramentas low-code para capturar webhooks e atualizar o Google Sheets.
- **Prós:** Zero código, fácil manutenção visual.
- **Contras:** Introduz dependência de terceiros, possíveis custos adicionais e problemas de privacidade de dados.

## Decisão
Optamos pela **Opção 2 (Supabase Database Webhooks + Edge Functions)**. 
Usaremos um trigger nativo do Supabase para enviar eventos de mutação da tabela `tasks` para uma Edge Function dedicada (`sync-sheets`). A Edge Function usará as credenciais de uma Google Service Account (armazenadas no Supabase Secrets) para acessar a API do Google Sheets e inserir/atualizar as linhas da planilha de forma idempotente e assíncrona.

## Consequências
- **Positivas:** UI permanece rápida. Garantia de que as mudanças chegarão à planilha eventualmente. Integração 100% contida no ecossistema Supabase do projeto.
- **Negativas:** Maior complexidade operacional. Necessidade de criar e gerenciar um projeto no Google Cloud (Service Account) e gerenciar variáveis de ambiente nas Edge Functions.
