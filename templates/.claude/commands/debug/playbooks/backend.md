# Playbook: Backend/Service

## Steps

1. **Identify** service/function via Grep (already done in basic exploration)

2. **Create script** `scripts/debug-{description}.ts`:
   ```typescript
   #!/usr/bin/env npx tsx
   import { config } from 'dotenv';
   config();
   // Service import
   // Call with bug inputs
   // console.log the result
   ```

3. **Execute**: `npx tsx scripts/debug-{description}.ts`

4. **Evidence**: Output showing incorrect behavior
