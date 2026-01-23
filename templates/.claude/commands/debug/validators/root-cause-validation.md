# Validator: Root Cause Validation

Validate root cause before proposing fix.

---

## Required Checklist

The identified root cause MUST pass ALL:

- [ ] Something you can CHANGE in code
- [ ] Supported by code evidence (file:line)
- [ ] Explains ALL symptoms observed in reproduction
- [ ] **Will the fix RESOLVE the problem, not just HIDE it?**
- [ ] **If a legitimate error occurs, will it still be reported?**

---

## Devil's Advocate Test

Before proceeding, answer:

1. **"In what situation could my fix go WRONG?"**
   Answer: [describe scenario]

2. **"Does my fix resolve the CAUSE or just hide the SYMPTOM?"**
   Answer: [CAUSE / SYMPTOM - if SYMPTOM, go back to Step 2]

3. **"If I add to an ignore list, why can't I fix the logic instead?"**
   Answer: [justify or admit you can fix the logic]

4. **"Does my fix survive a /deploy? And terraform apply? And VM restart?"**
   Answer: [YES to all / specify which fails]

---

## Proposed Fix Categorization

Classify your fix:
- [ ] **LOGIC CORRECTION**: Change incorrect behavior → Preferred
- [ ] **FILTER/IGNORE**: Add to ignore list → REQUIRES JUSTIFICATION
- [ ] **WORKAROUND**: Work around without solving → REQUIRES JUSTIFICATION

**IF FILTER or WORKAROUND**: Document why LOGIC CORRECTION is not possible.

---

## Decision Gate

**IF** validation fails: return to investigation with new hypothesis via Sequential Thinking.
