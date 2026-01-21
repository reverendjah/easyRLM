# Arquitetura

> **TIER 2 - ESTRUTURAL**: Carregado quando task envolve arquitetura, modulos, fluxos.
> Keywords que ativam: "arquitetura", "modulo", "fluxo", "integracao", "como funciona"

---

## Modulos Principais

| Modulo | Responsabilidade | Depende de |
|--------|------------------|------------|
| api | HTTP handlers, routing | services, auth |
| services | Business logic | models, external |
| models | Data types, validation | - |
| utils | Shared helpers | - |

---

## Fluxo de Dados

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
│   Handler    │  Validacao de input (Zod)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Service    │  Logica de negocio
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Model     │  Acesso a dados
└──────┬───────┘
       │
       ▼
Response (JSON)
```

---

## Padroes de API

### REST Conventions
- `GET /resources` - Listar (com paginacao)
- `GET /resources/:id` - Detalhe
- `POST /resources` - Criar
- `PUT /resources/:id` - Atualizar (completo)
- `PATCH /resources/:id` - Atualizar (parcial)
- `DELETE /resources/:id` - Remover

### Paginacao
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

## Integracoes Externas

| Sistema | Proposito | Auth | Docs |
|---------|-----------|------|------|
| Stripe | Pagamentos | API Key | stripe.com/docs |
| SendGrid | Email | API Key | sendgrid.com/docs |
| AWS S3 | Storage | IAM Role | aws.amazon.com/s3 |

---

## Decisoes Arquiteturais

### ADR-001: {Titulo}
- **Status**: Aceito
- **Contexto**: {Por que precisavamos decidir}
- **Decisao**: {O que decidimos}
- **Consequencias**: {Trade-offs}

---

*Ultima atualizacao: {DATA}*
