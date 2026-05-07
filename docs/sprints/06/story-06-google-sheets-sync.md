# Story 06: Sincronização Google Sheets

**Sprint:** 06 — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [ADR 0004 Google Sheets Sync](../../spec/adr/0004-google-sheets-sync.md)
**Origem:** PRD US-05

---

## 1. Visão Geral

Implementar a sincronização automática das atividades do Quadro Kanban para uma planilha espelho no Google Sheets. O objetivo é permitir que a gestão tenha acesso aos dados em tempo real para confecção de relatórios e dashboards externos usando o ecossistema do Google.

## 2. Requisitos de Negócio (Regras)

- **One-way Sync:** A sincronização ocorrerá em mão única (Supabase -> Google Sheets). Alterações feitas diretamente no Google Sheets não voltarão para o sistema.
- **Trigger Assíncrono:** A inserção, atualização ou exclusão de uma tarefa no banco deverá disparar um evento (Database Webhook) para uma Edge Function do Supabase.
- **Operação de Inserção (Insert):** Nova tarefa adiciona uma nova linha na planilha.
- **Operação de Atualização (Update):** Alterações na tarefa localizam a linha correspondente na planilha (pelo `id` da tarefa) e a atualizam.
- **Operação de Exclusão (Delete):** A exclusão física ou lógica marca a tarefa como "Excluída" no Sheets ou remove a linha (a definir a abordagem preferida, geralmente marcar o status é melhor).

## 3. Requisitos Técnicos

- Uso de Supabase Edge Functions configuradas com Deno.
- Autenticação via `Google Service Account`.
- Supabase Database Webhook configurado na tabela `tasks` apontando para a URL da Edge Function.
- Colunas esperadas na planilha:
  - ID da Tarefa
  - Título
  - Setor
  - Status
  - Data de Início
  - Prazo
  - Criada Por (ID ou E-mail)
  - Data de Criação

## 4. Critérios de Aceite

### CA-01 — Inserção
- **Given** uma instância configurada com as credenciais do Google Sheets
- **When** um usuário cria uma nova tarefa no Kanban
- **Then** uma nova linha é automaticamente adicionada no Google Sheets com todos os dados da tarefa em até 10 segundos.

### CA-02 — Atualização
- **Given** uma tarefa já existente tanto no banco quanto no Sheets
- **When** o status da tarefa muda para "Concluído"
- **Then** a linha correspondente no Google Sheets tem sua coluna "Status" atualizada para refletir a alteração.

### CA-03 — Falhas e Retentativas
- **Given** uma indisponibilidade da API do Google Sheets
- **When** o webhook tenta disparar a Edge Function
- **Then** o sistema registra o erro nos logs da Edge Function para posterior análise e a UI do usuário não é bloqueada nem afetada.
