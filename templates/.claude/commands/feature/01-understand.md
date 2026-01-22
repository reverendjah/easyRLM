# Phase 1: Understand

## Responsibility
Collect requirements with the USER.

---

## Step 0: Detect Existing Workflow

```bash
if [ -f .claude/workflow-state.json ]; then
  phase=$(jq -r '.currentPhase' .claude/workflow-state.json 2>/dev/null)
  if [ "$phase" != "COMPLETED" ]; then
    echo "Existing workflow: $phase"
    echo "To continue: Read file in currentPhaseFile"
    echo "To start new: proceed (state will be overwritten)"
  fi
fi
```

---

## Step 1: Analyze Request

Identify in $ARGUMENTS:
- Requested feature
- Key terms for search
- Probable area (api/, components/, services/)

---

## Step 2: Gather Context

### 2.1 Memory (on demand)
```
mcp__memory__search_nodes({ query: "<feature-terms>" })
```

### 2.2 Codebase
```
Grep: terms in <area>/
Read: directly related files
```

---

## Step 3: Reflection (ST)

Use `mcp__sequential-thinking__sequentialthinking`:

1. **What I discovered** - Context synthesis
2. **What I can still discover** - Gaps I can fill
3. **What is the MVP?** - MINIMUM scope that solves it
4. **What ONLY the user knows** - Product decisions
5. **Minimal questions for user** - Only essential ones

`totalThoughts`: 5

---

## Step 4: Questions to User (AUQ)

Use `AskUserQuestion` with 2-4 consolidated questions.

**Typical questions (adapt):**
- **Problem**: What problem does it solve? (Efficiency/Functionality/UX)
- **Scope**: MVP or complete feature?
- **Design**: Reference or existing patterns?
- **Priority**: What is most important?

```javascript
AskUserQuestion({
  questions: [
    {
      question: "What is the main problem this feature solves?",
      header: "Problem",
      options: [
        { label: "Efficiency", description: "Automate/accelerate process" },
        { label: "Functionality", description: "Add new capability" },
        { label: "UX", description: "Improve existing experience" }
      ],
      multiSelect: false
    },
    // ... other questions
  ]
})
```

---

## Step 5: Acceptance Criteria (AUQ)

Collect from user how to validate success/failure:

```javascript
AskUserQuestion({
  questions: [
    {
      question: "How would you know it's working?",
      header: "Validation",
      options: [
        { label: "Specific output", description: "Returns X, displays Y on screen" },
        { label: "Side effect", description: "Saves to DB, posts to social network" },
        { label: "Absence of error", description: "Doesn't break, doesn't log error" }
      ],
      multiSelect: true
    },
    {
      question: "What would be an unacceptable failure?",
      header: "Critical Failure",
      options: [
        { label: "Corrupted data", description: "Saves wrong, loses data" },
        { label: "Silent error", description: "Fails without notifying user" },
        { label: "Duplicate action", description: "Posts 2x, charges 2x" }
      ],
      multiSelect: true
    }
  ]
})
```

---

## Step 6: Persist Interview

### 6.1 Generate slug
`{first-word}-{YYYY-MM-DD}.md`

### 6.2 Save
```
Write .claude/interviews/{slug}.md
```

### 6.3 Format
```markdown
# Interview: {feature}

## Request (Step 1)
- **Feature:** {$ARGUMENTS}
- **Area:** {api/components/services}
- **Key terms:** {list}

## Discovery (Step 2)
- **Services:** {list}
- **Patterns:** {list}
- **Memory:** {relevant entities or "N/A"}

## Reflection (Step 3)
- **Scope:** {MVP | Complete}
- **Implicit Decisions:**
  | Decision | Justification |
  |----------|---------------|
  | {what was assumed} | {why} |

## Questions and Answers (Step 4)
| # | Question | Answer | Impact |
|---|----------|--------|--------|

## User Acceptance Criteria (Step 5)
| # | Criterion | Type | Verification |
|---|-----------|------|--------------|
| U1 | "{specific criterion}" | SUCCESS | {output/side-effect/absence} |
| U2 | "{specific criterion}" | FAILURE | {what CANNOT happen} |
```

---

## Gate (BLOCKING)

```bash
SLUG=$(jq -r '.feature' .claude/workflow-state.json 2>/dev/null)
[ -z "$SLUG" ] || [ "$SLUG" = "null" ] && { echo "❌ workflow-state.json without defined feature"; exit 1; }

INTERVIEW=".claude/interviews/${SLUG}.md"

test -f "$INTERVIEW" || { echo "❌ Interview not found: $INTERVIEW"; exit 1; }

# Required sections (flow order)
grep -q "## Request" "$INTERVIEW" || { echo "❌ Interview without Request"; exit 1; }
grep -q "## Discovery" "$INTERVIEW" || { echo "❌ Interview without Discovery"; exit 1; }
grep -q "## Questions and Answers" "$INTERVIEW" || { echo "❌ Interview without Q&A"; exit 1; }
grep -q "## User Acceptance Criteria" "$INTERVIEW" || { echo "❌ Interview without Criteria"; exit 1; }

# Validate that Criteria has content (not just header)
grep -A1 "## User Acceptance Criteria" "$INTERVIEW" | grep -q "| U" || { echo "❌ Criteria without entries (needs U1, U2...)"; exit 1; }

echo "✅ Gate 01-understand passed"
```

---

## Step 7: Persist Workflow State

```bash
mkdir -p .claude
cat > .claude/workflow-state.json << 'EOF'
{
  "workflow": "feature",
  "feature": "${FEATURE_SLUG}",
  "currentPhase": "02-analyze",
  "completedPhases": ["01-understand"],
  "startedAt": "${TIMESTAMP}",
  "resumeHint": "Interview collected. Next: triage type (api/ui/service/job) and load playbook",
  "lastStep": "Step 7: Persist State",
  "interview": ".claude/interviews/${FEATURE_SLUG}.md",
  "analysis": null,
  "contract": null
}
EOF
```

**Note:** Replace `${FEATURE_SLUG}` with actual slug and `${TIMESTAMP}` with `date -u +%Y-%m-%dT%H:%M:%SZ`

```bash
# Sync context (persistence layer 1)
bash ./scripts/save-context.sh 2>/dev/null || true
```

---

## NEXT PHASE
REQUIRED ACTION: Read ~/.claude/commands/feature/02-analyze.md
