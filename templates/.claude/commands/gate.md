# Quality Gate

Complete code validation: **current changes** vs **origin/main**

**Mode:** Orchestrates specialized agents for comprehensive validation. Auto-fixes problems.

**Usage:** Run before push to main, or periodically to ensure quality.

---

## Context Loading (REQUIRED)

Load project context:
- `mcp__memory__search_nodes({ query: "config" })` - scope, commands, quality gates
- `mcp__memory__search_nodes({ query: "environment" })` - local/production

---

## Phase 0: Test Coverage Gate (BLOCKING)

**This phase is BLOCKING. Validation does NOT pass without tests.**

### Check Coverage

```bash
# Identify modified code files (excluding tests)
git diff origin/main...HEAD --name-only | grep -E '\.(ts|tsx)$' | grep -v '\.test\.' | grep -v '\.d\.ts'
```

For each file in `services/`, `utils/`, `api/`, `cron/`:
1. Check if corresponding `[file].test.ts` exists
2. If NOT exists: **FAIL** - invoke `test-fixer` to create

### If Coverage Insufficient

1. Invoke `Task` tool with `subagent_type: test-fixer`
2. DO NOT proceed until tests exist
3. Tests must PASS before continuing to Phase 1

**Only proceed when all code files have corresponding tests.**

---

## Phase 1: Initial Quality Gates

Search for quality gates commands in memory (ex: `quality_gates`).

Run:
```bash
npm run test && npx tsc --noEmit && npm run build
```

If any fail, delegate to `test-fixer` agent to fix before proceeding.

---

## Phase 2: Diff Analysis

```bash
git fetch origin main
git diff origin/main...HEAD --stat
```

Identify:
- Modified files
- Lines added/removed
- If environment/config files changed

---

## Phase 3: Agent Delegation

Based on changes detected, invoke appropriate agents **using Task tool with subagent_type**.

**IMPORTANT:** All agents are FULLY AUTONOMOUS - they will identify AND FIX problems automatically.

**Execution order:**
`test-fixer (baseline) -> code-simplifier (includes DRY) -> test-fixer (verification) -> code-reviewer -> visual-validator (if UI) -> terraform-validator (if env)`

### 3.1 Test Fixer (BASELINE)

Ensure implemented code passes tests BEFORE refactoring.

**Invoke:** `Task` tool with `subagent_type: test-fixer`

**Prompt:** "Run npm test. If fails, fix. DO NOT create new tests yet - just ensure baseline works."

**Expected output:**
- All tests passing
- Baseline working

**If tests fail:** Fix before proceeding. DO NOT proceed until baseline passes.

### 3.2 Code Simplification (includes DRY)

**Invoke:** `Task` tool with `subagent_type: code-simplifier`

**Expected output:**
- Dead code removed
- Naming improved
- Structure simplified (nesting, function length)
- Duplications replaced with calls to existing utils/services
- Reimplementations flagged and fixed

### 3.3 Test Fixer (VERIFICATION)

Ensure refactoring didn't break anything.

**Invoke:** `Task` tool with `subagent_type: test-fixer`

**Prompt:** "Run npm test after refactoring. Fix failing tests. Create missing tests for new functions."

**Expected output:**
- All tests passing
- New functions have tests
- No skipped tests without justification

**If tests fail:** Fix before proceeding.

### 3.4 Code Review

**Invoke:** `Task` tool with `subagent_type: code-reviewer`

**Expected output:**
- Security issues (CRITICAL)
- Type safety violations (CRITICAL)
- Code quality issues (HIGH/MEDIUM)
- Environment compatibility issues

**If CRITICAL issues found:** Fix before proceeding.

### 3.5 Visual Validation (IF UI)

**Detect UI changes:**
```bash
git diff origin/main...HEAD --name-only | grep -E '\.(tsx|css|scss)$' | grep -v '\.test\.' | grep -v '\.spec\.'
```

**If UI files found:**

**Invoke:** `Task` tool with `subagent_type: visual-validator`

**Expected output:**
- All pages load without console errors
- Modified components render correctly
- Interactions work (modals open, etc.)

**Behavior:**
- Agent is FULLY AUTONOMOUS
- Starts dev server, opens headless browser
- Navigates to modified screens
- Auto-fixes errors (max 3 attempts)
- Only returns when working OR exhausted attempts

**If FAIL after 3 attempts:** BLOCK gate, report errors to user.

### 3.6 Environment Validation (IF env)

**Detect env changes:**
```bash
git diff origin/main...HEAD --name-only | grep -E '\.env|terraform/|\.tfvars'
```

**If env/terraform files found:**

**Invoke:** `Task` tool with `subagent_type: terraform-validator`

