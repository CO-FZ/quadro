# Discovery — Summary

**Fase encerrada em:** 2026-05-06
**Decisão:** ✅ Go (avançar para PRD)
**Brief de origem:** [docs/discovery/00-discovery-brief.md](../../discovery/00-discovery-brief.md)

---

## Problema validado

Substituir as planilhas concorrentes da Comissão de Obras de Fortaleza (CO-FZ) — DT e DA — por um sistema web mobile-first com Kanban interativo, Dashboard analítico e geração automática de matriz de disponibilidade.

## Hipótese aprovada

Sistema com Kanban + Dashboard mobile-first resolve a desorganização das planilhas e gera a matriz de disponibilidade automaticamente, **se** a usabilidade no celular for fluida o bastante para 100% de adesão.

## North Star

100% da equipe (DT+DA) reportando atividade diariamente.

## Restrições aceitas

- Stack travado: Next.js 16 (App Router), Tailwind v4 (`@theme`), TypeScript estrito, mobile-first.
- Equipe e patrocínio: Eng Carlos Eduardo (sponsor + dev + product + usuário-piloto).
- Acesso restrito à CO-FZ.

## Riscos materiais carregados para PRD

- Baixa adesão se o registro diário exigir muitos cliques no celular → mitigação migra para o PRD como NFR (LCP/INP) e para o design system.
- Sponsor único (Eng Carlos Eduardo) acumula 4 papéis — risco de viés de validação. **Pendente:** identificar pelo menos 1 usuário-piloto distinto antes do beta.

## Itens deixados em aberto (vão para Sprint 04+ ou novo Discovery)

- Anti-evidência "muitos cliques → abandono" só será testada com protótipo navegável.
- Métrica de guarda-corpo (tempo médio para registrar tarefa) não tem baseline ainda.
- Evidências do brief: 1 fonte qualitativa (vivência da equipe). **Harness debt:** Discovery não tem rota guiada de elicitação ([harness-retro-01.md §1.2](../harness-retro-01.md)) — sai como PR contra a skill.

## Decisões transversais

- Dashboard analítico interno é a forma de medir adesão diária (não Mixpanel, GA, etc).
- Sincronização Google Sheets é P1 (espelho para relatórios) — não bloqueia v1.
