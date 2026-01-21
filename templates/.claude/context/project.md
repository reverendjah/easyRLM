# {Nome do Projeto}

> **TIER 1 - NUCLEO**: Este arquivo e SEMPRE carregado no inicio da sessao.
> Mantenha conciso (~50-100 linhas). Informacoes essenciais apenas.

---

## Descricao

{Uma frase descrevendo o que o projeto faz}

---

## Stack

| Camada | Tecnologia | Versao |
|--------|------------|--------|
| Runtime | Node.js / Python / Go | X.Y |
| Framework | Express / FastAPI / Gin | X.Y |
| Database | PostgreSQL / MongoDB | X.Y |
| Cloud | AWS / GCP / Azure | - |

---

## Comandos

```bash
# Desenvolvimento
npm run dev

# Testes
npm test

# Build
npm run build

# Lint
npm run lint
```

---

## Estrutura de Pastas

```
src/
├── api/           # Endpoints REST/GraphQL
├── services/      # Logica de negocio
├── models/        # Types, schemas, entities
├── utils/         # Helpers e funcoes utilitarias
└── config/        # Configuracoes e constantes
```

---

## Entry Points

| Tipo | Arquivo | Descricao |
|------|---------|-----------|
| API | src/index.ts | Servidor HTTP principal |
| Jobs | src/cron/index.ts | Tarefas agendadas |
| CLI | src/cli.ts | Comandos de terminal |

---

## Variaveis de Ambiente Criticas

| Variavel | Proposito | Exemplo |
|----------|-----------|---------|
| DATABASE_URL | Conexao com DB | postgres://... |
| API_KEY | Chave de API externa | sk-... |

---

## Quality Gates

- [ ] Testes passando (`npm test`)
- [ ] Lint sem erros (`npm run lint`)
- [ ] Build sem erros (`npm run build`)
- [ ] Coverage > X%

---

*Ultima atualizacao: {DATA}*
