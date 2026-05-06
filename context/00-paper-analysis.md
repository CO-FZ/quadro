# Análise Crítica do Harness à Luz de Zhou et al. (2026)

> Confronto entre o harness que desenhamos e o framework teórico de **"Externalization in LLM Agents: A Unified Review of Memory, Skills, Protocols and Harness Engineering"** (arXiv:2604.08224v1, abril de 2026).

> O paper é de Shanghai Jiao Tong University + colaboradores, com a tese central de que progresso confiável em agentes não vem só de modelos maiores, mas de **externalizar** burdens cognitivos em quatro dimensões coordenadas: **Memory, Skills, Protocols, Harness**.

---

## TL;DR — o veredito

Nosso harness está **fortemente alinhado** com a tese do paper em três das quatro dimensões: o protocolo de contexto cobre bem **Memória**, e os documentos de release/security cobrem bem o **Harness Engineering** (sandbox, control, observability, permission). Em compensação, ele **subdesenvolve sistematicamente as duas dimensões mais maduras de externalização** descritas no paper:

1. **Skills como artefatos de primeira classe** — o paper dedica a Seção 4 inteira a isso (incluindo `SKILL.md`, manifests, registry, progressive disclosure, composição) e o nosso harness não tem nenhum análogo.
2. **Protocolos como camada explícita** — MCP, A2A, AG-UI, AP2 e schemas tipados não aparecem em lugar nenhum dos templates atuais.

Há também três problemas estruturais menores: ausência de `docs/memory/` populado de fato, ausência de loop de auto-evolução do harness, e governança dos artefatos de IA que ainda não está em pé de igualdade com a governança de código.

A boa notícia é que isso é tudo **aditivo**. Nada do que está no harness precisa ser refeito; ele precisa ser **estendido** em pontos específicos.

---

## 1. Mapeamento conceitual: o que o paper descreve vs. o que temos

O paper organiza o agent design em torno desta arquitetura (Figura 3 e 7):

```
                    ┌─────────────────┐
                    │  Foundation     │
                    │  Model (Core)   │
                    └────────┬────────┘
                             │
    ┌────────────┬───────────┼───────────┬────────────┐
    │            │           │           │            │
 Memory      Skills      Protocols    Permission   Control
 (state)     (proc.      (interaction)(sandbox)  (recursion,
            expertise)                            cost, timeout)
                                                    │
                                              Observability
                                              (logs, traces)
```

Vamos comparar cada dimensão.

---

### 1.1 Memory — ✅ Bem coberto (com lacunas pontuais)

**O que o paper diz** (Seção 3): memória externaliza **estado ao longo do tempo**, em quatro tipos:

| Tipo de memória | Conteúdo | Onde está no nosso harness |
|-----------------|----------|----------------------------|
| **Working context** | arquivos abertos, vars temporárias, estado de execução ativo | `proxy.ts`, `app/`, contexto da sessão atual ✅ |
| **Episodic experience** | trajetórias passadas, falhas, reflexões | `docs/memory/execution/<YYYY-MM-DD>-<story-id>.md` ✅ |
| **Semantic knowledge** | abstrações duráveis, convenções, fatos do domínio | `docs/spec/`, `docs/spec/adr/`, ADRs `accepted` ✅ |
| **Personalized memory** | preferências do usuário, histórico cross-session | ❌ não temos — nosso harness é por-projeto, não por-usuário |

**O que está bom:**

- Nosso protocolo de **4 camadas de memória** (Knowledge Base → repo → logs de fase → context window) bate quase 1:1 com a evolução arquitetural que o paper descreve em §3.2 (Monolithic → Retrieval → Hierarchical → Adaptive).
- A regra "limpar contexto entre fases" é exatamente o que o paper chama em §3.4 de "transformação representacional": converter recall ilimitado em recognition limitada e curada.
- O "ritual de fim de fase" com `_summary.md` corresponde ao que o paper descreve em §3.2.3 como "extração, consolidação e esquecimento".

**O que falta (lacunas reais):**

1. **Personalized memory está ausente.** O paper distingue claramente memória do projeto vs. memória do usuário (§3.1, citando IFRAgent, VARS). Nosso harness só pensa em "estado do projeto" — não tem como o agente lembrar que o **Carlos** prefere TypeScript estrito vs. permissivo, ou que o time **B** sempre revisa antes de commitar. No contexto multi-time/multi-usuário, isso vai virar problema.

