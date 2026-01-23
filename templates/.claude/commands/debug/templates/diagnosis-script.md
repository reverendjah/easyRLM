# Template: Diagnosis Script

For Backend/API/Job/Integration bugs, create `scripts/debug-{description}.ts`.

**Exit codes:**
- 0: Bug NOT present (correct behavior)
- 1: Bug PRESENT (incorrect behavior)

---

## Template

```typescript
#!/usr/bin/env npx tsx
/**
 * Diagnosis: {bug description}
 * Bug: {$ARGUMENTS}
 * Date: {timestamp}
 */
import { config } from 'dotenv';
config();

async function diagnose(): Promise<boolean> {
  console.log('='.repeat(60));
  console.log('DIAGNOSIS: {name}');
  console.log('='.repeat(60));
  console.log('');

  // 1. Setup
  console.log('1. Setup...');
  // [setup code]

  // 2. Reproduction
  console.log('');
  console.log('2. Reproducing scenario...');
  // [code that reproduces the bug scenario]

  // 3. Verification
  console.log('');
  console.log('3. Verifying result...');
  // [verify if result is correct]

  const result = /* obtained value */;
  const expected = /* expected value */;
  const bugPresent = result !== expected;

  // 4. Result
  console.log('');
  console.log('='.repeat(60));
  console.log('RESULT');
  console.log('='.repeat(60));
  console.log('Expected:', expected);
  console.log('Obtained:', result);
  console.log('Bug present:', bugPresent ? 'YES' : 'NO');

  return bugPresent;
}

diagnose()
  .then(bugPresent => process.exit(bugPresent ? 1 : 0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
```

---

## Alternative Artifacts

**For UI:** screenshot + Playwright snapshot
**For Test:** npm test output with stack trace
