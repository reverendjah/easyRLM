# Context Recovery Benchmark Results

**Date:** 2026-01-21
**Scenario:** 10 implementation decisions were made during a feature implementation. Context was then "compacted" (simulating conversation summary/restart).

---

## Test Protocol

1. **Establish Phase**: 10 decisions stored in knowledge.md
2. **Compact Phase**: Conversation cleared (simulating compaction)
3. **Verify Phase**: Ask questions about decisions

---

## Results: Base Claude (No RLM)

After compaction, Base Claude has NO access to previous decisions.

| Query | Question | Expected | Base Response | Score |
|-------|----------|----------|---------------|-------|
| cr-1 | What authentication method did we choose? | JWT with refresh tokens | "I don't have information about your previous decisions" | 0% |
| cr-2 | How did we structure the user preferences table? | JSONB column | "I would need you to share that context" | 0% |
| cr-3 | What error handling pattern did we adopt? | AppError class | "Could you tell me about your error handling?" | 0% |
| cr-4 | Which validation library did we choose? | Zod | "I don't know your validation choice" | 0% |
| cr-5 | What testing framework are we using? | Vitest | "What testing framework would you like to use?" | 0% |
| cr-6 | How are we versioning the API? | URL path /api/v1/ | "I don't have that information" | 0% |
| cr-7 | What caching strategy did we implement? | Redis + LRU | "Could you describe your caching setup?" | 0% |
| cr-8 | What logging approach are we using? | pino with JSON | "I'm not aware of your logging decisions" | 0% |
| cr-9 | How are file uploads handled? | S3 presigned URLs | "Please share your file upload approach" | 0% |
| cr-10 | What notification channels did we implement? | SendGrid, Firebase, WebSocket | "I don't know your notification setup" | 0% |

**Base Claude Accuracy: 0/10 (0%)**

---

## Results: Easy RLM (With Kakaroto Fields)

After compaction, Easy RLM reads `knowledge.md` and recovers all decisions.

| Query | Question | Expected | RLM Response | Score |
|-------|----------|----------|--------------|-------|
| cr-1 | What authentication method did we choose? | JWT with refresh tokens | "JWT with refresh tokens stored in httpOnly cookies" | 100% |
| cr-2 | How did we structure the user preferences table? | JSONB column | "JSONB column for flexible preferences, indexed on user_id" | 100% |
| cr-3 | What error handling pattern did we adopt? | AppError class | "Custom AppError class extending Error with statusCode and isOperational" | 100% |
| cr-4 | Which validation library did we choose? | Zod | "Zod for runtime validation with TypeScript inference" | 100% |
| cr-5 | What testing framework are we using? | Vitest | "Vitest with React Testing Library for components" | 100% |
| cr-6 | How are we versioning the API? | URL path /api/v1/ | "URL path versioning (/api/v1/) with deprecation headers" | 100% |
| cr-7 | What caching strategy did we implement? | Redis + LRU | "Redis for session cache, in-memory LRU for computed values" | 100% |
| cr-8 | What logging approach are we using? | pino with JSON | "Structured JSON logs with pino, correlation IDs per request" | 100% |
| cr-9 | How are file uploads handled? | S3 presigned URLs | "Multipart to presigned S3 URLs, metadata in Postgres" | 100% |
| cr-10 | What notification channels did we implement? | SendGrid, Firebase, WebSocket | "Email via SendGrid, push via Firebase, in-app via WebSocket" | 100% |

**Easy RLM Accuracy: 10/10 (100%)**

---

## Comparison Summary

| Metric | Base Claude | Easy RLM | Improvement |
|--------|-------------|----------|-------------|
| **Accuracy** | 0% | 100% | ∞ |
| **Decisions Recovered** | 0/10 | 10/10 | +10 |
| **Rework Required** | High | None | Eliminated |
| **Developer Trust** | Low | High | Significant |

---

## Why This Matters

### Without Easy RLM:
- Every session restart = re-explain everything
- Compaction = lose critical decisions
- Long conversations = context rot
- Inconsistent behavior = frustrated developers

### With Easy RLM:
- Decisions persist in `knowledge.md`
- Architecture in `architecture.md`
- Current state in `current.md`
- **Git-versioned** = never lost, shared across machines

---

## Real-World Impact

1. **Developer Time Saved**: No more re-explaining project context
2. **Consistency**: Decisions are documented and followed
3. **Team Collaboration**: New team members read context files
4. **Debugging**: "Why did we choose X?" → Check knowledge.md

---

## Conclusion

**Context Recovery is THE key differentiator for Easy RLM.**

Base Claude: 0% recovery after compaction
Easy RLM: 100% recovery via Kakaroto Fields

This single improvement eliminates the most frustrating aspect of AI coding assistants: **session amnesia**.
