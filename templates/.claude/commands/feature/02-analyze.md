# Phase 2: Analyze

## Responsibility
Explore codebase and determine test strategy. INTERNAL phase (no user interaction).

---

## Step 1: Type Triage

Analyze feature and classify:

| Keyword | Type | Playbook |
|---------|------|----------|
| endpoint, handler, route, API | api | playbooks/api/ |
| component, page, form, modal, hook | ui | playbooks/ui/ |
| service, util, transform, validate | service | playbooks/service/ |
| cron, job, scheduler, executor | job | playbooks/job/ |

**IF multiple types:** Choose the DOMINANT one (where most code will be).

---

## Step 2: Load Playbook

```
Read ~/.claude/commands/feature/playbooks/{type}/analyze.md
```

The playbook defines:
- Where code goes
- Production pattern
- Testability criteria

---

## Step 3: Search Existing Code

### 3.1 Similar Patterns
```
Grep: terms in {playbook-location}/
```

### 3.2 Reusable Code
| Need | Existing Code | Action |
|------|---------------|--------|
| [what is needed] | [file:line] | Reuse/Extend/Create |

---

## Step 4: Map Mocks

### 4.1 Check Existing
```
Read test-utils/mocks/README.md
```

### 4.2 Verify Availability
| Service | Mock Exists? | Action |
|---------|--------------|--------|
| Database | Check | - |
| [external] | Check | Create if needed |

---

## Step 5: Evaluate Testability

Based on loaded playbook:

| Test Type | Required? | Reason |
|-----------|-----------|--------|
| Unit | {from playbook} | {reason} |
| Integration | {from playbook} | {reason} |
| E2E | {from playbook} | {reason} |

---

## Step 6: Discovered Technical Scenarios

Based on exploration (Steps 3-5), identify EVIDENT failure scenarios in code.

### 6.1 Existing Code Analysis

For each dependency/input found, verify:
- Is there error handling? (try/catch, .catch, fallback)
- Is there validation? (Zod, type guards)
- Is there retry/circuit breaker?

### 6.2 Document Scenarios

| # | Scenario | Category | Source | Handled? |
|---|----------|----------|--------|----------|
| T1 | {evident scenario} | {INPUT/DEPENDENCY/STATE} | {file:line} | Yes/No |

**Categories**: INPUT, DEPENDENCY, STATE, ENVIRONMENT

> **Rule:** Document ONLY EVIDENT scenarios from code.

---

## Step 7: Persist Analysis

### 7.1 Save
```
Write .claude/analysis/{slug}.md
```

### 7.2 Format
```markdown
# Analysis: {feature}

## Metadata
- **Type:** {api/ui/service/job}
- **Playbook:** {file}

## Mapped Mocks
| Service | Exists? | Action |
|---------|---------|--------|

## Existing Tests
| Pattern | Files |
|---------|-------|

## Discovered Technical Scenarios
| # | Scenario | Category | Source | Handled? |
|---|----------|----------|--------|----------|
```

---

## Gate (BLOCKING)

```bash
SLUG=$(jq -r '.feature' .claude/workflow-state.json 2>/dev/null)

# Pre-condition
test -f ".claude/interviews/${SLUG}.md" || { echo "❌ Pre-condition failed: interview doesn't exist"; exit 1; }

# Post-condition
test -f ".claude/analysis/${SLUG}.md" || { echo "❌ Analysis not found: .claude/analysis/${SLUG}.md"; exit 1; }
grep -q "## Metadata" ".claude/analysis/${SLUG}.md" || { echo "❌ Incomplete analysis (missing Metadata)"; exit 1; }

echo "✅ Gate 02-analyze passed"
```

**Note:** This phase does NOT stop. Automatic execution to 03-strategy.

---

## Step 8: Update Workflow State

```bash
if command -v jq &> /dev/null; then
  jq '
    .currentPhase = "03-strategy" |
    .completedPhases += ["02-analyze"] |
    .resumeHint = "Analysis complete. Next: present proposed tests for approval (ONLY stop)" |
    .lastStep = "Step 8: Update State" |
    .analysis = (".claude/analysis/" + .feature + ".md")
  ' .claude/workflow-state.json > .claude/workflow-state.tmp && mv .claude/workflow-state.tmp .claude/workflow-state.json
else
  echo "Update .claude/workflow-state.json: currentPhase=03-strategy, add 02-analyze to completedPhases"
fi
```

---

## NEXT PHASE
REQUIRED ACTION: Read ~/.claude/commands/feature/03-strategy.md
