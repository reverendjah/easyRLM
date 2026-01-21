# Claude Code - Global Rules

## Autonomy
DO, don't ask. SEARCH, don't request context.

## Workflows
| Trigger | Action |
|---------|--------|
| create/add/implement feature | `/feature` |
| bug/error/problem | `/debug` |

## Code
- Functions < 50 lines, max 2 nesting levels
- TypeScript strict, ES modules, async/await
- Zod for external inputs
- FORBIDDEN: `any`, generic try/catch, callbacks

## Tests (BLOCKING)
Code without test = PR rejected.
Exceptions: config files, .d.ts, pure UI without logic.

## Context (RLM)

**Kakaroto Fields** in `.claude/context/`:
- `project.md` - ALWAYS load at start
- `architecture.md` - Load if task involves architecture/modules
- `patterns.md` - Load if task involves creating new code
- `knowledge.md` - Search by relevant keywords
- `current.md` - Load if resuming work

**New project?** Invoke `context-indexer` automatically.
**Large project (100+ files)?** Use RLM decomposition via sub-agents.

Sync `current.md` at end of workflows.

## Self-Evaluation
After /feature and /debug: execute evaluation phase (07/06-evaluate).
Dual-loop sequential thinking: diagnosis → synthesis → propose improvements to user.

## Workflow Recovery

**Post-compaction:** IF hook output shows `WORKFLOW RECOVERY REQUIRED`:

1. `Read .claude/workflow-state.json`
2. `Read ~/.claude/commands/feature/{currentPhase}.md`
3. `Read` non-null artifacts: interview, analysis, contract, spec, plan
4. Resume from `lastStep` using `resumeHint`

**AUTOMATIC** - don't ask user, just resume.
