# Phase 8: Delivery

## Responsibility
Deliver validated code (commit + push + memory sync).

---

## Step 1: Check State

```bash
git status
git diff --stat
```

---

## Step 2: Commit

```bash
git add -A
git commit -m "$(cat <<'EOF'
{type}: {concise description in english}

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

**Types:** feat, fix, refactor, docs, test

---

## Step 3: Push

```bash
git push
```

---

## Step 4: Memory Sync

```javascript
Task({
  subagent_type: "memory-sync",
  prompt: "Sync knowledge graph. Skip if trivial.",
  description: "Sync memory graph"
})
```

---

## Gate (BLOCKING)

```bash
# 1. Commit must exist with valid format
git log -1 --format="%s" | grep -qE "^(feat|fix|refactor|test|docs):" || {
  echo "❌ GATE BLOCKED: Commit not created or invalid format"
  exit 1
}

# 2. Push must be done (remote branch updated)
git status | grep -q "Your branch is up to date\|nothing to commit" || {
  echo "⚠️ WARNING: Local changes not pushed"
}

echo "✅ Gate 08-delivery passed"
```

---

## Step 5: Update State

```bash
jq '
  .currentPhase = "09-evaluate" |
  .completedPhases += ["08-delivery"] |
  .resumeHint = "Feature delivered. Next: workflow self-evaluation" |
  .lastStep = "Step 5: Update State"
' .claude/workflow-state.json > .claude/workflow-state.tmp && mv .claude/workflow-state.tmp .claude/workflow-state.json
```

---

## NEXT PHASE
REQUIRED ACTION: Read ~/.claude/commands/feature/09-evaluate.md
