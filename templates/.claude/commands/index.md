# Index Context

Index project context for optimal Claude sessions.

$ARGUMENTS

---

## START

Execute phases sequentially. No user intervention needed.

Report progress to user as each phase completes.

---

## Phase 1: Detect Project

Identify project type and stack:

1. Read config files to detect stack:
   - `package.json` - Node.js/TypeScript
   - `requirements.txt` / `pyproject.toml` - Python
   - `go.mod` - Go
   - `Cargo.toml` - Rust

2. Detect framework from dependencies:
   - Next.js, Express, Fastify, NestJS
   - FastAPI, Django, Flask
   - Gin, Echo, Fiber
   - Actix, Rocket

3. Count code files by type using Glob:
   - `**/*.ts` / `**/*.tsx`
   - `**/*.py`
   - `**/*.go`
   - `**/*.rs`

Report: "Phase 1: Detected [stack] project with [N] code files"

---

## Phase 2: Map Structure

Analyze codebase structure:

1. List top-level directories with `ls -la`

2. Identify entry points:
   - `src/index.ts`, `src/main.ts`, `src/app.ts`
   - `main.py`, `app.py`, `__main__.py`
   - `main.go`, `cmd/*/main.go`

3. Find key directories:
   - API routes: `api/`, `routes/`, `endpoints/`
   - Services: `services/`, `lib/`, `core/`
   - Models: `models/`, `types/`, `schemas/`
   - Utils: `utils/`, `helpers/`, `common/`

4. Count API endpoints if applicable

Report: "Phase 2: [N] directories, [N] entry points, [N] API routes"

---

## Phase 3: Extract Patterns

Find reusable code patterns by reading representative files:

1. **Handler/Controller patterns**: Read 2-3 API route files

2. **Service patterns**: Read 2-3 service files

3. **Error handling patterns**: Grep for `catch`, `Error`, `throw`

4. **Test patterns**: Read 2-3 test files if they exist

5. **Middleware patterns**: Look for middleware directory/files

Extract concrete code examples (not templates).

Report: "Phase 3: Found [N] patterns (handler, service, error, test...)"

---

## Phase 4: Build Knowledge

Extract tacit knowledge:

1. **Git history analysis**:
   ```bash
   git log --oneline -50 | head -20
   ```
   Look for decision-related commits (why, decision, chose, instead of)

2. **TODO/FIXME comments**:
   ```bash
   grep -r "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" -l
   ```
   Read top 5 files to extract context

3. **Error handling workarounds**:
   Look for retry logic, fallbacks, special cases

4. **Existing documentation**:
   Check for README.md, docs/, ARCHITECTURE.md

Report: "Phase 4: Extracted [N] decisions, [N] pitfalls, [N] TODOs"

---

## Phase 5: Generate Context Files

Update Kakaroto Fields in `.claude/context/`:

### 5.1 project.md

Fill with real data:
- Project name from package.json/config
- Actual stack with versions
- Real commands from scripts
- Actual folder structure
- Real entry points
- Real environment variables (names only, not values)

### 5.2 architecture.md

Fill with real data:
- Module organization based on actual directories
- Integration points found in code
- Data flow based on service calls

### 5.3 patterns.md

Fill with real code examples:
- Actual handler code from the project
- Actual service code from the project
- Actual test code from the project
- Real error handling patterns used

### 5.4 knowledge.md

Fill with discovered knowledge:
- Decisions from git history
- Pitfalls from TODO/FIXME
- Non-obvious flows found in code

**IMPORTANT:** Remove ALL placeholder text like `{Nome}`, `{Tecnologia}`, etc.
Replace with actual project data or remove the section if not applicable.

Report: "Phase 5: Updated project.md, architecture.md, patterns.md, knowledge.md"

---

## Phase 6: Rebuild CLAUDE.md

Run the init script to embed all context into CLAUDE.md:

```bash
bash scripts/init-context.sh
```

This embeds all context files into CLAUDE.md for immediate loading.

Report: "Phase 6: CLAUDE.md rebuilt with embedded context"

---

## Output

Print final summary:

```
Index Complete!

  Project: [name] ([stack])
  Files analyzed: [N]
  Patterns found: [N]
  Decisions extracted: [N]

  Context files updated:
    - .claude/context/project.md
    - .claude/context/architecture.md
    - .claude/context/patterns.md
    - .claude/context/knowledge.md
    - .claude/CLAUDE.md (rebuilt)

Run /index again anytime to refresh context.
```

---

## Notes

- This command is idempotent - safe to run multiple times
- Subsequent runs update existing content rather than overwriting
- Use after major codebase changes to keep context current
- /gate will also update knowledge.md after quality validation
