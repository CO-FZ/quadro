# Visão do Produto — Quadro CO-FZ

**Owner:** Eng Carlos Eduardo
**Status:** v1.0 — em produção
**Derivado de:** [PRD v1.0](../prd/00-prd.md)

---

## Problema

Membros da Divisão Técnica e Administrativa da Comissão de Obras de Fortaleza registram atividades em planilhas concorrentes. O resultado: perda de prazos, sobrecarga invisível e nenhuma visibilidade para redistribuição de demanda.

## Solução

Kanban interativo mobile-first + dashboard analítico hospedado na Vercel, com banco de dados e autenticação via Supabase. Dados espelhados automaticamente no Google Sheets para relatórios externos.

## Personas

| Persona | Necessidade primária |
|---------|---------------------|
| Membro DT/DA | Interface rápida para registrar e mover atividades pelo celular |
| Gestor (Eng Carlos Eduardo) | Visão unificada de progresso e capacidade da equipe |

## Proposta de valor

> Em menos de 60 segundos pelo celular, qualquer membro registra o que fez. Em menos de 30 segundos, o gestor vê quem está ocioso e redistribui.

## V1 — Escopo entregue

- ✅ Autenticação Google (Gmail restrito via whitelist)
- ✅ Kanban mobile-first com drag-and-drop e status `pendente / em_andamento / finalizada / arquivada`
- ✅ Dashboard analítico por membro e status
- ✅ Sincronização automática com Google Sheets via Edge Function
- ✅ RBAC: `admin`, `coordenador`, `efetivo`
- ✅ Gestão de usuários: whitelist, roles, soft-delete, audit log

## Métricas de sucesso

| Métrica | Meta | Período |
|---------|------|---------|
| Adesão diária | 100% da equipe | pós-lançamento |
| Latência de sync | < 5s para Sheets | steady state |
| LCP p75 | < 2.5s | mobile |

## Fora de escopo (v1)

- Cálculo de folha de pagamento
- Controle de estoques
- Autenticação fora do Gmail da equipe

## Roadmap pós-v1

Ver [roadmap.md](roadmap.md).
