---
model: opus
---
# Debug Workflow

Investigate and resolve: $ARGUMENTS

## START
REQUIRED ACTION: Read ~/.claude/commands/debug/01-reproduce.md
Follow instructions. Each phase points to the next.

## Flow
Reproduce → Investigate → Fix → Verify → Commit → Evaluate → End (NO STOPS)

## Rules
1. ZERO stops until the end
2. ZERO questions to user (except if unable to reproduce)
3. Minimal fix - only what's necessary to resolve
4. Errors: fix and continue, don't abandon
