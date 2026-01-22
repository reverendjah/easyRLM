# Phase 6: Self-Evaluation

## Context
Fix committed. Evaluate debug workflow and propose improvements to config.

---

## Step 1: Collect Metrics

```bash
git diff --stat HEAD~1
git log -1 --format="%s"
```

Read (if exist):
- .claude/debug/reproduction.md (how bug was reproduced)
- Files modified by fix

Collect:
- Modified files
- Lines added/removed
- Regression tests created

---

## Step 2: Sequential Thinking #1 - DIAGNOSIS

Use mcp__sequential-thinking__sequentialthinking for:

**Objective:** Identify problems in debug process

### 2.1 Evaluate Criteria (0-100%)

| Criterion | Weight | How to Measure |
|-----------|--------|----------------|
| Reproduction | 25% | Was bug reproduced reliably? |
| Root Cause | 25% | Did 5 Whys reach the real root cause? |
| Minimal Fix | 20% | Was fix minimal and surgical? No over-engineering? |
| Regression | 15% | Was regression test created? |
| Permanence | 10% | Does fix survive restart/deploy? |
| Autonomy | 5% | How many questions to user? (ideal: <=2) |

### 2.2 For Criteria < 80%: Apply 5 Whys

1. Why was the score low?
2. What was the root cause of the process problem?
3. What could have prevented it?
4. What information/rule was missing in the skill?
5. Where should this information be?

**Expected output:** List of {problem, root_cause, ideal_location}

---

## Step 3: Sequential Thinking #2 - SYNTHESIS

Use mcp__sequential-thinking__sequentialthinking again:

**Objective:** Transform diagnostics into actionable changes

For each problem identified in Step 2:

1. **Type of change?**
   - Config: Rule in CLAUDE.md
   - Skill: Gate/validation in debug phase
   - Playbook: Add to category playbook

2. **Which file to edit?**
   - ~/.claude/CLAUDE.md
   - ~/.claude/commands/debug/*.md

3. **Exact diff of change?**
   - Write the exact text to add

4. **Side effects?**
   - Will it affect other bug types?
   - Can it cause false positives?

5. **Priority?**
   - High: Similar bug can happen again
   - Medium: Process improvement
   - Low: Nice-to-have

**Expected output:** List of {type, file, suggested_diff, priority}

---

## Step 4: Propose Improvements to User

For each identified improvement (MAXIMUM 3 per execution):

```javascript
AskUserQuestion({
  questions: [{
    question: "Detected: {process problem}. Cause: {root_cause}. Suggest adding in {file}: '{diff}'. Apply?",
    header: "Improvement",
    options: [
      { label: "Apply", description: "Edit {file} with suggested change" },
      { label: "Ignore", description: "Skip this time, may suggest again" },
      { label: "Never suggest", description: "Add permanent exception" }
    ],
    multiSelect: false
  }]
})
```

### Actions by Response:
- **Apply:** Use Edit tool to modify file
- **Ignore:** Proceed without action
- **Never suggest:** Add to ~/.claude/evaluation-exceptions.json

---

## Step 5: Finalize

Report to user:

```
## Debug Workflow Evaluation

**Final Score:** X% (Reproduction: X%, Root Cause: X%, Fix: X%, Regression: X%, Permanence: X%, Autonomy: X%)

**Improvements Applied:** N
- [list of applied changes]

**Workflow /debug completed.**
```

---

## Inviolable Rules

1. **ALWAYS** execute after successful commit
2. **NEVER** apply change without explicit user approval
3. **MAXIMUM** 3 suggestions per execution (avoid decision fatigue)
4. **PRIORITIZE** high priority problems first
5. **DO NOT** suggest changes if score >= 90% in all criteria

```bash
# Sync context (persistence layer 1) - marks workflow as complete
bash ./scripts/save-context.sh 2>/dev/null || true
```
