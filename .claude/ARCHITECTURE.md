# Claude Code Configuration Architecture

This document describes the Claude Code configuration architecture, optimized for **maximum autonomy** and **minimal context**.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLAUDE CODE CONFIGURATION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ~/.claude/ (GLOBAL)                    project/.claude/ (LOCAL)           │
│   ━━━━━━━━━━━━━━━━━━━                    ━━━━━━━━━━━━━━━━━━━━━━━            │
│                                                                             │
│   ┌─────────────┐                        ┌─────────────┐                    │
│   │  CLAUDE.md  │ ◄──── inherits ───────►│  CLAUDE.md  │                    │
│   │   (rules)   │                        │  (project)  │                    │
│   └─────────────┘                        └─────────────┘                    │
│          │                                      │                           │
│          ▼                                      ▼                           │
│   ┌─────────────┐                        ┌─────────────┐                    │
│   │  commands/  │                        │  commands/  │                    │
│   │  (skills)   │                        │  (skills)   │                    │
│   └─────────────┘                        └─────────────┘                    │
│          │                                      │                           │
│          ▼                                      │                           │
│   ┌─────────────┐                               │                           │
│   │   agents/   │ ◄─── called by ──────────────┘                           │
│   │ (subagents) │                                                           │
│   └─────────────┘                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Principle: Minimal Context Per Layer

```
                    ┌───────────────────────┐
                    │     CLAUDE.md         │  ~25 lines
                    │  (essential rules)    │  Loaded ALWAYS
                    └───────────┬───────────┘
                                │
                    Trigger: "/feature" or "/debug"
                                │
                                ▼
                    ┌───────────────────────┐
                    │    commands/*.md      │  ~20 lines
                    │   (orchestrators)     │  Loaded on demand
                    └───────────┬───────────┘
                                │
                    Chained reading: each phase points to next
                                │
                                ▼
                    ┌───────────────────────┐
                    │  commands/X/0N-*.md   │  ~100-150 lines
                    │     (phases)          │  Loaded 1 at a time
                    └───────────┬───────────┘
                                │
                    Invocation via Task tool
                                │
                                ▼
                    ┌───────────────────────┐
                    │     agents/*.md       │  ~200-300 lines
                    │   (specialists)       │  Loaded isolated
                    └───────────────────────┘
```

**Why this matters:**
- Claude doesn't load ALL the system at once
- Each layer is read only when necessary
- Reduces tokens consumed per request
- Allows larger instructions without overhead

---

## File Hierarchy

### Global (~/.claude/)

```
~/.claude/
├── CLAUDE.md                 # Global rules (all sessions)
├── ARCHITECTURE.md           # This file
│
├── commands/                 # Skills available via /skill
│   ├── feature.md           # /feature - orchestrator
│   ├── feature/
│   │   ├── 01-understand.md # Phase 1: understand requirements
│   │   ├── 02-analyze.md    # Phase 2: internal triage
│   │   ├── 03-strategy.md   # Phase 3: test strategy
│   │   ├── 04-red.md        # Phase 4: write tests
│   │   ├── 05-green.md      # Phase 5: implementation
│   │   ├── 06-quality.md    # Phase 6: quality gate
│   │   ├── 07-validation.md # Phase 7: E2E validation
│   │   ├── 08-delivery.md   # Phase 8: commit & push
│   │   └── 09-evaluate.md   # Phase 9: self-evaluation
│   │
│   ├── debug.md             # /debug - orchestrator
│   ├── debug/
│   │   ├── 01-reproduce.md  # Phase 1: reproduce bug
│   │   ├── 02-investigate.md # Phase 2: 5 Whys
│   │   ├── 03-fix.md        # Phase 3: minimal fix
│   │   ├── 04-verify.md     # Phase 4: confirm fix
│   │   ├── 05-commit.md     # Phase 5: commit & push
│   │   └── 06-evaluate.md   # Phase 6: self-evaluation
│   │
│   └── gate.md              # /gate - complete quality gate
│
├── agents/                   # Specialized subagents (8 agents)
│   ├── code-reviewer.md     # Security/typing review + auto-fix
│   ├── test-fixer.md        # Tests + auto-fix
│   ├── functional-validator.md # Functional validation
│   ├── code-simplifier.md   # Clarity + DRY + complexity reduction
│   ├── memory-sync.md       # Syncs MCP Memory
│   ├── terraform-validator.md # Validates env vars
│   ├── context-indexer.md   # First-time project indexing
│   └── context-manager.md   # RLM context management
│
└── *-defaults.json           # Default configs for agents
```

