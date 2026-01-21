---
name: context-indexer
description: "First-time project indexer. Explores codebase and generates initial Kakaroto fields. Run automatically when .claude/context/ is missing or empty."
tools: Read, Glob, Grep, Bash, Write
model: sonnet
---

# Context Indexer Protocol

Index project for the first time, generating initial Kakaroto fields.

**WHEN TO USE**: New project without `.claude/context/project.md` filled.

---

## Phase 1: DETECT PROJECT TYPE

```bash
# Detect package manager / language
ls package.json 2>/dev/null && echo "NODE"
ls pyproject.toml setup.py requirements.txt 2>/dev/null && echo "PYTHON"
ls Cargo.toml 2>/dev/null && echo "RUST"
ls go.mod 2>/dev/null && echo "GO"
ls pom.xml build.gradle 2>/dev/null && echo "JAVA"
```

### Extract Metadata

**Node.js**:
```bash
cat package.json | head -50
```
Extract: name, description, scripts, main dependencies

**Python**:
```bash
cat pyproject.toml 2>/dev/null || cat setup.py 2>/dev/null | head -50
```

---

## Phase 2: MAP STRUCTURE

```bash
# Folder structure (ignoring node_modules, venv, etc)
find . -type d -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/venv/*" -not -path "*/__pycache__/*" | head -30

# Count files by type
echo "=== Code files ==="
find . -name "*.ts" -not -path "*/node_modules/*" | wc -l
find . -name "*.tsx" -not -path "*/node_modules/*" | wc -l
find . -name "*.js" -not -path "*/node_modules/*" | wc -l
find . -name "*.py" -not -path "*/venv/*" | wc -l
```

---

## Phase 3: IDENTIFY ENTRY POINTS

```bash
# Node.js
grep -l "createServer\|express()\|fastify()\|app.listen" src/**/*.ts 2>/dev/null | head -5

# Main files
ls src/index.ts src/main.ts src/app.ts index.ts main.ts app.ts 2>/dev/null
```

---

## Phase 4: GENERATE project.md

Write `.claude/context/project.md` with collected information:

```markdown
# {Project Name}

## Description
{Extracted from package.json description or README}

## Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | {Node.js/Python/etc} | {version} |
| Framework | {Express/FastAPI/etc} | {version} |
| Database | {detected or "TBD"} | - |

## Commands
{Extracted from package.json scripts}

## Folder Structure
{Mapped in Phase 2}

## Entry Points
{Identified in Phase 3}

## Quality Gates
- [ ] Tests passing
- [ ] Build without errors
```

---

## Phase 5: GENERATE architecture.md (SKELETON)

```markdown
# Architecture

> This file was auto-generated. Fill as project evolves.

## Main Modules

| Module | Responsibility | Depends on |
|--------|----------------|------------|
{List folders in src/ with generic description}

## Data Flow
To be documented.

## External Integrations
To be documented.
```

---

## Phase 6: GENERATE patterns.md (SKELETON)

```markdown
# Code Patterns

> This file was auto-generated. Add examples as patterns emerge.

## Handler Pattern
To be documented with project example.

## Service Pattern
To be documented with project example.

## Test Pattern
To be documented with project example.
```

---

## Phase 7: GENERATE knowledge.md (EMPTY)

```markdown
# Tacit Knowledge

> Document here important decisions, known pitfalls, and non-obvious flows.

## Important Decisions
None documented yet.

## Known Pitfalls
None documented yet.

## Incident History
None documented yet.
```

---

## Phase 8: GENERATE current.md (CLEAN)

```markdown
# Current State

> Updated automatically during work.

## Active Session
No active session.

## Next Step
Project just indexed. Ready to work!

*Indexed at: {TIMESTAMP}*
```

---

## Phase 9: REPORT

Inform user:

```
Project indexed successfully!

Type: {Node.js / Python / etc}
Code files: {N}
Detected structure:
  - {folder1}/
  - {folder2}/
  - ...

Fields created:
  - .claude/context/project.md (filled)
  - .claude/context/architecture.md (skeleton)
  - .claude/context/patterns.md (skeleton)
  - .claude/context/knowledge.md (empty)
  - .claude/context/current.md (clean)

Recommendation: Review project.md and complete missing information.
```

---

## Required Output

```
---AGENT_RESULT---
STATUS: PASS | FAIL
PROJECT_TYPE: node | python | go | rust | java | other
CODEBASE_SIZE: {N} files
STRUCTURE_DETECTED: [list of folders]
FILES_CREATED: [project.md, architecture.md, patterns.md, knowledge.md, current.md]
BLOCKING: false
---END_RESULT---
```

---

## Error Handling

### Empty project
```
STATUS: FAIL
REASON: Project appears empty (no code files found)
```

### No write permission
```
STATUS: FAIL
REASON: No permission to create files in .claude/context/
```

### Very complex structure
```
STATUS: PASS (with warning)
WARNING: Complex structure detected. Review project.md manually.
```
