# Phase 3: Strategy

## Responsibility
Approve test strategy. **ONLY APPROVAL** in the workflow.

---

## Step 1: Load Inputs

### 1.1 User Criteria (01-understand)
```
Read .claude/interviews/${SLUG}.md → section "## User Acceptance Criteria"
```

### 1.2 Technical Scenarios (02-analyze)
```
Read .claude/analysis/${SLUG}.md → section "## Discovered Technical Scenarios"
```

### 1.3 Feature Type
```
Read .claude/workflow-state.json → field "featureType" (api/ui/service/job)
```

> **Reason:** Ensures data is in context before any processing.

---

## Step 2: Transform User Criteria

Convert criteria into testable scenarios:

| User Criterion | Derived Scenario | Type |
|----------------|------------------|------|
| "works if X" | "X happens" | SUCCESS |
| "fails if Y" | "Y doesn't happen" | FAILURE |

> **Reason:** Normalizes user language to test language.

---

## Step 3: Complement with Failure Analysis

```
Read ~/.claude/techniques/failure-analysis.md
```

Execute ONLY for categories NOT covered by interview + analysis.
Budget: max 3-5 ADDITIONAL scenarios.

> **Reason:** Catches edge cases that user and technical analysis may have missed.

---

## Step 4: E2E Validation Options

Based on feature type, identify viable options:

| Feature Type | Standard E2E | Alternative |
|--------------|--------------|-------------|
| ui | Playwright (auto) | hybrid |
| api | API script (semi-auto) | hybrid |
| service | Integration test (auto) | hybrid |
| job | hybrid | semi-auto |

Record:
- **Recommended option:** {type}
- **Alternative options:** {list}
- **Cost/benefit of each:** {brief}

> **Reason:** ST needs to know E2E options to decide if worth including.
> See: `~/.claude/commands/feature/playbooks/_e2e-base.md` + `playbooks/{type}/e2e.md`

---

## Step 5: Unified Scenario Table

Consolidate ALL scenarios with source and score:

| # | Scenario | Source | Level | Score | Decision |
|---|----------|--------|-------|-------|----------|
| U1 | "{from user}" | interview | Integration | - | TEST |
| T1 | "{from code}" | analysis | Unit | {PxI} | ? |
| FA1 | "{failure analysis}" | technique | Unit | {PxI} | ? |
| E2E1 | "{complete flow}" | e2e-option | E2E | - | ? |

**Level column:** Unit | Integration | E2E
**Decision column:** Filled in Step 6 (ST)

**Rules:**
- Source "interview" → ALWAYS TEST (user criterion)
- Source "analysis/technique" → Apply P×I (Score >= 6 = TEST)
- Source "e2e-option" → Decided in Step 6

> **Reason:** Complete view of ALL test options before reflection.

---

## Step 6: Reflection and Decision (ST)

Use `mcp__sequential-thinking__sequentialthinking`:

1. **Complete inventory** - How many scenarios do I have? From what sources?
2. **Coverage by level** - How many Unit vs Integration vs E2E?
3. **User criteria** - Are all covered? How?
4. **Technical scenarios** - Which have Score >= 6? Which < 6?
5. **Is E2E worth it?** - Cost vs benefit for this feature
6. **Final decision** - For each scenario: TEST or NOT TEST
7. **Justification** - Why each decision? Mitigation for excluded?

`totalThoughts`: 7

**Output:** Unified Table with "Decision" column filled

> **Reason:** ST now has ALL data to decide complete strategy.

---

## Step 7: Build Unified Proposal

Present consolidated decision:

```markdown
### Tests to be implemented

| # | Scenario | Source | Level | Test |
|---|----------|--------|-------|------|
| U1 | "{user criterion}" | interview | Integration | `it('...')` |
| T1 | "{technical scenario}" | analysis | Unit | `it('...')` |
| E2E1 | "{complete flow}" | e2e-option | E2E | `test('...')` |

### Scenarios NOT tested (with justification)

| # | Scenario | Score | Justification | Mitigation | File |
|---|----------|-------|---------------|------------|------|
| FA2 | "{edge case}" | 4 | Low probability | try/catch | handler.ts:45 |

### E2E Validation Spec

**Type:** {auto | semi-auto | hybrid}

{IF auto}
**Script/Tool:** {playwright | functional-validator | integration test}
**Scenario:** {Given/When/Then}
**Command:** `{npm run test:e2e or similar}`

{IF semi-auto}
**Trigger:** {POST /api/endpoint or command}
**Claude Verifications:**
- [ ] Expected response status/body
- [ ] Query DB: `{collection}.where(...)`
- [ ] Check logs: `grep "{pattern}"`

{IF hybrid}
**User Action:**
- [ ] {detailed description of what user should do}

**Claude Verifications:**
- [ ] Query DB: `{collection/table}.where(...)`
- [ ] Check logs: `grep "{pattern}"`
- [ ] Confirm side effect: `GET /api/{endpoint}`

**Success Criteria:**
- [ ] {verifiable condition}

### Strategy Summary

- **Unit tests:** {N} scenarios
- **Integration tests:** {N} scenarios
- **E2E:** {YES/NO} - {justification}
- **User criteria coverage:** 100%
```

