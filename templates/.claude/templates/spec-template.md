# Spec: [Feature Name]

## Metadata
- **Date:** [YYYY-MM-DD]
- **Interview:** `.claude/interviews/[slug].md`
- **Acceptance Criteria Source:** Interview Phase 1

---

## Summary

[1-2 sentences describing what the feature does]

---

## Components

| Component | Type | Description |
|-----------|------|-------------|
| [name] | Service/Handler/Component | [description] |

---

## Code to Reuse

| Need | Existing Code | Action |
|------|---------------|--------|
| [what is needed] | [file:line] or "None" | Reuse/Extend/Create |

---

## Test Cases

### Acceptance Tests (MANDATORY)

| Acceptance Criterion (user) | Acceptance Test | Type |
|-----------------------------|-----------------|------|
| "[criterion 1 - user language]" | `it('[observable behavior]')` | Integration/E2E |
| "[criterion 2 - user language]" | `it('[observable behavior]')` | Integration/E2E |

**Mental validation:** If this test passes, would the user manually validate and be satisfied? ✓

### Unit Tests (if complex logic)

| Function | Test Case | Input → Output |
|----------|-----------|----------------|
| `[function]` | `[case]` | `[input]` → `[output]` |

### Integration Tests (if multi-service)

| Flow | Services Involved | Mock Strategy |
|------|-------------------|---------------|
| `[flow]` | `[services]` | `[what to mock]` |

### E2E Tests (if UI)

| Flow | Steps | Verification |
|------|-------|--------------|
| `[flow]` | `[steps]` | `[assertion]` |

---

## Mock Strategy

| Test Case | Mock Level | Mocked Services |
|-----------|------------|-----------------|
| [acceptance test 1] | integration | [only mandatory external] |
| [unit test 1] | unit | - |

### Mock Principles

- **Acceptance Tests:** Minimal mocks (only mandatory external services)
- **Unit Tests:** Allowed to isolate

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `[path]` | Create/Modify | `[description]` |

---

## Dependencies

- [ ] No new dependencies
- [ ] New dependency: `[name]` - Reason: [explanation]

---

## Identified Risks

| Risk | Mitigation |
|------|------------|
| [risk] | [how to mitigate] |

---

## Spec Checklist

- [ ] All Acceptance Criteria have corresponding Acceptance Test
- [ ] Acceptance Tests validate observable behavior (not implementation)
- [ ] Mocks for Acceptance Tests are minimal
- [ ] Existing code was mapped for reuse
- [ ] Files to create/modify are listed