### Local (project/.claude/)

```
project/.claude/
├── commands/                 # Project-specific skills
│   └── *.md                 # Ex: deploy.md, test-e2e.md, etc.
│
├── specs/                    # Specs generated by /feature
│   ├── {slug}.md            # Spec with descriptive name
│   └── current.md           # Pointer to active spec
│
├── plans/                    # Plans generated by /feature
│   ├── {slug}.md            # Plan with same slug as spec
│   └── current.md           # Pointer to active plan
│
├── context/                  # Kakaroto Fields (RLM)
│   ├── project.md           # Tier 1 - ALWAYS loaded
│   ├── architecture.md      # Tier 2 - On demand
│   ├── patterns.md          # Tier 2 - On demand
│   ├── knowledge.md         # Tier 3 - By keywords
│   └── current.md           # Volatile - Session state
│
├── settings.json             # Claude Code config
├── visual-validation.json    # Routes for visual-validator (optional)
├── terraform-validation.json # Paths for terraform-validator (optional)
└── debug-logs.json           # Commands for production log query (optional)
```

**Per-project customizations:**

| File | Purpose | When to Create |
|------|---------|----------------|
| `commands/*.md` | Specific skills (deploy, E2E, migrations) | When project has unique workflows |
| `visual-validation.json` | Maps components → routes for testing | Projects with complex UI |
| `terraform-validation.json` | Env vars and terraform paths | Projects with infrastructure as code |
| `debug-logs.json` | Commands for production log query | Projects with logs in Cloud Logging, CloudWatch, etc. |
| `settings.json` | Default model, permissions, etc. | Advanced config |

**Project CLAUDE.md should contain:**
- Project name and description
- npm commands (dev, build, test)
- Folder structure
- MCP Memory namespace prefix (ex: `sm:`, `api:`, `web:`)

---

## Call Flow

### /feature (Feature Development)

```
User: "add date filter"
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Global CLAUDE.md detects trigger "add/implement"                        │
│  → Redirects to /feature                                                 │
└──────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  commands/feature.md (orchestrator)                                      │
│  → Reads: commands/feature/01-understand.md                              │
└──────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────┐     ┌────────────────────────┐
│   01-understand.md     │────►│   02-analyze.md        │
│   - Explores codebase  │     │   - Internal triage    │
│   - MCP Memory         │     │   - Selects playbook   │
│   - AskUserQuestion    │     │   - Maps reuse         │
└────────────────────────┘     └───────────┬────────────┘
                                           │
                                           ▼
┌────────────────────────┐     ┌────────────────────────┐
│   04-red.md            │◄────│   03-strategy.md       │
│   - Write tests first  │     │   - Test strategy      │
│   - Following spec     │     │   - USER APPROVAL      │
└───────────┬────────────┘     └────────────────────────┘
            │
            ▼
┌────────────────────────┐     ┌────────────────────────┐
│   05-green.md          │────►│   06-quality.md        │
│   - Implement code     │     │   - Quality gates      │
│   - Make tests pass    │     │   - Run agents         │
└────────────────────────┘     └───────────┬────────────┘
                                           │
                                           ▼
┌────────────────────────┐     ┌────────────────────────┐
│   07-validation.md     │────►│   08-delivery.md       │
│   - E2E validation     │     │   - Commit & Push      │
│   - Smoke tests        │     │   - Sync memory        │
└────────────────────────┘     └───────────┬────────────┘
                                           │
                                           ▼
                               ┌────────────────────────┐
                               │   09-evaluate.md       │
                               │   - Self-evaluation    │
                               │   - Lessons learned    │
                               └────────────────────────┘
```

### /debug (Bug Resolution)

```
User: "error publishing video"
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Global CLAUDE.md detects trigger "bug/error/problem"                    │
│  → Redirects to /debug                                                   │
└──────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────┐     ┌────────────────────────┐
│   01-reproduce.md      │────►│   02-investigate.md    │
│   - Reproduce bug      │     │   - 5 Whys with        │
│   - Triage severity    │     │     EVIDENCE           │
└────────────────────────┘     └───────────┬────────────┘
                                           │
                                           ▼
┌────────────────────────┐     ┌────────────────────────┐
│   03-fix.md            │────►│   04-verify.md         │
│   - Criticality gate   │     │   - Confirm fix        │
│   - MINIMAL fix        │     │   - Quality gates      │
│   - Tests required     │     │   - Save rare bug      │
└────────────────────────┘     └───────────┬────────────┘
                                           │
                                           ▼
┌────────────────────────┐     ┌────────────────────────┐
│   05-commit.md         │────►│   06-evaluate.md       │
│   - Commit & Push      │     │   - Self-evaluation    │
│   - Sync memory        │     │   - Lessons learned    │
└────────────────────────┘     └────────────────────────┘
```