> **Reason:** User sees unified and complete proposal, not fragmented.

---

## Step 8: Approval (AUQ)

```javascript
AskUserQuestion({
  questions: [{
    question: "Do these tests cover your needs?",
    header: "Approval",
    options: [
      { label: "Yes, they cover", description: "Proceed with autonomous implementation" },
      { label: "Missing scenario", description: "I'll describe what's missing" },
      { label: "Change E2E", description: "I want to change E2E strategy" },
      { label: "Change type", description: "I prefer another test type" }
    ],
    multiSelect: false
  }]
})
```

### IF "Missing scenario" or "Change type":
1. Collect feedback
2. Adjust proposal
3. Repeat approval

### IF "Change E2E":
1. Present E2E alternatives from Step 4
2. Adjust E2E spec
3. Confirm and proceed

---

## Step 9: Generate Contract Lock

After approval, generate IMMUTABLE contract.

### 9.1 Save Contract
```
Write .claude/contracts/{slug}.md
```

### 9.2 Format
```markdown
# Contract: {feature}

**Status:** LOCKED
**Approved at:** {YYYY-MM-DD HH:MM}

## Failure Scenarios (Brainstorm)

| # | Scenario | Category | P | I | Score | Decision |
|---|----------|----------|---|---|-------|----------|
| 1 | {scenario} | INPUT | High | High | 9 | TEST |
| 2 | {scenario} | DEPENDENCY | Medium | High | 6 | TEST |
| 3 | {scenario} | STATE | Low | High | 3 | MITIGATE |

## Approved Criteria (Tests)

| # | Criterion | Source | Level | Scenario Ref | Test | Status |
|---|-----------|--------|-------|--------------|------|--------|
| 1 | "[user criterion]" | interview | Integration | - | `it('...')` | LOCKED |
| 2 | "[technical scenario]" | analysis | Unit | #T1 | `it('...')` | LOCKED |

## Excluded Scenarios (with Justification)

| # | Scenario Ref | Score | Why NOT test | Mitigation | File |
|---|--------------|-------|--------------|------------|------|
| 3 | #3 | 3 | {justification} | {mitigation} | {file:line} |

## E2E Validation

**Type:** {auto | semi-auto | hybrid}
**Status:** PENDING

{complete spec per Step 7}

## IMMUTABILITY

> Scope change requires new approval and contract re-generation.
```

---

## Gate (BLOCKING)

```bash
SLUG=$(jq -r '.feature' .claude/workflow-state.json 2>/dev/null)

# Pre-conditions
test -f ".claude/interviews/${SLUG}.md" || { echo "❌ Pre: interview doesn't exist"; exit 1; }
test -f ".claude/analysis/${SLUG}.md" || { echo "❌ Pre: analysis doesn't exist"; exit 1; }

# Post-condition: Contract
test -f ".claude/contracts/${SLUG}.md" || { echo "❌ Contract not found: .claude/contracts/${SLUG}.md"; exit 1; }
grep -q "## Approved Criteria" ".claude/contracts/${SLUG}.md" || { echo "❌ Contract without approved criteria"; exit 1; }
grep -q "## E2E Validation" ".claude/contracts/${SLUG}.md" || { echo "❌ Contract without E2E Validation spec"; exit 1; }
grep -q "**Status:** LOCKED" ".claude/contracts/${SLUG}.md" || { echo "❌ Contract not LOCKED"; exit 1; }

echo "✅ Gate 03-strategy passed"
```

**IMPORTANT:** This is the ONLY stop in the workflow. After here, execution is AUTONOMOUS.

---

## Step 10: Update Workflow State

```bash
if command -v jq &> /dev/null; then
  jq '
    .currentPhase = "04-red" |
    .completedPhases += ["03-strategy"] |
    .resumeHint = "Tests APPROVED. Next: write RED tests, execute autonomously" |
    .lastStep = "Step 10: Update State" |
    .contract = (".claude/contracts/" + .feature + ".md")
  ' .claude/workflow-state.json > .claude/workflow-state.tmp && mv .claude/workflow-state.tmp .claude/workflow-state.json
else
  echo "Update .claude/workflow-state.json: currentPhase=04-red, add 03-strategy to completedPhases"
fi

# Sync context (persistence layer 1)
bash ./scripts/save-context.sh 2>/dev/null || true
```

---

## NEXT PHASE
REQUIRED ACTION: Read ~/.claude/commands/feature/04-red.md
