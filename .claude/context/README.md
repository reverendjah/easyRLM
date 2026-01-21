# Kakaroto Fields - Persistent Context

This directory contains the **persistent text fields** of the Easy RLM system.

---

## What Is This?

Markdown files that store project context in a structured way.
Claude Code reads these files automatically to "remember" the project between sessions.

---

## Files

| File | Tier | When Loaded | Purpose |
|------|------|-------------|---------|
| `project.md` | 1 - Core | **ALWAYS** | Stack, commands, structure |
| `architecture.md` | 2 - Structural | On demand | Modules, flows, integrations |
| `patterns.md` | 2 - Reference | On demand | Good code examples |
| `knowledge.md` | 3 - Tacit | By keywords | Decisions, pitfalls, history |
| `current.md` | Volatile | On resume | Current session state |

---

## How It Works?

```
SESSION START
     │
     ▼
┌─────────────────┐
│  Read project.md│  ← Basic project context
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Read current.md│  ← Resume previous work (if any)
└────────┬────────┘
         │
         ▼
   DURING WORK
         │
         ▼
┌─────────────────┐
│ Search by       │  ← If task needs architecture, patterns, etc
│ keywords        │
└────────┬────────┘
         │
         ▼
   END OF SESSION
         │
         ▼
┌─────────────────┐
│ Update          │  ← Save state for next session
│ current.md      │
└─────────────────┘
```

---

## Persistence

These files are **versioned with Git**, ensuring:
- Memory between sessions
- Memory between machines
- Change history
- Automatic backup

---

## Maintenance

### When to Edit Manually?

- `project.md` - After initial setup, add missing commands/structure
- `architecture.md` - After important architectural decisions
- `patterns.md` - When creating reusable patterns
- `knowledge.md` - After discovering something non-obvious

### When NOT to Edit?

- `current.md` - Updated automatically by the system

---

## Keywords That Trigger Loading

| Keywords in Request | File Loaded |
|--------------------|-------------|
| architecture, module, flow | `architecture.md` |
| pattern, example, how to | `patterns.md` |
| why, decision, problem | `knowledge.md` |

---

## Recommended Size

| File | Lines |
|------|-------|
| `project.md` | 50-100 |
| `architecture.md` | 100-200 |
| `patterns.md` | 100-300 |
| `knowledge.md` | No limit |
| `current.md` | 20-50 |

**Rule**: The more frequently loaded (Tier 1), the more concise it should be.

---

*Easy RLM System - Recursive Language Models for Claude Code*
