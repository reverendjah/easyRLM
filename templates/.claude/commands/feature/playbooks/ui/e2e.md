# UI - E2E

## Recommended Type: auto (Playwright)

Visual flows tested via browser automation.

## Template

```markdown
## E2E Validation

**Type:** auto

**Script/Tool:** Playwright + functional-validator

**Scenario:**
- Given: User on page {page}
- When: User fills form and submits
- Then: {visual/functional result}

**Command:** `npm run test:e2e -- {file.spec.ts}`
```

## Playwright Pattern

```typescript
import { test, expect } from '@playwright/test';

test('should submit form successfully', async ({ page }) => {
  await page.goto('/feature');

  await page.fill('[name="title"]', 'Test Title');
  await page.fill('[name="description"]', 'Test Description');
  await page.click('button[type="submit"]');

  await expect(page.locator('.success-message')).toBeVisible();
  await expect(page).toHaveURL(/\/feature\/[a-z0-9]+/);
});
```

## Alternative: hybrid (fallback)
IF Playwright fails or is overkill:

```markdown
## E2E Validation

**Type:** hybrid

**User Action:**
- [ ] Navigate to {url}
- [ ] Execute {action}
- [ ] Visually confirm the result

**Claude Verifications:**
- [ ] API call: `GET /api/{resource}` returns expected data
- [ ] DB Query: verify persisted data

**Success Criteria:**
- [ ] User confirms UI worked
- [ ] Data persisted correctly
```
