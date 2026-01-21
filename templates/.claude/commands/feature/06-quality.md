# Phase 6: Quality

## Responsibility
REFACTOR from TDD cycle + Quality Gate.

---

## Step 1: Refactoring Agents

### 1.1 Code Simplifier
```javascript
Task({
  subagent_type: "code-simplifier",
  prompt: `Check reuse (DRY). Detect duplications. Simplify.

RULE FOR .test.ts - FACTORIES:
- IF inline objects representing entities
- AND factory exists in test-utils/factories/
- THEN replace with factory
- Validate with npm test
- Revert if fails`,
  description: "Simplify and DRY check"
})
```

### 1.2 Code Reviewer
```javascript
Task({
  subagent_type: "code-reviewer",
  prompt: "Final review. Check quality, security, patterns. Fix issues.",
  description: "Final code review"
})
```

---

## Step 2: Verify Tests Post-Refactoring

```bash
npm test 2>&1
```

| Result | Action |
|--------|--------|
| All pass | Skip to Step 3 (Final Gate) |
| Some failed | Execute Recovery |

### Recovery (IF FAIL)

1. Identify cause
2. Check agent diff
3. Decide: revert or fix
4. Re-run
5. Max 2 attempts

---

## Step 3: Final Gate

```bash
npm test && npx tsc --noEmit && npm run build
```

### Self-Healing Loop

```
attempts = 0
while (gate failing AND attempts < 2):
    1. Identify error
    2. Analyze cause
    3. Fix
    4. Re-run
    attempts++
```

---

## Gate (BLOCKING)

```bash
# Tests pass
npm test || { echo "❌ Tests failing"; exit 1; }

# TypeScript compiles
npx tsc --noEmit || { echo "❌ TypeScript doesn't compile"; exit 1; }

# Build works
npm run build || { echo "❌ Build failed"; exit 1; }

echo "✅ Gate 06-quality passed"
```

---

## Step 4: Update State

```bash
jq '
  .currentPhase = "07-validation" |
  .completedPhases += ["06-quality"] |
  .resumeHint = "Quality complete. Next: E2E validation" |
  .lastStep = "Step 4: Update State"
' .claude/workflow-state.json > .claude/workflow-state.tmp && mv .claude/workflow-state.tmp .claude/workflow-state.json
```

---

## NEXT PHASE
REQUIRED ACTION: Read ~/.claude/commands/feature/07-validation.md
