# Phase 2: Investigate

Responsibility: **WHY** the bug happens + **ROOT CAUSE**

---

## Principle

> Fixes correct LOGIC, not filter SYMPTOMS.
> Before proposing FILTER/IGNORE: why is the error generated in the first place?

---

## Step 1: Context

**IF** direct continuation from 01-reproduce: Context already available.
**IF** resuming session: `Read .claude/debug/reproduction.md`

---

## Step 2: Explore Code

```
Grep: bug terms
Glob: files with related names
git log --oneline --grep="fix" -- [suspect files]
```

Identify:
- Files/functions involved
- How errors are handled in this area
- Is there validation that should exist?

---

## Step 3: Flow Tracing

**IF** bug involves incorrect data (null, undefined, invalid format):

ACTION: Read ~/.claude/techniques/flow-tracing.md

---

## Step 4: Hypothesis Generation

ACTION: Read ~/.claude/techniques/hypothesis-generation.md

---

## Step 5: Sequential Thinking

ACTION: Read ~/.claude/techniques/sequential-thinking-config.md

**IF** category = Infra/Deploy:
Consult section "Phase: Investigate" in playbooks/infra.md

---

## Step 6: Validate Root Cause

ACTION: Read ~/.claude/commands/debug/validators/root-cause-validation.md

---

## Step 7: Document Root Cause

ACTION: Read ~/.claude/commands/debug/templates/root-cause-doc.md

---

## Step 8: Checkpoint

```javascript
TodoWrite({
  todos: [
    { content: "Reproduce: bug reproduced", status: "completed", activeForm: "Bug reproduced" },
    { content: "Investigate: root cause validated", status: "completed", activeForm: "Root cause validated" },
    { content: "Fix: implement correction", status: "pending", activeForm: "Implementing fix" }
  ]
})
```

---

## Output

Root cause documented in `.claude/debug/root-cause.md`.

```bash
# Sync context (persistence layer 1)
bash ./scripts/save-context.sh 2>/dev/null || true
```

---

## NEXT PHASE

REQUIRED ACTION: Read ~/.claude/commands/debug/03-fix.md
