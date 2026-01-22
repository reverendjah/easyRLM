# Architecture

> **TIER 2 - STRUCTURAL**: Loaded when task involves architecture, modules, flows.
> Keywords that trigger: "architecture", "module", "flow", "integration", "how it works"

---

## Main Modules

| Module | Responsibility | Depends on |
|--------|----------------|------------|
| api | HTTP handlers, routing | services, auth |
| services | Business logic | models, external |
| models | Data types, validation | - |
| utils | Shared helpers | - |

---

## Data Flow

```
Request
   │
   ▼
┌──────────────┐
│  Middleware  │  Auth, Logging, RateLimit
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Handler    │  Input validation (Zod)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Service    │  Business logic
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Model     │  Data access
└──────┬───────┘
       │
       ▼
Response (JSON)
```

---

## API Patterns

### REST Conventions
- `GET /resources` - List (with pagination)
- `GET /resources/:id` - Detail
- `POST /resources` - Create
- `PUT /resources/:id` - Update (complete)
- `PATCH /resources/:id` - Update (partial)
- `DELETE /resources/:id` - Remove

### Pagination
```json
{
  "data": [...],
  "pagination": {
    "cursor": "abc123",
    "hasMore": true
  }
}
```

### Errors (RFC 7807)
```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Resource not found",
  "status": 404,
  "detail": "User with ID 123 was not found"
}
```

---

## External Integrations

| System | Purpose | Auth | Docs |
|--------|---------|------|------|
| Stripe | Payments | API Key | stripe.com/docs |
| SendGrid | Email | API Key | sendgrid.com/docs |
| AWS S3 | Storage | IAM Role | aws.amazon.com/s3 |

---

## Architectural Decisions

### ADR-001: {Title}
- **Status**: Accepted
- **Context**: {Why we needed to decide}
- **Decision**: {What we decided}
- **Consequences**: {Trade-offs}

---

*Last updated: {DATE}*