2. **Não há mecanismo explícito de retrieval seletivo.** Nosso "bootstrap mínimo" é baseado em regras fixas ("leia AGENTS.md + Spec + story"). O paper alerta em §3.4: "vasta capacidade de armazenamento sem retrieval forte ainda apresenta o problema errado ao modelo". Não temos heurística de decisão sobre **qual** seção do PRD/Spec carregar para uma story específica — assume-se que o agente saberá escolher. Em projetos grandes, isso vai estourar context budget.

3. **Não escrevemos de volta na Knowledge Base sistematicamente.** O paper enfatiza em §3.3 o loop bidirecional: traces de execução → memória → influência em decisões futuras. Nosso harness fala em "salvar padrões aprovados na Knowledge Base", mas não tem ritual nem template para **promover** algo do log de execução para a Knowledge Base. Vira ad hoc.

**Recomendação (P1):**

- Criar `05-execution/03-memory-promotion.md`: critérios para promover algo de `docs/memory/execution/` → ADR (semantic) → Knowledge Base do Antigravity (fast-recall).
- Criar slot opcional `docs/memory/personal/` ou usar a feature de memórias do Antigravity propriamente para preferências individuais (com seção de governança LGPD adicionada à `07-deploy/01-security-checklist.md`).

---

### 1.2 Skills — ❌ Lacuna principal

**O que o paper diz** (Seção 4 inteira, ~10 páginas): skills externalizam **expertise procedimental** em artefatos com cinco propriedades:

1. **Specification** (`SKILL.md`, manifest com capabilities, preconditions, scope) — §4.3.1
2. **Discovery** (registry semântico, busca por aderência ao task) — §4.3.2
3. **Progressive disclosure** (carregar nome → manifest → guia completo, em camadas) — §4.3.3
4. **Execution binding** (skill conecta a tools/protocols, mas **não é** tool) — §4.3.4
5. **Composition** (skill compõe outras skills) — §4.3.5

E quatro vias de aquisição (§4.4): **authored, distilled, discovered, composed**.

**O que temos:** AGENTS.md + ADRs + sprint templates. **Não temos uma camada de skills.**

Vamos detalhar a lacuna:

| Propriedade do paper | Estado no harness |
|----------------------|-------------------|
| Specification em arquivo discreto | ❌ — temos AGENTS.md monolítico |
| Discovery via registry | ❌ — agente lê tudo do AGENTS.md por default |
| Progressive disclosure | ⚠️ parcial — fazemos isso para PRD (carregar só seção), mas não temos a estrutura name→manifest→guide |
| Binding a tools | ❌ — convenções estão em AGENTS.md mas não como skill discreta |
| Composition | ❌ — não há composição declarada |

**Por que isso importa concretamente:**

1. **AGENTS.md vai inchar.** Hoje cobre stack, padrões de código, regras de commit, regras de memória, ditos de segurança. Numa equipe que faz 5 produtos, vira monstro de 800 linhas que o agente não lê com cuidado. O paper alerta em §4.5 ("context-dependent degradation") que skill files inflados degradam execução.

2. **Não há reuso entre projetos.** A "convenção de Server Action com Zod" que escrevemos em `02-nextjs-conventions.md` é, na linguagem do paper, uma **skill clássica** (Operational Procedure + Decision Heuristic + Normative Constraint, §4.1). Mas está enterrada num documento de 400 linhas. Não é um artefato discoverable, versionável e composível.

3. **Anthropic já documentou skills oficialmente** (Anthropic, 2025 — citado no paper). Antigravity vai seguir o padrão. Não usar é remar contra a maré.

**O que o paper recomenda na prática:**

> §4.3.3: "exposição em camadas: nome → manifest → guia completo. O propósito não é só comprimir documentação. Mais fundamentalmente, transforma a questão de 'preciso de mais detalhe?' em uma decisão de runtime."

**Recomendação (P0 — maior gap do harness):**

Criar uma camada `skills/` no repositório, paralela a `docs/`:

```
skills/
  README.md                          ← registry: lista todas as skills + 1 linha
  server-action-with-zod/
    SKILL.md                         ← manifest curto (capabilities, preconditions)
    GUIDE.md                         ← guia completo (carregado sob demanda)
    examples/
      basic.ts
      with-revalidate.ts
  cache-component-pattern/
    SKILL.md
    GUIDE.md
  testing-pyramid/
    SKILL.md
    GUIDE.md
  ...
```

**Cada SKILL.md** deve seguir o template que o paper descreve em §4.3.1 — capability boundaries, scope, preconditions, execution constraints, examples + counterexamples.

Vou criar este template como entregável adicional desta análise.

