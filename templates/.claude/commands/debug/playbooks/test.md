# Playbook: Test

## Steps

1. **Run isolated test**:
   ```bash
   npm test -- --testPathPattern="{file}"
   ```

2. **Identify** failing assertion in output

3. **IF** necessary: add temporary console.logs

4. **Evidence**: Stack trace with assertion line
