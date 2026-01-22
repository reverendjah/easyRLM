# Analysis: Auto-persistência de contexto

## Metadata
- **Type:** service
- **Playbook:** playbooks/service/analyze.md

## Discovery Summary

### Current State
O Easy RLM tem instruções documentadas para carregar/salvar contexto, mas **nenhum enforcement real**.

| Mecanismo | Disponível | Enforcement |
|-----------|------------|-------------|
| context-manager.md | Sim | Instruções apenas (agente pode ignorar) |
| context-refresh.js | Sim | Biblioteca, precisa ser chamada |
| CLAUDE.md rules | Sim | Soft rules (não garantem execução) |
| Hooks nativos | **NÃO** | N/A |

### Claude Code Hooks (SOLUÇÃO)

Pesquisa da documentação do Claude Code revela:

```json
// .claude/settings.json
{
  "hooks": {
    "SessionStart": [
      {
        "command": "cat .claude/context/project.md .claude/context/knowledge.md",
        "output": "prepend"
      }
    ],
    "SessionEnd": [
      {
        "command": "./scripts/extract-decisions.sh",
        "input": "transcript"
      }
    ]
  }
}
```

| Hook | Trigger | Input | Output | Use Case |
|------|---------|-------|--------|----------|
| SessionStart | Nova sessão | - | prepend/append | Auto-load contexto |
| SessionEnd | Fim da sessão | transcript | - | Auto-save decisões |

## Mapped Mocks
| Service | Exists? | Action |
|---------|---------|--------|
| File system | N/A | Direct (bash scripts) |
| Claude Code hooks | N/A | Native feature |

## Existing Tests
| Pattern | Files |
|---------|-------|
| context-recovery benchmark | benchmark/benchmarks/context-recovery/ |
| context-refresh lib | lib/context-refresh.js |

## Reusable Code
| Need | Existing Code | Action |
|------|---------------|--------|
| Load context files | context-manager.md:34-48 | Adapt for hook |
| Save decisions | context-manager.md:205-223 | Adapt for script |
| Staleness detection | lib/context-refresh.js:21-35 | Reuse as-is |

## Discovered Technical Scenarios
| # | Scenario | Category | Source | Handled? |
|---|----------|----------|--------|----------|
| T1 | Hook não executa (settings.json inválido) | ENVIRONMENT | Claude Code config | No |
| T2 | Arquivos de contexto não existem | INPUT | .claude/context/*.md | Yes (via context-indexer) |
| T3 | Script de extração falha | DEPENDENCY | extract-decisions.sh | No |
| T4 | Transcript muito grande (>1MB) | INPUT | SessionEnd input | No |
| T5 | Decisões duplicadas no knowledge.md | STATE | Append logic | No |

## Implementation Strategy

### AUTO-LOAD (SessionStart)
```bash
# scripts/load-context.sh
#!/bin/bash
# Auto-load context at session start

CONTEXT_DIR=".claude/context"

# Load Tier 1 (sempre)
if [ -f "$CONTEXT_DIR/project.md" ]; then
  echo "## Project Context"
  cat "$CONTEXT_DIR/project.md"
  echo ""
fi

# Load Tier 3 (decisões importantes)
if [ -f "$CONTEXT_DIR/knowledge.md" ]; then
  echo "## Previous Decisions"
  cat "$CONTEXT_DIR/knowledge.md"
fi
```

### AUTO-SAVE (SessionEnd)
```bash
# scripts/extract-decisions.sh
#!/bin/bash
# Extract decisions from session transcript and append to knowledge.md

TRANSCRIPT="$1"
KNOWLEDGE=".claude/context/knowledge.md"

# Extract lines that look like decisions
echo "$TRANSCRIPT" | grep -iE "(decidimos|escolhemos|optamos|decisão:|decision:)" >> "$KNOWLEDGE"
```

## Test Strategy Preview
| Test Type | Required? | Reason |
|-----------|-----------|--------|
| Unit | Sim | Testar scripts isoladamente |
| Integration | Sim | Testar hooks com Claude Code |
| E2E | Sim | Validar workflow completo (nova sessão → trabalho → encerrar → nova sessão → verificar contexto) |

## Critical Acceptance Criteria
| # | Criterion | Type |
|---|-----------|------|
| U1 | Contexto aparece ao iniciar sessão | SUCCESS |
| U2 | Decisões salvas ao terminar | SUCCESS |
| U3 | Contexto não carregado | FAILURE |
| U4 | Decisões perdidas | FAILURE |
