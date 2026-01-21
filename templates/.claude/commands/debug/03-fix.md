# Phase 3: Fix

Responsibility: Implement fix AUTONOMOUSLY.

---

## Step 1: Pre-Fix Validation

### 1.1 Categorization Review

In the Investigate phase you categorized your fix as:
- [ ] LOGIC CORRECTION → Proceed
- [ ] FILTER/IGNORE → **STOP!** Go back to Investigate
- [ ] WORKAROUND → **STOP!** Go back to Investigate

### 1.2 Gate for FILTER/IGNORE

**IF** fix involves adding to ignore/skip/filter list:
1. Why is the error being generated in the first place?
2. Can this pattern appear in legitimate errors?
3. Is there a way to correct the logic instead of filtering?

**IF cannot justify**: Go back to 02-investigate.md

---

## Step 2: Criticality Gate

ACTION: Read ~/.claude/commands/debug/validators/criticality-gate.md

---

## Step 3: Permanence Gate

ACTION: Read ~/.claude/commands/debug/validators/fix-permanence.md

---

## Step 4: Regression Test

### 4.1 Use Factories (if available)

**BEFORE** creating inline mocks, check test-utils/:

```typescript
// ✅ Correct - use centralized factory
import { createBlogPost, createCampaign } from '../test-utils/factories';

describe('regression: bug-name', () => {
  const post = createBlogPost({ /* setup that caused bug */ });
  // ...
});

// ❌ Wrong - create inline object
const post = {
  id: 'test',
  // ... 20+ duplicated fields
};
```

### 4.2 Create Test that Reproduces the Bug

```typescript
describe('regression: [descriptive bug name]', () => {
  it('should [expected behavior after fix]', () => {
    // Arrange: setup that causes the bug (use factories!)
    // Act: action that triggers the bug
    // Assert: verify correct behavior
  })
})
```

**Naming:** Use `describe('regression: ...')` to identify regression tests.

### 4.3 Verify that Test FAILS

```bash
npm test -- --testPathPattern="[file]"
```

The test MUST fail before the fix. If it passes, the test doesn't reproduce the bug.

---

## Step 5: Implement Fix

```
FIX:
File: [file:line]
Before: [current code]
After: [new code]
Justification: [why it solves the root cause]
```

Rules:
- ONLY what's necessary to resolve the root cause
- DO NOT refactor unrelated code
- Follow existing project patterns

---

## Step 6: Verify Fix

```bash
npm test -- --testPathPattern="[file]"
```

---

## Step 7: Checkpoint

```javascript
TodoWrite({
  todos: [
    { content: "Investigate: root cause identified", status: "completed", activeForm: "Root cause identified" },
    { content: "Fix: test + correction implemented", status: "completed", activeForm: "Fix implemented" },
    { content: "Verify: validate quality gates", status: "pending", activeForm: "Validating quality gates" }
  ]
})
```

---

## Output

Fix implemented. Regression test passing.

---

## NEXT PHASE

REQUIRED ACTION: Read ~/.claude/commands/debug/04-verify.md
