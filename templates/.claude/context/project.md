# {Project Name}

> **TIER 1 - CORE**: This file is ALWAYS loaded at session start.
> Keep concise (~50-100 lines). Essential information only.

---

## Description

{One sentence describing what the project does}

---

## Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Node.js / Python / Go | X.Y |
| Framework | Express / FastAPI / Gin | X.Y |
| Database | PostgreSQL / MongoDB | X.Y |
| Cloud | AWS / GCP / Azure | - |

---

## Commands

```bash
# Development
npm run dev

# Tests
npm test

# Build
npm run build

# Lint
npm run lint
```

---

## Folder Structure

```
src/
├── api/           # REST/GraphQL endpoints
├── services/      # Business logic
├── models/        # Types, schemas, entities
├── utils/         # Helpers and utilities
└── config/        # Configuration and constants
```

---

## Entry Points

| Type | File | Description |
|------|------|-------------|
| API | src/index.ts | Main HTTP server |
| Jobs | src/cron/index.ts | Scheduled tasks |
| CLI | src/cli.ts | Terminal commands |

---

## Critical Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| DATABASE_URL | DB connection | postgres://... |
| API_KEY | External API key | sk-... |

---

## Quality Gates

- [ ] Tests passing (`npm test`)
- [ ] Lint without errors (`npm run lint`)
- [ ] Build without errors (`npm run build`)
- [ ] Coverage > X%

---

*Last updated: {DATE}*
