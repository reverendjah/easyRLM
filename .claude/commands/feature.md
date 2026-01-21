---
model: opus
---
# Feature Workflow v2

Develop: $ARGUMENTS

## START
REQUIRED ACTION: Read ~/.claude/commands/feature/01-understand.md
Follow instructions. Each phase points to the next.

## Flow

```
01-understand (requirements)
    ↓ User answers PRODUCT questions
02-analyze (internal - triage + playbook)
    ↓ Automatic
03-strategy ← ONLY APPROVAL
    ↓ User approves test strategy
04-red (RED)
    ↓ Automatic
05-green (GREEN)
    ↓ Automatic
06-quality (REFACTOR)
    ↓ Automatic
07-validation (E2E)
    ↓ Automatic
08-delivery (commit)
    ↓ Automatic
09-evaluate (self-assessment)
```

## Checkpoints

- **03-strategy**: Only point requiring user approval
- All other phases: automatic progression

## Playbooks

Selected automatically in 02-analyze based on feature type:
- `api/` - REST/GraphQL endpoints
- `ui/` - React/UI components
- `service/` - Backend services
- `job/` - Cron jobs/workers

## Recovery

If interrupted, read `.claude/workflow-state.json` and resume.
