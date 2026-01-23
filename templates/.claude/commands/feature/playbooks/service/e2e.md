# Service - E2E

## Recommended Type: auto (integration test)

Services are tested via existing integration tests.

## Template

```markdown
## E2E Validation

**Type:** auto

**Script/Tool:** existing integration test

**Scenario:**
- Given: {precondition}
- When: service.execute({input})
- Then: {expected result}

**Command:** `npm test -- --grep "{test-name}"`
```

## Alternative: hybrid
IF depends on external system that can't be mocked.
