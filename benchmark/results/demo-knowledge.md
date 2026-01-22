# Project Knowledge

## Implementation Decisions

### Architecture
- **What authentication method did we choose?**
  - Decision: JWT with refresh tokens stored in httpOnly cookies
  - Reasoning: More secure than localStorage, works with SSR

### Database
- **How did we structure the user preferences table?**
  - Decision: JSONB column for flexible preferences, indexed on user_id
  - Reasoning: Allows adding new preferences without migrations

### Patterns
- **What error handling pattern did we adopt?**
  - Decision: Custom AppError class extending Error with statusCode and isOperational
  - Reasoning: Distinguishes between operational errors and bugs

- **Which validation library did we choose?**
  - Decision: Zod for runtime validation with TypeScript inference
  - Reasoning: Better TS integration than Joi, smaller bundle than Yup

### Testing
- **What testing framework are we using?**
  - Decision: Vitest with React Testing Library for components
  - Reasoning: Faster than Jest, native ESM support

### API
- **How are we versioning the API?**
  - Decision: URL path versioning (/api/v1/) with deprecation headers
  - Reasoning: Most explicit, easy to maintain parallel versions

### Performance
- **What caching strategy did we implement?**
  - Decision: Redis for session cache, in-memory LRU for computed values
  - Reasoning: Redis for distributed, LRU for hot path optimization

### Observability
- **What logging approach are we using?**
  - Decision: Structured JSON logs with pino, correlation IDs per request
  - Reasoning: Easy to parse in CloudWatch/Datadog, trace requests across services

### Feature
- **How are file uploads handled?**
  - Decision: Multipart to presigned S3 URLs, metadata in Postgres
  - Reasoning: Direct S3 upload reduces server load, scales better

- **What notification channels did we implement?**
  - Decision: Email via SendGrid, push via Firebase, in-app via WebSocket
  - Reasoning: Covers all use cases, all have good free tiers
