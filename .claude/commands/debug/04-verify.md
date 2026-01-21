# Phase 4: Verify

Responsibility: Verify and finalize AUTONOMOUSLY.

---

## Step 1: Quality Gates

```bash
npm test && npx tsc --noEmit && npm run build
```

**If fails:** ACTION: Read ~/.claude/commands/debug/self-healing.md

---

## Step 2: Re-execute Reproduction

The debug script MUST be re-executed to confirm resolution.

### 2.1 Execute Script

```bash
npx tsx scripts/debug-{bug-name}.ts
```

**IF** script doesn't exist: `ls scripts/debug-*.ts` and execute most recent.

### 2.2 Output Comparison

| Moment | Output |
|--------|--------|
| **BEFORE** (from `.claude/debug/reproduction.md`) | [original output] |
| **AFTER** | [current output] |

### 2.3 Decision Gate

**IF** output still shows bug:
- Fix DID NOT resolve the root cause
- ACTION: Read ~/.claude/commands/debug/self-healing.md

**IF** bug resolved:
- **IF** category = Infra/Deploy: Consult playbooks/infra.md
- **ELSE**: Proceed to 2.4

### 2.4 Convert Script to Regression Test (if applicable)

**IF** script returned 0 (bug absent) AND modified file in `cron/`, `services/`, `api/`, `utils/`:

1. Identify target test file:
   ```
   services/foo.ts  → services/foo.test.ts
   cron/bar.ts      → cron/bar.test.ts (or create)
   ```

2. Convert script structure:
   ```
   diagnose()           → describe('regression: {bug}')
   // 1. Setup          → beforeEach or inline
   // 2. Reproduction   → it('should {correct behavior}', ...)
   // 3. Verification   → expect(...).toBe(...)
   bugPresent ? 1 : 0   → expect(bugPresent).toBe(false)
   ```

3. Add to test file:
   ```typescript
   describe('regression: {bug-description}', () => {
     it('should {correct behavior after fix}', async () => {
       // [adapted code from debug script]
       expect(result).toBe(expected);
     });
   });
   ```

4. Validate: `npm test -- --filter="{file}"`

**IF** bug NOT automatically testable (UI, Infra, Config):
- Skip conversion, just document in reproduction.md

**NOTE:** Conversion is recommended, not mandatory. Use judgment.

---

## Step 3: Memory Sync (if non-obvious bug)

```javascript
mcp__memory__create_entities({
  entities: [{
    name: "{prefix}:bug:{descriptive-name}",
    entityType: "bug",
    observations: ["Symptom: [...]", "Root cause: [...]", "Solution: [...]"]
  }]
})
```

---

## Step 4: Cleanup

### 4.1 Debug Script

**IF** script was converted to test (2.4):
```bash
rm scripts/debug-{bug-name}.ts  # Code is already in test
```

**IF** script NOT converted (non-testable bug):
```bash
rm scripts/debug-{bug-name}.ts  # Documentation stays in reproduction.md
```

### 4.2 Keep Documentation

DO NOT delete:
- `.claude/debug/reproduction.md`
- `.claude/debug/root-cause.md`

### 4.3 Verify Git Status

```bash
git status
```

**IF** regression test was created: should show new or modified file

---

## Step 5: Checkpoint

```javascript
TodoWrite({
  todos: [
    { content: "Fix: correction implemented", status: "completed", activeForm: "Fix implemented" },
    { content: "Verify: quality gates + bug confirmed", status: "completed", activeForm: "Verified" },
    { content: "Verify: regression test (if applicable)", status: "completed", activeForm: "Regression test checked" },
    { content: "Verify: cleanup done", status: "completed", activeForm: "Cleanup done" },
    { content: "Commit: commit and push", status: "pending", activeForm: "Committing" }
  ]
})
```

---

## Inviolable Rules

1. FORBIDDEN to proceed with failing tests/build
2. FORBIDDEN to proceed without re-executing script
3. FORBIDDEN more than 3 attempts in self-healing
4. FORBIDDEN to leave debug script in scripts/ (convert to test or delete)

---

## NEXT PHASE

REQUIRED ACTION: Read ~/.claude/commands/debug/05-commit.md
