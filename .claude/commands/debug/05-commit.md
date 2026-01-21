# Phase 5: Commit & Push

## Context
Bug resolved, verify passed. Commit and push AUTONOMOUSLY.

---

## Step 1: Check Changes

```bash
git status
```

**If no changes:** Report "Nothing to commit" → END

---

## Step 2: Commit

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix: {description of resolved bug in english}

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

**Always prefix `fix:`** - workflow is debug.

---

## Step 3: Push

```bash
git push
```

**If fails:** Report error to user.

---

## Step 4: Memory Sync

Sync knowledge acquired during debug (NOT bugs - those are ephemeral).

```javascript
Task({
  subagent_type: "memory-sync",
  prompt: "Sync knowledge graph after debug. Agent will auto-skip if trivial change. IMPORTANT: DO NOT save the bug itself. Save only: discovered patterns, documented procedures, architectural decisions.",
  description: "Sync memory graph"
})
```

**What to save:**
- New pattern discovered during investigation
- Complex flow that took time to understand
- Debug procedure that can be reused

**What NOT to save:**
- The bug itself (fix is in code)
- Specific error details
- Stack traces or logs

---

## Step 5: Final Checkpoint

```javascript
TodoWrite({
  todos: [
    { content: "Reproduce: bug reproduced", status: "completed", activeForm: "Bug reproduced" },
    { content: "Investigate: root cause identified", status: "completed", activeForm: "Root cause identified" },
    { content: "Fix: correction implemented", status: "completed", activeForm: "Fix implemented" },
    { content: "Verify: quality gates passing", status: "completed", activeForm: "Quality gates passed" },
    { content: "Commit: committed and pushed", status: "completed", activeForm: "Committed and pushed" },
    { content: "Memory: knowledge synced", status: "completed", activeForm: "Knowledge synced" }
  ]
})
```

---

## Step 6: Confirm

```bash
git log --oneline -1
```

Report to user: fix committed and pushed.

---

## Rules

1. **1 fix = 1 commit**
2. **Always `fix:` as prefix**
3. **Message in english**
4. **NEVER** --force push
5. **NEVER** commit if verify failed

---

## NEXT PHASE
REQUIRED ACTION: Read ~/.claude/commands/debug/06-evaluate.md
