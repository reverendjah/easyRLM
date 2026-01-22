# Phase 1: Reproduce

Responsibility: **WHERE** is the bug + **HOW** to reproduce + **CONCRETE** evidence

---

## Step 1: Triage

Classify the bug by keywords in $ARGUMENTS:

| Category | Keywords |
|----------|----------|
| Backend/Service | service, function, null, undefined, data, firestore, db, returns |
| API/Endpoint | endpoint, API, request, response, 4xx, 5xx, validation, handler |
| UI/Frontend | UI, component, renders, screen, button, state, react, tsx |
| Job/Cron | job, cron, schedule, didn't run, analytics, executor |
| Integration | credential, token, auth, OAuth, secret, external API |
| Test | test, fails, assertion, mock, spec |
| Infra/Deploy | VM, startup, env, terraform, deploy, container, docker, GCP, missing |

**IF** no keyword match → Default: **Backend/Service**

```
TRIAGE:
Keywords found: [...]
Category: [Backend/API/UI/Job/Integration/Test/Infra]
```

---

## Step 2: Load Context

```
mcp__memory__search_nodes({ query: "config" })
mcp__memory__search_nodes({ query: "<bug-terms>" })
```

---

## Step 3: Quick Context

### 3.1 Production Logs

**IF** `.claude/debug-logs.json` exists and `enabled=true`:
```bash
{value from commands.quick}
```

### 3.2 Basic Exploration

```
Grep: bug terms in services/, api/, cron/, components/
Glob: files with related names
```

```
LOCATION:
Candidate files: [file1.ts, file2.ts]
Suspect functions: [function1(), function2()]
```

---

## Step 4: Execute Playbook

ACTION: Read ~/.claude/commands/debug/playbooks/{category}.md

| Category | Playbook |
|----------|----------|
| Backend/Service | backend.md |
| API/Endpoint | api.md |
| UI/Frontend | ui.md |
| Job/Cron | job.md |
| Integration | integration.md |
| Test | test.md |
| Infra/Deploy | infra.md |

---

## Step 5: Create Artifact

ACTION: Read ~/.claude/commands/debug/templates/diagnosis-script.md

---

## Step 6: Reproduction Gate

ACTION: Read ~/.claude/commands/debug/validators/evidence-requirements.md

---

## Step 7: Persist Reproduction

ACTION: Read ~/.claude/commands/debug/templates/reproduction-doc.md

---

## Step 8: Checkpoint

```javascript
TodoWrite({
  todos: [
    { content: "Reproduce: triage + playbook", status: "completed", activeForm: "Bug triaged" },
    { content: "Reproduce: artifact + evidence", status: "completed", activeForm: "Evidence collected" },
    { content: "Investigate: analyze root cause", status: "pending", activeForm: "Analyzing root cause" }
  ]
})
```

---

## Output

Bug reproduced with evidence in `.claude/debug/reproduction.md`.

```bash
# Sync context (persistence layer 1)
bash ./scripts/save-context.sh 2>/dev/null || true
```

---

## NEXT PHASE

REQUIRED ACTION: Read ~/.claude/commands/debug/02-investigate.md
