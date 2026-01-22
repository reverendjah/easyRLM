# Context Refresh Helper

> **AUTOMATIC** - Do not ask user permission. Refresh silently when needed.

## When to Trigger Refresh

| Trigger | Action |
|---------|--------|
| Error: "file not found" | Re-grep for file location |
| Error: "function undefined" | Re-scan module exports |
| Error: "type mismatch" | Re-load type definitions |
| Working across 3+ modules | Expand context window |
| Assumption invalidated | Re-analyze affected area |

---

## Refresh Protocol

### Step 1: Detect Staleness

```
IF error contains:
  - "not found"/"doesn't exist" → STALE_FILE
  - "undefined"/"not a function" → STALE_EXPORT
  - "type error"/"cannot assign" → STALE_TYPES
  - "mismatch"/"inconsistent" → STALE_ASSUMPTION
```

### Step 2: Targeted Re-Query

```
STALE_FILE:
  Grep "{filename}" in project root
  Update working context with new path

STALE_EXPORT:
  Read {module}/index.ts or {module}/index.js
  List all exports

STALE_TYPES:
  Read .claude/context/architecture.md (if not loaded)
  Grep "type {TypeName}" OR "interface {TypeName}"

STALE_ASSUMPTION:
  Re-read .claude/context/knowledge.md
  Search for related decisions
```

### Step 3: Update Knowledge (If Significant)

IF refresh revealed non-obvious information:

```markdown
# Append to .claude/context/knowledge.md

## {topic} ({date})
**Discovery:** {what was found}
**Source:** {file:line}
**Implication:** {how this affects development}
```

---

## Checkpoint Markers

Insert these markers in workflow state for recovery:

```json
{
  "contextRefresh": {
    "lastRefresh": "2024-01-15T10:30:00Z",
    "refreshCount": 2,
    "staleTriggers": ["STALE_FILE", "STALE_TYPES"],
    "recoverable": true
  }
}
```

---

## Integration Points

### In 02-analyze

After Step 3 (Search Existing Code):
```
IF grep returns 0 results for expected pattern:
  TRIGGER: context-refresh (STALE_FILE)
  RE-RUN: Step 3 with broader search
```

### In 05-green

After each test failure (Step 3 loop):
```
IF test failure mentions "not found" or "undefined":
  TRIGGER: context-refresh (STALE_EXPORT)
  DO NOT count as attempt
  RE-RUN: failing test
```

### In debug/02-investigate

After stack trace analysis:
```
IF file in stack trace not in current context:
  TRIGGER: context-refresh (expand context)
  LOAD: missing files into working set
```

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────┐
│  CONTEXT REFRESH - AUTONOMOUS PROTOCOL                  │
│                                                         │
│  1. Detect staleness indicator in error/feedback        │
│  2. Targeted re-query (grep/read specific files)        │
│  3. Update knowledge.md if discovery is significant     │
│  4. Continue with refreshed context                     │
│                                                         │
│  NEVER ASK USER - REFRESH AUTOMATICALLY                 │
└─────────────────────────────────────────────────────────┘
```
