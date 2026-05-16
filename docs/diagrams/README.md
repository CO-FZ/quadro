# Diagrams — Quadro CO-FZ

Diagramas arquiteturais do projeto.

---

## Convenção

- Diagramas inline em Markdown usam **Mermaid** (renderizado pelo GitHub e VSCode).
- Diagramas mais complexos (arquitetura, bounded contexts, módulos): usar **Excalidraw** ou **D2** em arquivos `.excalidraw` / `.d2` nesta pasta.
- Toda imagem exportada deve ter o arquivo-fonte correspondente commitado.

---

## Diagramas existentes

| Diagrama | Localização | Formato |
|---------|------------|---------|
| Fluxo principal do produto | [docs/prd/00-prd.md §8](../prd/00-prd.md) | Mermaid |
| Event flows (CreateTask, MoveTask, ArchiveTask, SyncSheets) | [docs/architecture/event-flow.md](../architecture/event-flow.md) | ASCII |

---

## Como gerar diagramas

### Mermaid (inline)

Usar bloco de código com linguagem `mermaid` em qualquer `.md`. GitHub renderiza automaticamente.

### D2 (opcional, para diagramas grandes)

```bash
curl -fsSL https://d2lang.com/install.sh | sh
d2 diagrams/architecture.d2 diagrams/architecture.svg
```

---

## Próximos diagramas sugeridos (Sprint 09+)

- `architecture.d2` — módulos e dependências entre bounded contexts.
- `entity-relationship.d2` — schema atual com todas as tabelas e FKs.
- `deployment.d2` — topologia Vercel + Supabase + GitHub Actions.
