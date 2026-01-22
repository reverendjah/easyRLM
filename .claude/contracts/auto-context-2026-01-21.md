# Contract: Auto-persistência de contexto

**Status:** LOCKED
**Approved at:** 2026-01-21 19:45

## Approved Criteria (Tests)

| # | Criterion | Source | Level | Test | Status |
|---|-----------|--------|-------|------|--------|
| U1 | Contexto aparece ao iniciar sessão | interview | Integration | `SessionStart hook executes` | LOCKED |
| U2 | Decisões salvas ao terminar sessão | interview | Integration | `SessionEnd hook executes` | LOCKED |
| T1 | settings.json inválido não quebra | analysis | Unit | `graceful fallback` | LOCKED |
| T3 | Script de extração trata erros | analysis | Unit | `error handling` | LOCKED |
| T5 | Evita duplicatas no knowledge.md | analysis | Unit | `dedup logic` | LOCKED |

## E2E Validation

**Type:** semi-auto
**Status:** PENDING

**User Action:**
1. Encerrar sessão atual
2. Abrir nova sessão (`claude`)
3. Verificar contexto no início

**Claude Verifications:**
- [ ] project.md e knowledge.md aparecem automaticamente
- [ ] Hooks configurados em settings.json

**Success Criteria:**
- [ ] Nova sessão inicia com contexto carregado
- [ ] Sessão encerrada salva decisões importantes

## IMMUTABILITY

> Scope change requires new approval and contract re-generation.
