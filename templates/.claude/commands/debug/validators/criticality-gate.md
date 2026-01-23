# Validator: Criticality Gate

Criticality gate - critical paths require approval.

---

## Critical Paths List

```
CRITICAL_PATHS:
- **/auth/**
- **/payment/**
- **/migration*/**
- **/oauth*
- **/credential*
- **/secret*
- api/middleware.ts
- services/*Service.ts (core services)
```

---

## Decision Gate

**IF** affected files ∩ CRITICAL_PATHS **not empty**:

1. Document planned fix:
   - Root cause (with evidence)
   - Files to modify
   - Proposed changes
   - Identified risks

2. Call `EnterPlanMode`
   - Write fix plan in `.claude/plans/debug-fix-{timestamp}.md`
   - User approves or rejects via ExitPlanMode

3. After approval: Proceed to implementation

**ELSE** (not critical):
Proceed directly to implementation (full autonomy)
