# Phase 9: Evaluate

## Responsibility
Workflow self-evaluation and propose improvements.

---

## Step 1: Collect Metrics

```bash
git diff --stat HEAD~1
git log -1 --format="%s"
```

---

## Step 2: Sequential Thinking #1 - DIAGNOSIS

Use `mcp__sequential-thinking__sequentialthinking`:

| Criterion | Weight | How to Measure |
|-----------|--------|----------------|
| Completeness | 40% | All items implemented? |
| Quality | 20% | Review passed clean? |
| Tests | 15% | Adequate coverage? |
| Build | 10% | Passed first time? |
| Autonomy | 10% | How many questions? (ideal <=1) |
| Docs | 5% | Spec reflects implementation? |

For criteria < 80%: Apply 5 Whys

`totalThoughts`: 5-7

---

## Step 3: Sequential Thinking #2 - SYNTHESIS

For each problem identified:

1. Type of change? (Config/Skill/Pattern)
2. Which file to edit?
3. Exact diff?
4. Side effects?
5. Priority?

`totalThoughts`: 3-5

---

## Step 4: Propose Improvements (AUQ)

For identified improvements (max 3):

```javascript
AskUserQuestion({
  questions: [{
    question: "Detected: {problem}. Cause: {cause}. Suggest: {diff}. Apply?",
    header: "Improvement",
    options: [
      { label: "Apply", description: "Edit file" },
      { label: "Ignore", description: "Skip this time" },
      { label: "Never suggest", description: "Add exception" }
    ],
    multiSelect: false
  }]
})
```

**Actions:**
- **Apply:** Edit tool
- **Ignore:** Proceed
- **Never suggest:** Add to evaluation-exceptions.json

---

## Step 5: Final Report

```markdown
## Workflow Complete

**Final Score:** X%
- Completeness: X%
- Quality: X%
- Tests: X%
- Build: X%
- Autonomy: X%

**Commit:** {hash} {message}

**Improvements Applied:** N
- [list]

**Workflow /feature completed.**
```

---

## Gate (BLOCKING)

```bash
# Verify that commit exists
git log -1 --format="%s" | grep -qE "^(feat|fix|refactor|test|docs):" || { echo "❌ Commit not found"; exit 1; }

# Verify E2E was executed (in contract)
SLUG=$(jq -r '.feature' .claude/workflow-state.json 2>/dev/null)
grep -qE "Status:.*(PASSED|FAILED)" ".claude/contracts/${SLUG}.md" 2>/dev/null || { echo "❌ E2E not executed"; exit 1; }

echo "✅ Gate 09-evaluate passed"
```

---

## Step 6: Finalize Workflow State

```bash
if command -v jq &> /dev/null; then
  jq '
    .currentPhase = "COMPLETED" |
    .completedPhases += ["09-evaluate"] |
    .completedAt = "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'" |
    .resumeHint = "Workflow COMPLETE. No action needed." |
    .lastStep = "Step 6: Finalize State"
  ' .claude/workflow-state.json > .claude/workflow-state.tmp && mv .claude/workflow-state.tmp .claude/workflow-state.json
else
  echo "Update .claude/workflow-state.json: currentPhase=COMPLETED, all phases complete"
fi

echo "✅ Workflow /feature COMPLETE"
cat .claude/workflow-state.json
```

### Archive State File (Optional)

```bash
# Move to history after successful completion
FEATURE_SLUG=$(jq -r '.feature' .claude/workflow-state.json)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p .claude/workflow-history
mv .claude/workflow-state.json ".claude/workflow-history/${FEATURE_SLUG}-${TIMESTAMP}.json"
```
