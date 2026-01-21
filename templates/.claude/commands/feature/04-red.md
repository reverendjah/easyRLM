# Phase 4: RED (Write Tests)

> **RULE:** Tests must FAIL. Non-existent imports OK. DO NOT write production code.

## Responsibility
Write tests that FAIL based on contract. AUTONOMOUS execution.

---

## Step 1: Load Context

```
Read {state.contract}   # Approved criteria + mitigations
Read {state.analysis}   # Map: existing tests, code to reuse
```

List available factories/mocks:
- test-utils/factories/ → names
- test-utils/mocks/ → names

---

## Step 2: Isolate Context (CRUCIAL)

**DISCARD from memory:**
- Production code
- Implementation patterns
- How functions are implemented

**RETAIN only:**
- Contract criteria (WHAT to test)
- Factory/mock names (HOW to isolate)
- Existing tests map (WHERE to place)

> **Goal:** Test BEHAVIOR, not IMPLEMENTATION.

---

## Step 3: Write Tests

### 3.1 Location Decision

| Analysis Result | Action |
|-----------------|--------|
| Test exists for module | EXTEND existing file |
| File exists, case doesn't | ADD describe/it |
| None exists | CREATE new file |

### 3.2 Structure (via Playbook)

Load test playbook according to feature type:

```
Read ~/.claude/commands/feature/playbooks/{featureType}/red.md
```

| featureType | Playbook |
|-------------|----------|
| api | playbooks/api/red.md |
| ui | playbooks/ui/red.md |
| service | playbooks/service/red.md |
| job | playbooks/job/red.md |

The playbook defines:
- Required tests (Unit/Integration/E2E)
- Typical mocks
- Test patterns with vitest

### 3.3 Rules

- Non-existent imports OK (will fail - RED)
- Use factories from test-utils/factories/
- Use mocks from test-utils/mocks/
- 1 contract criterion → 1+ tests
- **ONLY Unit and Integration tests** (E2E is validated in 07-validation)

---

## Step 4: Sufficiency Gate

Use `mcp__sequential-thinking__sequentialthinking`:

Verify only Unit/Integration criteria (E2E is separate):

| # | Criterion (Unit/Integration) | Test Written | Covered? |
|---|------------------------------|--------------|----------|
| 1 | "{criterion}" | it('...') | ✓/✗ |

**IF** coverage < 100%:
- Identify missing criteria
- Return to Step 3
- Add tests

**IF** coverage == 100%:
- Proceed

---

## Step 5: Verify RED

```bash
npm test -- --testPathPattern="[feature]" 2>&1 || true
```

| Result | Action |
|--------|--------|
| All FAIL | Correct - proceed |
| Some pass | Investigate (implementation exists?) |
| Syntax error | Fix test and re-run |

---

## Step 6: Commit RED

```bash
git add -A
git commit -m "$(cat <<'EOF'
test: add tests for [feature] (RED)

Tests expected to fail - implementation pending.
Coverage: {N} criteria from contract.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Gate (BLOCKING)

```bash
SLUG=$(jq -r '.feature' .claude/workflow-state.json 2>/dev/null)

# Pre-condition
test -f ".claude/contracts/${SLUG}.md" || { echo "❌ Pre: contract doesn't exist"; exit 1; }

# Post-condition: RED commit exists
git log -1 --format="%s" | grep -q "test:.*RED" || { echo "❌ RED commit not found"; exit 1; }

echo "✅ Gate 04-red passed"
```

---

## Step 7: Update State

```bash
jq '
  .currentPhase = "05-green" |
  .completedPhases += ["04-red"] |
  .resumeHint = "RED tests committed. Next: implement minimal code" |
  .lastStep = "Step 7: Update State"
' .claude/workflow-state.json > .claude/workflow-state.tmp && mv .claude/workflow-state.tmp .claude/workflow-state.json
```

---

## NEXT PHASE
REQUIRED ACTION: Read ~/.claude/commands/feature/05-green.md
