# Phase 5: GREEN (Implement)

> **RULE:** MINIMAL code for tests to pass. No extra validations, abstractions, or optimizations.

## Responsibility
Implement MINIMAL code for tests to pass. AUTONOMOUS execution.

---

## Step 1: Load Context

```bash
# Tests that failed
git diff HEAD~1 --name-only | grep "\.test\.ts$"
```

```
Read {state.analysis}   # Existing code to reuse
Read {state.contract}   # Agreed mitigations
```

---

## Step 2: Plan Tasks

### 2.1 Map Tests → Code

| Test | Required Code | Reuses? | File |
|------|---------------|---------|------|
| it('A') | function X | helper.ts:20 | EXTEND |
| it('B') | function Y | - | CREATE |
| it('C') | function Z | utils.ts | REUSE |

### 2.2 Include Mitigations

From contract, section "Excluded Scenarios":

| Mitigation | Implementation | File |
|------------|----------------|------|
| try/catch for API | wrap in try/catch + log | handler.ts |
| Schema validation | zod schema | types.ts |

### 2.3 Order

1. Dependencies first (types, utils)
2. Main functions
3. Mitigations

---

## Step 3: Implement (Loop per Test)

For each failing test:

```
┌─────────────────────────────────────────┐
│  1. TodoWrite: mark in_progress         │
│  2. Implement MINIMAL code              │
│  3. tsc --noEmit                        │
│  4. npm test -- --testPathPattern="X"   │
│  5. IF passed → TodoWrite: completed    │
│     IF failed → fix (max 3x)            │
│  6. Next test                           │
└─────────────────────────────────────────┘
```

### What is "Minimal Code"?

**DO:**
- Exactly what test expects
- Simple and elegant structures
- Reuse existing code

**DON'T:**
- Validations beyond tested
- Abstractions "just in case"
- Premature optimizations
- Refactoring (phase 6)

---

## Step 4: Validate GREEN

### 4.1 Tests

```bash
npm test
```

### 4.2 TypeScript

```bash
npx tsc --noEmit
```

### 4.3 Mitigations

Contract checklist:
- [ ] All mitigations implemented?
- [ ] Logging for untested scenarios?
- [ ] Schemas validate risky inputs?

### 4.4 Correction Loop

```
while (failures AND attempts < 3):
    Identify error

    # CONTEXT REFRESH CHECKPOINT
    IF error contains "not found" OR "undefined" OR "type error":
      → TRIGGER: Dynamic Context Refresh (does NOT count as attempt)
      → Re-grep for missing file/function
      → Update working context
      → Retry with refreshed context

    Fix CODE (not test)
    Re-run
    attempts++

if still failing:
    STOP and report to user
```

See: `helpers/context-refresh.md` for full protocol.

---

## Step 5: Commit GREEN

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: implement [feature]

- All tests passing
- Mitigations implemented

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Gate (BLOCKING)

```bash
# Tests pass
npm test || { echo "❌ Tests failing"; exit 1; }

# TypeScript compiles
npx tsc --noEmit || { echo "❌ TypeScript doesn't compile"; exit 1; }

echo "✅ Gate 05-green passed"
```

---

## Output

```markdown
## GREEN Phase - Complete

**Tests:** X/X passing

**Modified files:**
- [list]

**Mitigations implemented:**
- [list]
```

---

## Step 6: Update State

```bash
jq '
  .currentPhase = "06-quality" |
  .completedPhases += ["05-green"] |
  .resumeHint = "GREEN complete. Next: quality gate (refactoring)" |
  .lastStep = "Step 6: Update State"
' .claude/workflow-state.json > .claude/workflow-state.tmp && mv .claude/workflow-state.tmp .claude/workflow-state.json
```

---

## NEXT PHASE
REQUIRED ACTION: Read ~/.claude/commands/feature/06-quality.md