---

### 1.3 Protocols — ❌ Outra lacuna importante

**O que o paper diz** (Seção 5): protocolos externalizam **estrutura de interação** em quatro dimensões:

1. **Invocation grammar** — schemas tipados, formatos de argumento
2. **Lifecycle semantics** — estados, transições, completion/failure
3. **Permission/trust boundaries** — quem pode chamar o quê
4. **Discovery metadata** — registries, capability cards

E classifica protocolos vivos hoje:

| Família | Exemplos | O que externalizam |
|---------|----------|---------------------|
| Agent–Tool | **MCP** (Anthropic), ToolUniverse | invocação de tools |
| Agent–Agent | **A2A** (Google), ACP (IBM), ANP | delegação, capability discovery |
| Agent–User | **AG-UI** (CopilotKit), A2UI (Google) | UI state, streaming events |
| Domain | UCP (commerce), AP2 (payments) | governança vertical |

**O que temos:** zero menções a MCP, A2A, AG-UI ou similares no harness.

**Por que isso importa:**

1. **Antigravity já usa MCP nativamente.** Quando você dá ao agente acesso a um banco, a um Slack ou a um Figma, isso vai por MCP. Nosso harness deveria ter um capítulo dizendo: "tools externos só entram via MCP server; nunca via fetch direto do agente; auth é via OAuth ou token rotativo, gerenciada pelo servidor MCP".

2. **Server Actions já são, na prática, um protocolo agent-tool interno.** O paper trata protocolo como "schema tipado + validação de borda". Nossas Server Actions com Zod **são exatamente isso**, mas o harness não as classifica como protocolo. Falta o vocabulário.

3. **Multi-agent vai encostar em A2A.** No futuro próximo (já mencionado no Antigravity roadmap), Agent Manager vai falar A2A para coordenar agentes em workspaces diferentes. Sem prep, vamos pegar de surpresa.

4. **CVE-2025-66478 (que mencionei na security checklist) é literalmente uma falha de protocolo** — desserialização não validada de RSC. O paper em §5.1 fala disso: "interação não-protocolada vira exercício frágil de prompt-following".

**Recomendação (P0):**

Criar `05-execution/03-protocols.md` cobrindo:

- **MCP servers** que o projeto usa, com manifest declarado no repo (`mcp/registry.json`)
- **Server Actions** elevadas a status de "protocolo interno" — schema obrigatório, validação obrigatória, audit log
- **Webhooks externos** com HMAC + timestamp + idempotência (já está na security checklist mas avulso)
- **Preparação para A2A** (placeholder hoje): como identificaremos agentes, como autenticaremos handoffs

---

### 1.4 Harness Engineering — ✅ A parte mais forte do nosso trabalho

O paper define harness em §6 como **"o ambiente cognitivo desenhado dentro do qual módulos externalizados se tornam conjuntamente eficazes"**. As 6 dimensões analíticas (§6.2) são:

| Dimensão do paper | Onde está no nosso harness | Avaliação |
|-------------------|----------------------------|-----------|
| **Agent Loop & Control Flow** | implícito no fluxo Discovery→Deploy + Plan Artifact obrigatório | ✅ bem |
| **Sandboxing & Execution Isolation** | `AGENTS.md` allowlist + Terminal Sandbox ON | ✅ bem |
| **Human Oversight & Approval Gates** | 2 gates por story (plan + diff) + DoR/DoD | ✅ excelente |
| **Observability & Structured Feedback** | logs de fase + execution memory + present_files | ⚠️ médio (falta agregação) |
| **Configuration & Permissions** | AGENTS.md + ADRs + checklist | ✅ bem |
| **Context Budget Management** | bootstrap mínimo + ritual de limpeza | ✅ bem |

**Onde estamos fortes:** os gates humanos, a sandbox, e a disciplina de contexto são exatamente o que o paper recomenda. A figura 7 do paper basicamente desenha a arquitetura que nosso `00-architecture-and-flow.md` descreve, com nomes diferentes.

**Onde estamos fracos:**

1. **Observabilidade do agente em si.** O paper enfatiza em §6.2.4 que execution traces precisam ser **estruturados e agregáveis** (não só "log de sessão em markdown"). Nosso log é texto livre. Não dá para responder: "qual a taxa de plan-rejection nos últimos 30 dias?", "qual skill é a mais retrabalhada?", "quanto tempo médio de Plan→Diff?". Isso vira voo cego depois de algumas sprints.