**Expected output:**
- All env vars consistent across files (.env.example, variables.tf, main.tf, tfvars.example)
- No hardcoded paths in code
- Path pattern: `process.env.VAR || './default'`
- Auth works in both environments

**Behavior:**
- Agent is FULLY AUTONOMOUS
- Extracts variables from all config files
- Compares sets and identifies inconsistencies
- Auto-fixes missing variables in each file
- Searches and fixes hardcoded paths
- Runs `npx tsc --noEmit` to verify no errors introduced

**If FAIL:** BLOCK gate, report inconsistencies to user.

---

## Phase 4: Agent Results Aggregation

Collect results from all agents (in execution order):

| Agent | Status | Issues Found | Fixed |
|-------|--------|--------------|-------|
| test-fixer (baseline) | PASS/FAIL | X | X |
| code-simplifier (DRY) | PASS/FAIL | X | X |
| test-fixer (verification) | PASS/FAIL | X | X |
| code-reviewer | PASS/FAIL | X | X |
| visual-validator | SKIP/PASS/FAIL | X | X |
| terraform-validator | SKIP/PASS/FAIL | X | X |

---

## Phase 5: Final Verification

Re-run all quality gates after agent fixes:

```bash
npm run test && npx tsc --noEmit && npm run build
```

All must pass before proceeding.

---

## Phase 6: Boundaries Check

Search `codebase_scope` and `forbidden_paths` in memory.

- [ ] Only files within scope modified
- [ ] No changes in forbidden files

If boundary violated, revert those changes.

---

## Phase 7: Summary Report

Generate consolidated report:

```markdown
## Quality Gate Report

**Status:** PASSED / FAILED
**Date:** [timestamp]
**Branch:** [current branch]
**Commits:** [count] commits ahead of origin/main

### Agent Analysis Summary

| Agent | Status | Issues Found | Fixed |
|-------|--------|--------------|-------|
| test-fixer (baseline) | [PASS/FAIL] | X | X |
| code-simplifier (DRY) | [PASS/FAIL] | X | X |
| test-fixer (verification) | [PASS/FAIL] | X | X |
| code-reviewer | [PASS/FAIL] | X | X |
| visual-validator | [SKIP/PASS/FAIL] | X | X |
| terraform-validator | [SKIP/PASS/FAIL] | X | X |

### Quality Gates

| Gate | Status |
|------|--------|
| Tests | PASS/FAIL |
| TypeScript | PASS/FAIL |
| Build | PASS/FAIL |
| Boundaries | PASS/FAIL |

### Key Findings

- [List of significant issues found and fixed]

### Recommendations

- [Any manual actions needed]
```

---

## Phase 8: Sync Knowledge Base

After all validations complete, update knowledge base with learnings:

### 8.1 Extract Lessons from Agent Reports

Review what each agent found and fixed:

- **code-reviewer**: Security issues, type violations found
- **test-fixer**: Test failures, missing coverage
- **code-simplifier**: Duplications, naming issues, dead code
- **visual-validator**: UI errors, console errors
- **terraform-validator**: Env inconsistencies

### 8.2 Update knowledge.md

Add new entries to `.claude/context/knowledge.md`:

**Pitfalls discovered:**
- Issues that caused test failures
- Security patterns that were flagged
- Type safety violations

**Decisions made:**
- Refactoring choices during simplification
- Test strategy decisions
- Architecture patterns applied

**Patterns that caused issues:**
- Code patterns that needed fixing
- Anti-patterns to avoid

### 8.3 Rebuild CLAUDE.md

```bash
bash scripts/init-context.sh
```

This ensures future sessions benefit from today's learnings.

Report: "Knowledge base synced with [N] new entries"

---

## Manual Fallback

If agent delegation is not working, fall back to manual checklist:

<details>
<summary>Manual Security Scan</summary>

| Vulnerability | Pattern | Action |
|--------------|---------|--------|
| Hardcoded Secrets | API keys, tokens in code | Move to env var |
| `eval()` usage | `eval()`, `new Function()` | Remove or replace |
| Command Injection | `child_process.exec()` with vars | Use `execFile()` |
| Sensitive Logs | Passwords, tokens in `console.log` | Remove or redact |

</details>

<details>
<summary>Manual Code Cleanup</summary>

- [ ] Delete unused imports
- [ ] Delete unused variables
- [ ] Delete commented-out code
- [ ] Rename generic variables
- [ ] Functions < 50 lines
- [ ] Nesting < 3 levels

</details>

<details>
<summary>Manual DRY Check</summary>

- [ ] Checked existing helpers before creating new?
- [ ] No duplicated functionality?

</details>
