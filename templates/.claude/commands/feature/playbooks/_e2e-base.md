# E2E Validation - Base

## Types

| Type | When | Flow |
|------|------|------|
| auto | UI, ready scripts | Direct command |
| semi-auto | APIs, webhooks | Claude trigger + poll + verify |
| hybrid | External integration | User action + Claude verifies |

---

## Verifications Claude Can Perform

| Type | How |
|------|-----|
| Database | Query per project syntax |
| API | `GET /api/resource` expect 200 |
| Logs | `grep "pattern" /logs/file` |
| File | `ls /path/to/file` |

---

## Failure Criteria

E2E FAILED if:
1. Timeout (auto/semi-auto: 60s, hybrid: 5min)
2. Success criteria not met
3. Unexpected error
4. User: "I can't" (hybrid)

---

## Recovery

IF E2E failed:
1. Ask user if they want to debug
2. IF yes: `/debug` workflow
3. IF no: continue (mark FAILED)