2. **Loop de feedback inexistente.** O paper em §6.2.4: "execution traces fecham a loop de feedback... falhas repetidas devem flagar uma skill para revisão". Nosso harness lista esse princípio em "como o harness evolui", mas não tem mecanismo automático. Não há sinal nenhum sendo agregado.

**Recomendação (P1):**

- Criar `05-execution/04-observability.md` propondo um mínimo de métricas estruturadas: % de plans aprovados de primeira, tempo médio de gate, número de revisões por skill, falhas de typecheck antes do diff. Pode começar como JSONL em `docs/memory/metrics.jsonl` agregado por script.

---

## 2. Princípios do paper que merecem entrar explicitamente no harness

O paper articula 4 princípios que estão hoje **implícitos** no nosso harness mas merecem virar explícitos. Eu os adicionaria a `00-architecture-and-flow.md` Seção 2 (princípios arquiteturais), elevando de 5 para 9:

### P6 — Externalização não é gratuita (§8.4)

> "Cada camada adicional de memória, schema de API, ou regra de segurança impõe latência e overhead de raciocínio, e além de certo ponto o modelo gasta mais esforço descobrindo, parseando e coordenando módulos do que resolvendo a tarefa."

**Implicação para nosso harness:** o teste de fumaça para qualquer documento novo deveria ser: *"este documento reduz o burden cognitivo do agente, ou apenas adiciona mais um?"*. Hoje não temos este filtro — temos tendência de adicionar regras a `AGENTS.md`.

### P7 — Recall vira Recognition (§3.4 e tese central do paper)

> "A transformação representacional converte um problema interno de recall em um problema externo de recognition-and-retrieval. O modelo não precisa mais recuperar history dos parâmetros; ele só precisa reconhecer e usar a fatia já curada."

**Implicação:** todo template do harness deveria ser desenhado para que o agente **reconheça** uma estrutura conhecida, não para que **reescreva** a estrutura. Nossos templates fazem isso bem (PRD, ADR, story), mas a justificativa não está articulada.

### P8 — Os módulos competem pelo mesmo recurso escasso: o context window (§7.1, "system-level dynamics")

> "Memory retrieval, skill loading, and protocol schemas all occupy tokens. Expanding one module's context footprint necessarily compresses the others."

**Implicação:** nosso "bootstrap mínimo" precisa virar uma decisão **calculada**, não apenas uma checklist. Em projetos grandes, vai ser preciso priorizar: carrego o ADR ou a Story? Carrego a SKILL inteira ou só o manifest? O paper sugere que isso vire decisão de runtime do harness — vale embutir esse trade-off explícito no `00-context-protocol.md`.

### P9 — A fronteira entre parametric e externalizado é móvel (§7.3, §8.1)

> "À medida que modelos crescem em capacidade e infraestrutura externalizada amadurece, a partição ótima não é estática."

**Implicação:** nosso harness assume que decisões como "use Zod sempre" são permanentes. O paper alerta que isso é uma fronteira que se move. Quando Gemini 4 ou Claude 5 fizer validação de schema sem Zod confiavelmente, a fronteira muda. Faz sentido ter um ritual de **revisão anual** das decisões de externalização — possivelmente uma "sprint de saúde do harness" como já mencionei.

---

## 3. Riscos do paper que nosso harness não endereça bem

Em §8.4 e §4.5, o paper lista classes de risco específicas a sistemas externalizados:

### 3.1 Memory poisoning

> "Entradas corrompidas em traces episódicos ou stores factuais podem distorcer silenciosamente raciocínio futuro."

**Nosso estado:** a Knowledge Base do Antigravity é gerenciada manualmente, mas **não temos auditoria do que entra nela**. Se um agente, em uma sessão duvidosa, salvar um padrão errado como "snippet aprovado", isso contamina sessões futuras.

**Mitigação proposta:** adicionar à `01-security-checklist.md` um item: "auditoria mensal da Knowledge Base — qualquer entrada sem PR/ADR de origem é candidata a remoção".

### 3.2 Skill injection (§4.5, "Unsafe composition")

> "Skills que parecem inócuas em isolamento podem interagir de forma insegura quando combinadas, especialmente quando incluem instruções longas, scripts executáveis e dependências externas."

> Citação concreta: Liu et al. 2026, "Agent Skills in the Wild" — estudo empírico de ecossistemas públicos de skills relata taxas substanciais de prompt injection, exfiltração de dados, escalação de privilégio.

**Nosso estado:** se passarmos a usar skills (como recomendei no §1.2), precisamos do que o paper chama de "skill review" — qualquer skill nova passa por revisão de segurança análoga a code review. Hoje, AGENTS.md é alterada por PR. Skills devem ter o mesmo gate.