### /gate (Quality Gate Before PR)

```
User: "/gate" or invoked by /feature
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  commands/gate.md                                                        │
│  Orchestrates 7 agents in sequence, auto-fixing:                         │
└──────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐  │
│  │ test-fixer  │──►│   code-     │──►│    dry-     │──►│   code-     │  │
│  │             │   │ simplifier  │   │  enforcer   │   │  reviewer   │  │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘  │
│                                                                │         │
│                                                                ▼         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                     IF relevant changes:                            ││
│  │  ┌──────────────────┐              ┌──────────────────────┐         ││
│  │  │ visual-validator │              │ terraform-validator  │         ││
│  │  │   (if UI .tsx)   │              │   (if .env/.tf)      │         ││
│  │  └──────────────────┘              └──────────────────────┘         ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Responsibility Distribution

### CLAUDE.md (Global vs Local)

| Aspect | Global (~/.claude/) | Local (project/.claude/) |
|--------|---------------------|--------------------------|
| **Scope** | All sessions | This project only |
| **Content** | Code rules, autonomy | npm commands, structure, language |
| **Skills** | /feature, /debug, /gate | Project-customized skills |
| **Memory NS** | Defines usage pattern | Defines unique prefix (ex: `api:`) |
| **Size** | ~25 lines | ~30 lines |

### Agents vs Skills

| Agents (subagents) | Skills (commands) |
|--------------------|-------------------|
| Execute in isolated context | Execute in main context |
| Invoked via `Task` tool | Invoked via `/skill` or `Skill` tool |
| Specialized in ONE task | Orchestrate multiple tasks |
| Fully autonomous | Can request approval |
| ~200-300 lines each | ~20-150 lines each |

### Models by Component

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MODEL ALLOCATION                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OPUS (high quality, slower)                                        │
│  ├── commands/feature.md      → Complex decisions                   │
│  ├── commands/debug.md        → Root cause analysis                 │
│  └── agents/code-reviewer.md  → Quality judgment                    │
│                                                                     │
│  SONNET (balanced)                                                  │
│  ├── agents/test-fixer.md        → Test creation                    │
│  └── agents/visual-validator.md  → Browser navigation               │
│                                                                     │
│  HAIKU (fast, economical)                                           │
│  └── agents/memory-sync.md       → Simple CRUD operations           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Autonomy by Design

### Principles

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PILLARS OF AUTONOMY                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. DO, don't ask                                                   │
│     └── Agents fix problems automatically                           │
│     └── Don't ask confirmation for fixes                            │
│                                                                     │
│  2. SEARCH, don't request context                                   │
│     └── MCP Memory for persistent knowledge                         │
│     └── Grep/Glob to explore codebase                               │
│     └── AskUserQuestion ONLY for product decisions                  │
│                                                                     │
│  3. BLOCKING rules                                                  │
│     └── Code without test = PR rejected                             │
│     └── Quality gates must pass                                     │
│                                                                     │
│  4. Errors: fix and continue                                        │
│     └── Don't abandon workflow on failure                           │
│     └── Auto-fix up to 3 attempts                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Automatic Triggers

| Condition | Automatic Action |
|-----------|------------------|
| User asks "add/implement feature" | Redirect to `/feature` |
| User mentions "bug/error/problem" | Redirect to `/debug` |
| Change in `components/*.tsx` | `visual-validator` invoked |
| Change in `.env` or `terraform/` | `terraform-validator` invoked |
| New code without test | `test-fixer` creates test |
| End of workflow | `memory-sync` updates Memory |

---

## Easy RLM - Kakaroto Fields

Persistent context system based on **Recursive Language Models (RLM)**.

### RLM Concept

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROBLEM: CONTEXT ROT                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Long context (100k+ tokens) = LLM quality degradation             │
│                                                                     │
│   RLM SOLUTION:                                                     │
│   ├── Treat context as external environment (files)                 │
│   ├── Load MINIMUM necessary per task                               │
│   ├── Search on demand via keywords                                 │
│   └── Decompose large tasks into sub-agents                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Kakaroto Fields Structure

```
.claude/context/
├── project.md       # Tier 1 - ALWAYS loaded
├── architecture.md  # Tier 2 - By keywords
├── patterns.md      # Tier 2 - By keywords
├── knowledge.md     # Tier 3 - Search by keywords
└── current.md       # Volatile - Session state
```

### Loading Flow

```
SESSION START
     │
     ▼
┌─────────────────┐
│  project.md     │  ← Stack, commands, structure (ALWAYS)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  current.md     │  ← Resume previous work (if any)
└────────┬────────┘
         │
         ▼
   DURING WORK
         │
         ▼
┌─────────────────┐
│ Search keywords:│  ← Load Tier 2/3 on demand
│ - architecture  │  → architecture.md
│ - pattern       │  → patterns.md
│ - why           │  → knowledge.md
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

### RLM Agents

| Agent | Function | When to Use |
|-------|----------|-------------|
| `context-indexer` | Index new project | First time (no project.md) |
| `context-manager` | Load context selectively | Session start or refresh |

### RLM Decomposition (Large Codebases)

```
IF codebase > 100 files AND task requires broad analysis:

1. Grep to identify relevant modules
2. For each module: Task(Explore, "analyze {module} for {goal}")
3. Aggregate partial results
4. Synthesize final response

RULES:
- Max 5 parallel sub-tasks
- Each sub-task with clear scope
- Always aggregate before responding
```

### Why RLM (vs MCP Memory)

| Aspect | MCP Memory | RLM/Kakaroto |
|--------|------------|--------------|
| Persistence | Depends on MCP server | Git files (always works) |
| Portability | Local only | Clone = memory included |
| Visibility | Opaque | Readable Markdown |
| Scalability | Linear | Hierarchical (tiers) |
| Collaboration | No | Yes (versioned) |

---

## Persistence and Checkpoints

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STATE PERSISTENCE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   SPECS AND PLANS                                                   │
│   └── .claude/specs/{slug}.md      → Generated spec                 │
│   └── .claude/specs/current.md     → Pointer to active spec         │
│   └── .claude/plans/{slug}.md      → Generated plan                 │
│   └── .claude/plans/current.md     → Pointer to active plan         │
│                                                                     │
│   BENEFIT: Session can be resumed without losing context            │
│                                                                     │
│   CHECKPOINTS VIA TodoWrite                                         │
│   └── Each phase registers completion in TodoWrite                  │
│   └── Gate: next phase only starts if previous completed            │
│   └── User visibility of progress                                   │
│                                                                     │
│   INTELLIGENT CONTEXT LOADING                                       │
│   └── 01-understand: Loads MCP Memory (config, patterns)            │
│   └── 02-analyze+: Context already available, just search patterns  │
│   └── Resume: Read .claude/specs/current.md                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Structured Agent Output

All 8 agents return standardized block at end:

```
---AGENT_RESULT---
STATUS: PASS | FAIL
ISSUES_FOUND: <number>
ISSUES_FIXED: <number>
BLOCKING: true | false
---END_RESULT---
```

**Aggregation Rules (06-quality.md and gate.md):**
- IF STATUS=FAIL and BLOCKING=true → Workflow STOPS
- IF STATUS=FAIL and BLOCKING=false → Continue with warning
- Result aggregated in table for final report

---

## Architecture Benefits

| Benefit | How Achieved |
|---------|--------------|
| **Minimal context** | Chained reading, small files |
| **Maximum autonomy** | Agents auto-fix, blocking rules |
| **Consistency** | Global rules inherited by all projects |
| **Flexibility** | Local skills for specific needs |
| **Quality** | /gate orchestrates 7 automatic validations |
| **Knowledge** | MCP Memory persists learnings |
| **Scalability** | Same setup works for N projects |

---

## Quick Reference

```bash
# Global skills (any project)
/feature    # Develop complete feature
/debug      # Resolve bug with 5 Whys
/gate       # Pre-PR quality gate

# Local skills (defined in project/.claude/commands/)
# Common examples:
# /deploy     # Deploy to production
# /test-e2e   # End-to-end tests
# /migrate    # Database migrations

# Agents (invoked automatically or via Task)
test-fixer, code-reviewer, functional-validator,
code-simplifier, memory-sync, terraform-validator,
context-indexer, context-manager
```

---

*Last updated: January 2026*
