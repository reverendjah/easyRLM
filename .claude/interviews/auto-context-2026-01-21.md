# Interview: Auto-persistência de contexto

## Request (Step 1)
- **Feature:** Garantir que Easy RLM automaticamente carrega e salva contexto
- **Área:** .claude/, lib/, hooks
- **Key terms:** knowledge.md, project.md, SessionStart, SessionEnd, hooks, persistence

## Discovery (Step 2)
- **Services:** context-manager.md, memory-sync agent
- **Patterns:** Kakaroto Fields (5-tier context), workflow phases
- **Memory:** Instruções existem mas não são enforced

### Mecanismos Disponíveis no Claude Code
| Mecanismo | Auto-Load | Auto-Save | Enforcement |
|-----------|-----------|-----------|-------------|
| SessionStart Hook | ✅ | ❌ | FORTE |
| CLAUDE.md | ✅ | ❌ | MUITO FORTE |
| SessionEnd Hook | ❌ | ✅ | FORTE |
| .claude/rules/ | ✅ | ❌ | FORTE |

## Reflection (Step 3)
- **Scope:** MVP - implementar hooks básicos que funcionam
- **Implicit Decisions:**
  | Decision | Justification |
  |----------|---------------|
  | Usar hooks nativos do Claude Code | Única forma de enforcement real |
  | SessionStart para load | Injeta contexto antes de qualquer interação |
  | SessionEnd para save | Acesso ao transcript completo da sessão |
  | Script bash para extração | Simplicidade e portabilidade |

## Questions and Answers (Step 4)
| # | Question | Answer | Impact |
|---|----------|--------|--------|
| 1 | Como garantir auto-load? | Explorar soluções, encontrar melhor formato | Definiu que hooks são a melhor opção |
| 2 | Como garantir auto-save? | Explorar soluções, recomendar | Definiu SessionEnd + script |

## User Acceptance Criteria (Step 5)
| # | Criterion | Type | Verification |
|---|-----------|------|--------------|
| U1 | Contexto aparece automaticamente ao iniciar sessão | SUCCESS | Iniciar nova sessão, verificar se project.md e knowledge.md estão no contexto |
| U2 | Decisões são salvas ao terminar sessão | SUCCESS | Terminar sessão, verificar se knowledge.md foi atualizado |
| U3 | Contexto não carregado | FAILURE | Sessão inicia sem arquivos de contexto |
| U4 | Decisões perdidas | FAILURE | Sessão termina e decisões importantes não são salvas |
