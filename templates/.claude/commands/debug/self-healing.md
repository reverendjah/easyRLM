# Self-Healing Loop

## Context
Triggered when quality gates fail OR bug still reproduces OR fix is not permanent.

---

## Step 1: Attempt Control

```
CURRENT_ATTEMPT: {1/2/3}
```

**IF** attempt > 3:
- STOP immediately
- Report to user with full analysis
- Document what was attempted and why it failed
- DO NOT continue autonomously

---

## Step 2: Failure Analysis (Sequential Thinking)

Before trying to fix, UNDERSTAND why it failed:

```javascript
mcp__sequential-thinking__sequentialthinking({
  thought: "Analyzing verification failure...",
  nextThoughtNeeded: true,
  thoughtNumber: 1,
  totalThoughts: 5
})
```

Required thoughts:

1. **"What exactly did my fix change?"**
   - List modified files and lines

2. **"What is the failure telling me?"**
   - If test: which assertion failed?
   - If build: which compilation error?
   - If reproduction: which symptom persists?

3. **"Was my root cause correct?"**
   - Revisit `.claude/debug/root-cause.md`
   - Does the evidence still hold?

4. **"What did I miss in the analysis?"**
   - Is there another code path affected?
   - Is there an unconsidered side effect?

5. **"What is the next action?"**
   - Determine where to go back

---

## Step 3: Decision Gate

Based on the analysis, choose ONE option:

| Situation | Action |
|-----------|--------|
| Incomplete fix (missing part) | Go back to 03-fix, complete |
| Partial root cause (lacked depth) | Go back to 02-investigate Step 5 |
| Wrong root cause (hypothesis refuted) | Go back to 02-investigate Step 4 |
| Insufficient reproduction | Go back to 01-reproduce |

---

## Step 4: Document Attempt

Add to `.claude/debug/attempts.md`:

```markdown
## Attempt {N}

**Date:** {timestamp}
**Failed at:** Quality Gate / Reproduction / Permanence

**What was attempted:**
{fix description}

**Why it failed:**
{analysis via Sequential Thinking}

**Next action:**
{where to go back and why}
```

---

## Step 5: Increment and Continue

```
CURRENT_ATTEMPT += 1
```

Execute the action defined in the Decision Gate.
