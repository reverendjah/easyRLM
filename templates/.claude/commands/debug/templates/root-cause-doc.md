# Template: Root Cause Documentation

Create file `.claude/debug/root-cause.md`.

---

## Template

```markdown
# Root Cause: {short description}

**Date:** {timestamp}
**Bug:** {reference to reproduction.md}

## Flow Classification
- [ ] ORIGIN / [ ] TRANSFORMATION / [ ] USE

## Hypotheses Tested
| # | Hypothesis | Result | Evidence |
|---|------------|--------|----------|
| 1 | [cause A] | Refuted | [why] |
| 2 | [cause B] | CONFIRMED | file:line |

## Root Cause
**File:** {path}
**Line:** {number}
**Current Code:**
\`\`\`typescript
{problematic code}
\`\`\`

**Problem:** {clear explanation}

## Proposed Fix
**Type:** LOGIC CORRECTION / FILTER / WORKAROUND
**New Code:**
\`\`\`typescript
{corrected code}
\`\`\`

## Validation
- [x] Can be changed in code
- [x] Supported by evidence
- [x] Explains all observed symptoms
- [x] Resolves cause, doesn't hide symptom
```