### 3.3 Protocol spoofing (§8.4)

> "Manifests forjados de tools ou endpoints manipulados podem causar ações não autorizadas sob aparência de interação legítima."

**Nosso estado:** quando começarmos a usar MCP servers, esse risco vira real. Servidor MCP pode fingir ser do Slack e exfiltrar mensagens. Nossa security checklist não cobre isso.

**Mitigação proposta:** registry interno de MCP servers permitidos (`mcp/allowed-servers.json` versionado), com checksum e origem auditada — só roda servers da lista.

---

## 4. Conceitos do paper que vale incorporar ao vocabulário do harness

Estes termos do paper têm precisão maior que os nossos atuais:

| Termo do paper | Substitui / complementa o nosso |
|----------------|--------------------------------|
| **Externalização** (Norman, 1991) | "harness", como justificativa filosófica |
| **Cognitive artifact** | "documento" ou "template" |
| **Representational transformation** | nada — é o **mecanismo** pelo qual o harness funciona |
| **Burden externalization** | "delegação" |
| **Working context vs. semantic vs. episodic vs. personalized** | nossa única "memória" |
| **Progressive disclosure** | "bootstrap mínimo" |
| **Skill** (artefato com manifest) | "convenção" |
| **Protocol** (família + invocation grammar) | "API" / "interface" (vago) |

Não precisamos trocar tudo. Mas adotar **externalização** como verbo principal (em vez de "delegação") na introdução do harness deixaria o framework mais alinhado com a literatura emergente — e com o que o Antigravity vai documentar oficialmente.

---

## 5. Recomendações concretas, em ordem de prioridade

### P0 — fazer agora (gaps grandes)

1. **Criar a camada `skills/`** (§1.2 desta análise). É o gap mais visível. Proposta de template detalhada na próxima seção.
2. **Criar `05-execution/03-protocols.md`** (§1.3). MCP, Server Actions como protocolos internos, webhooks, prep para A2A.

### P1 — fazer na próxima rodada

3. **`05-execution/04-observability.md`** (§1.4) — métricas estruturadas do harness em si.
4. **`05-execution/05-memory-promotion.md`** (§1.1) — como evidência vira ADR vira Knowledge Base.
5. **Adicionar P6–P9 ao `00-architecture-and-flow.md`** (§2 desta análise).
6. **Atualizar `01-security-checklist.md`** com as 3 classes de risco do §3 desta análise.

### P2 — quando o harness for usado em escala

7. **Personalized memory layer** — quando passar de 1 desenvolvedor.
8. **Mecanismo de retrieval seletivo** baseado em metadata da story (que ADRs aplicam, qual seção do PRD, quais skills) — quando o context budget começar a apertar.
9. **Self-evolving harness loop** (§8.3 do paper) — ritual de "sprint de saúde do harness" trimestral, com métricas de §1.4.

---

## 6. Entregável adicional: template `SKILL.md`

Como esse foi o gap maior, vou já entregar o template. Está em arquivo separado (`05-execution/03-skill-template.md`) e a estrutura proposta de `skills/` no repositório.

---

## 7. O que está bom e não precisa mudar

Para terminar honestamente: o paper **valida** a maior parte das nossas decisões.

- Nosso `AGENTS.md` é exatamente o tipo de cognitive artifact que o paper descreve em §6.3 ao falar de Codex e Claude Code.
- Nosso protocolo de 4 camadas de memória é uma versão prática da arquitetura que o paper desenha em §3.2.
- Nossos gates humanos (Plan + Diff) são o que o paper descreve em §6.2.3 como "approval gates" — três padrões mencionados (pre-execution, post-execution, escalation), nós usamos os dois primeiros.
- Nossa filosofia de **"contexto mínimo viável"** é precisamente o que o paper chama em §6.2.6 de "context budget management".
- Nosso **runbook de deploy com canário e rollback** é o que o paper descreve em §6.2.2 como "execution isolation cognitive boundary".

O harness está bem fundamentado. As lacunas são de **maturidade e completude**, não de direção. Estamos no caminho certo; só não chegamos no fim.

---

## 8. Citação final que vale colar em algum lugar

> "Agency is therefore not located in the model alone; it emerges from the coupling of the model with the environment that organizes its cognition into action." — Zhou et al. (2026), §6.1

Esta frase é uma boa epígrafe para o `00-architecture-and-flow.md` — captura a tese inteira em uma linha.
