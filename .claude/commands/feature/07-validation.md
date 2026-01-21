# Phase 7: Validation

## Responsibility
E2E Validation - verify that feature works in the real world.

---

## Step 1: Pre-flight Check (BLOCKING)

```bash
# Read contract path from state
CONTRACT=$(jq -r '.contract' .claude/workflow-state.json)

# Verify that contract exists and has E2E spec
if [ ! -f "$CONTRACT" ]; then
  echo "❌ GATE BLOCKED: Contract not found at $CONTRACT"
  echo "Execute phase 03-strategy to create contract"
  exit 1
fi

if ! grep -q "## E2E Validation" "$CONTRACT"; then
  echo "❌ GATE BLOCKED: E2E Validation spec not found in contract"
  exit 1
fi
```

---

## Step 2: Load Playbooks

```javascript
// Load base E2E concepts
Read("~/.claude/commands/feature/playbooks/_e2e-base.md")

// Load E2E template specific to type
Read("~/.claude/commands/feature/playbooks/{featureType}/e2e.md")

// Load contract with spec
Read({state.contract})  // path from workflow-state.json
// Extract: e2e_type, e2e_spec
```

---

## Step 3: Execute E2E by Type

### IF auto:
1. Run script/Playwright per spec
   ```bash
   {command from spec}
   ```
2. Report result

### IF semi-auto:
1. Trigger (API call per spec)
2. Poll result (max 10x, interval 5s)
   ```javascript
   for (let i = 0; i < 10; i++) {
     const result = await checkCondition();
     if (result.success) break;
     await sleep(5000);
   }
   ```
3. Verify success criteria
4. Report: "E2E Semi-auto: PASSED" or "FAILED: {reason}"

### IF hybrid:
1. Request user action:
   ```javascript
   AskUserQuestion({
     questions: [{
       question: "{action_from_spec}. Respond when done.",
       header: "Manual Action",
       options: [
         { label: "Done", description: "I executed the action" },
         { label: "Can't do it", description: "Problem executing" }
       ],
       multiSelect: false
     }]
   })
   ```
2. User responds "Done"
3. Claude executes spec verifications
4. Report: "E2E Hybrid: PASSED" or "FAILED: {reason}"

---

## Step 4: Self-Healing Loop (IF FAILED)

### 4.1 Classify Failure

| Type | Examples | Action |
|------|----------|--------|
| FIXABLE | Bug in code, timeout config, wrong query | Fix automatically |
| EXTERNAL | Network, service offline, credentials | Report and stop |

### 4.2 Automatic Loop (max 2 attempts)

```
while (failing AND attempts < 2 AND type == FIXABLE):
    1. Analyze cause
    2. Fix code/config/spec
    3. Re-run E2E
    attempts++
```

### 4.3 Escape Hatch (IF still fails)

```javascript
AskUserQuestion({
  questions: [{
    question: "E2E failed after self-healing. What to do?",
    header: "E2E Failed",
    options: [
      { label: "Debug", description: "Execute /debug workflow" },
      { label: "Continue", description: "Mark FAILED and proceed" }
    ],
    multiSelect: false
  }]
})
```

---

## Step 5: Update Contract

```javascript
// Update contract (path from state.contract)
// Change E2E Status: PENDING → PASSED | FAILED
Edit({
  file_path: {state.contract},
  old_string: "**Status:** PENDING",
  new_string: "**Status:** {PASSED | FAILED}"
})
```

---

## Gate (BLOCKING)

```bash
# E2E must have been executed
CONTRACT=$(jq -r '.contract' .claude/workflow-state.json)
if ! grep -q "Status:.*PASSED\|Status:.*FAILED" "$CONTRACT" 2>/dev/null; then
  echo "❌ GATE BLOCKED: E2E Validation not executed"
  exit 1
fi

echo "✅ Gate 07-validation passed"
```

---

## Step 6: Update State

```bash
jq '
  .currentPhase = "08-delivery" |
  .completedPhases += ["07-validation"] |
  .resumeHint = "E2E validated. Next: commit and push" |
  .lastStep = "Step 6: Update State"
' .claude/workflow-state.json > .claude/workflow-state.tmp && mv .claude/workflow-state.tmp .claude/workflow-state.json
```

---

## NEXT PHASE
REQUIRED ACTION: Read ~/.claude/commands/feature/08-delivery.md
