<div align="center">
  <img src="Assets/logo.png" alt="FIMA logo" width="110" />

  # FIMA — Smart Finance Management

  **A connected operations workspace for inventory, suppliers, purchasing, and finance-aware decisions.**

  [![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4-111111?logo=express&logoColor=white)](https://expressjs.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

  [Live demo](https://financeweb-24k3fxgwy-oshada-s-projects.vercel.app/) · [Features](#features) · [Architecture](#architecture) · [Quick start](#quick-start) · [API](#api-reference)
</div>

<br />

<img src="Assets/image%204.png" alt="FIMA dashboard banner" width="100%" />

## About FIMA

FIMA is a full-stack business operations platform for tracking raw materials from purchase request to consumption. It combines company onboarding, supplier management, FIFO inventory costing, stock movement, operational summaries, email workflows, and an AI-assisted market insights panel in one interface.

> **Current scope:** Inventory is the active module. Production, Sales, and Financials are visible in the application shell and remain on the roadmap.

## Features

| Area | What FIMA provides | Status |
| --- | --- | :---: |
| Company access | Registration, bcrypt password hashing, login, email reset codes, and password reset | ✅ |
| Inventory overview | Daily/range summaries, stock health, reorder alerts, purchase alerts, and flow metrics | ✅ |
| Raw materials | Quantities, units, costs, reorder thresholds, total value, and status | ✅ |
| Stock movement | Intake, production issues, waste, and supplier returns | ✅ |
| FIFO costing | Batch tracking and oldest-stock-first costing for every outgoing movement | ✅ |
| Suppliers | Contact details and material associations | ✅ |
| Purchase requests | Email requests with expiring approve/reject links and status tracking | ✅ |
| Market assistant | Trend, pricing, and business insights through Groq | ✅ |
| Production, Sales, Financials | Connected modules in the dashboard shell | 🛣️ Planned |

## Product modules

<table>
  <tr>
    <td align="center" width="25%"><img src="Assets/inventory.png" alt="Inventory module" width="145" /><br /><strong>Inventory</strong><br /><sub>Materials, FIFO, suppliers, stock flow</sub></td>
    <td align="center" width="25%"><img src="Assets/production.png" alt="Production module" width="170" /><br /><strong>Production</strong><br /><sub>Recipes, requirements, costing</sub></td>
    <td align="center" width="25%"><img src="Assets/sales.png" alt="Sales module" width="170" /><br /><strong>Sales</strong><br /><sub>Revenue and customer activity</sub></td>
    <td align="center" width="25%"><img src="Assets/financials.png" alt="Financials module" width="170" /><br /><strong>Financials</strong><br /><sub>Accounts, transactions, cash flow</sub></td>
  </tr>
</table>

## Architecture

<div align="center">
  <img src="Assets/architecture-flow.svg" alt="Animated FIMA architecture data-flow diagram" width="100%" />
</div>

The backend follows a `route → controller → service → repository` design. Routes define the HTTP surface, controllers translate requests, services enforce workflows, and repositories isolate PostgreSQL queries.

```mermaid
flowchart LR
    Browser[React + Vite SPA] -->|JSON / REST| Routes[Express routes]
    Routes --> Controllers
    Controllers --> Services
    Services --> Repositories
    Repositories --> DB[(PostgreSQL)]
    Services --> SMTP[SMTP email]
    Services --> Groq[Groq API]
```

### Inventory lifecycle

<div align="center">
  <img src="Assets/inventory-lifecycle.svg" alt="Animated inventory and FIFO lifecycle diagram" width="100%" />
</div>

FIFO is the center of inventory valuation. Each intake creates a costed batch; issues, waste, and supplier returns reduce the oldest eligible batch before material balances and daily summaries are updated.

### Core data model

```mermaid
erDiagram
    RAW_MATERIALS {
      text MaterialId PK
      numeric CurrentQuantity
      numeric ReorderLevel
      numeric UnitCost
    }
    SUPPLIERS {
      text SupplierId PK
      text Email
    }
    SUPPLIER_MATERIALS {
      text MaterialLinkId PK
      text SupplierId FK
      text MaterialName
    }
    PURCHASE_REQUESTS {
      text RequestId PK
      text SupplierId FK
      text Status
      uuid action_token
    }
    STOCK_INTAKES {
      text IntakeId PK
      text MaterialId FK
      text SupplierId FK
      numeric Quantity
    }
    FIFO {
      text FifoId PK
      text IntakeId FK
      text MaterialId FK
      numeric RemainingQuantity
    }
    STOCK_ISSUES {
      text IssueId PK
      text MaterialId FK
    }
    WASTE_STOCKS {
      text wasteid PK
      text fifoid FK
    }
    RETURN_STOCKS {
      text ReturnId PK
      text FifoId FK
      text SupplierId FK
    }

    SUPPLIERS ||--o{ SUPPLIER_MATERIALS : supplies
    SUPPLIERS ||--o{ PURCHASE_REQUESTS : receives
    SUPPLIERS ||--o{ STOCK_INTAKES : delivers
    RAW_MATERIALS ||--o{ STOCK_INTAKES : receives
    STOCK_INTAKES ||--|| FIFO : creates
    RAW_MATERIALS ||--o{ FIFO : batches
    RAW_MATERIALS ||--o{ STOCK_ISSUES : consumed_as
    FIFO ||--o{ WASTE_STOCKS : records
    FIFO ||--o{ RETURN_STOCKS : returned_from
    SUPPLIERS ||--o{ RETURN_STOCKS : receives
```

### Purchase approval sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as React UI
    participant API as Express API
    participant DB as PostgreSQL
    participant Mail as SMTP
    actor Supplier

    User->>UI: Create purchase request
    UI->>API: POST /api/purchase-requests
    API->>DB: Save request + expiring token
    API->>Mail: Send approve/reject links
    Mail-->>Supplier: Purchase request email
    Supplier->>API: Open action link
    API->>DB: Validate token and update status
    API-->>Supplier: Show action result
    UI->>API: GET /api/purchase-requests
    API-->>UI: Latest request status
```

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 5, Fetch API, custom CSS |
| Backend | Node.js, Express 4, CommonJS |
| Data | PostgreSQL and `pg` connection pooling |
| Authentication | `bcryptjs` and company registration number login |
| Email | Nodemailer over SMTP |
| AI assistant | Groq OpenAI-compatible chat completions |
| Deployment | Vercel multi-service configuration |

## Project structure

```text
Finance-Web/
├── Assets/                   # README imagery and animated diagrams
├── backend/
│   ├── config/               # Local JSON configuration
│   └── src/
│       ├── config/           # Database and email config loaders
│       ├── controllers/      # HTTP handlers
│       ├── repositories/     # PostgreSQL queries
│       ├── routes/           # REST endpoints
│       ├── services/         # Workflows and integrations
│       └── server.js         # Express entry point
├── database/
│   └── schema.sql            # Schema reference snapshot
├── frontend/
│   ├── public/               # Application images
│   └── src/
│       ├── components/       # Shared React components
│       ├── pages/            # Auth, home, inventory
│       ├── api.js            # Browser API client
│       └── styles.css        # Application styling
├── vercel.json
└── README.md
```

## Quick start

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL
- SMTP credentials for email workflows
- A Groq API key if the market assistant is required

### 1. Clone and install

```bash
git clone https://github.com/Oshadashashinidu/Finance-Web.git
cd Finance-Web

cd backend
npm install

cd ../frontend
npm install
```

### 2. Prepare PostgreSQL

Create a PostgreSQL database matching [`database/schema.sql`](database/schema.sql). The file is a schema reference snapshot, so review its table order and constraints before treating it as a migration.

### 3. Configure the API

Create `backend/.env`:

```dotenv
PORT=8080

# Use DATABASE_URL or the individual POSTGRES_* variables
DATABASE_URL=postgresql://postgres:password@localhost:5432/fima
POSTGRES_SSL=false
POSTGRES_SSL_REJECT_UNAUTHORIZED=false

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_ENABLE_SSL=true
EMAIL_USERNAME=your-smtp-user
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM=FIMA <no-reply@example.com>
PURCHASE_ACTION_BASE_URL=http://localhost:8080/api/purchase-requests/action

GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.1-8b-instant
```

### 4. Configure the frontend

Create `frontend/.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

### 5. Run FIMA

Start the API and frontend in separate terminals:

```bash
# Terminal 1 — http://localhost:8080
cd backend
npm start
```

```bash
# Terminal 2 — normally http://localhost:5173
cd frontend
npm run dev
```

Open the URL printed by Vite. Check the API at `http://localhost:8080/health`.

## Environment variables

| Variable | Required | Default | Purpose |
| --- | :---: | --- | --- |
| `PORT` | No | `8080` | Express server port |
| `DATABASE_URL` | Yes* | — | PostgreSQL connection string |
| `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`, `POSTGRES_PORT` | Yes* | Mixed | Individual database settings |
| `POSTGRES_SSL` | No | `true` | Enable PostgreSQL TLS |
| `POSTGRES_SSL_REJECT_UNAUTHORIZED` | No | `false` | Verify the database TLS certificate |
| `EMAIL_HOST`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_FROM` | Yes** | — | SMTP server and sender |
| `EMAIL_PORT` | No | `587` | SMTP port |
| `EMAIL_ENABLE_SSL` | No | `true` | Enable SMTP TLS |
| `EMAIL_SUBJECT` | No | `Purchase Request` | Default email subject |
| `PURCHASE_ACTION_BASE_URL` | Yes** | — | Public approve/reject endpoint |
| `GROQ_API_KEY` | Yes*** | — | Enable the market assistant |
| `GROQ_MODEL` | No | `llama-3.1-8b-instant` | Groq model identifier |
| `VITE_API_BASE_URL` | No | `http://localhost:8080` | Browser-facing API origin |

\* Configure `DATABASE_URL` or the individual `POSTGRES_*` values.<br />
\** Required for email-based workflows.<br />
\*** Required only for chat.

> Keep real database, SMTP, and API credentials out of Git. Store production secrets in the deployment platform.

## API reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Check API availability |
| `POST` | `/api/companies/register` | Register a company |
| `POST` | `/api/companies/login` | Sign in |
| `POST` | `/api/companies/forgot-password` | Email a reset code |
| `POST` | `/api/companies/verify-reset-code` | Verify a reset code |
| `POST` | `/api/companies/reset-password` | Set a new password |
| `GET`, `POST` | `/api/raw-materials` | List or create raw materials |
| `GET`, `POST` | `/api/stock-intakes` | List or record incoming stock |
| `GET`, `POST` | `/api/stock-issues` | List or issue FIFO stock |
| `GET` | `/api/fifo?materialId=:id` | List available FIFO batches |
| `GET`, `POST` | `/api/waste-stocks` | List or record waste |
| `GET`, `POST` | `/api/return-stocks` | List or create supplier returns |
| `GET` | `/api/return-stocks/batches?materialId=:id` | List returnable batches |
| `GET`, `POST` | `/api/suppliers` | List/filter or create suppliers |
| `GET`, `POST` | `/api/purchase-requests` | List or create purchase requests |
| `GET` | `/api/purchase-requests/action` | Process an approve/reject token |
| `GET` | `/api/inventory-summary?date=YYYY-MM-DD` | Get one daily summary |
| `GET` | `/api/inventory-summary?range=:range` | Get a summary range |
| `POST` | `/api/chat` | Ask the market assistant |

## Scripts

| Location | Command | Description |
| --- | --- | --- |
| `frontend` | `npm run dev` | Start Vite development mode |
| `frontend` | `npm run build` | Build the production frontend |
| `frontend` | `npm run preview` | Preview the frontend build |
| `backend` | `npm start` | Start the Express API |

No automated test or lint scripts are configured yet.

## Security notes

- Passwords are hashed with bcrypt before storage.
- Purchase actions use UUID tokens with a seven-day expiry and one-time-use state.
- Password reset codes expire after ten minutes.
- The frontend currently keeps the authenticated company only in React state; the API does not issue a session or access token.
- Add authorization, strict CORS origins, request validation, rate limiting, and security headers before production use.

## Roadmap

- [ ] Add authenticated sessions and route protection
- [ ] Complete Production, Sales, and Financials
- [ ] Convert the schema snapshot into repeatable migrations
- [ ] Add unit, integration, and end-to-end tests
- [ ] Add validation, rate limiting, and audit logging
- [ ] Add reporting exports and richer charts
- [ ] Add CI checks and deployment documentation

## Contributing

1. Create a focused branch from the default branch.
2. Keep frontend and backend changes scoped and documented.
3. Run `npm run build` in `frontend` and manually verify affected API workflows.
4. Open a pull request with the behavior change and verification evidence.

---

<div align="center">
  Built to turn stock movement into clearer financial decisions.
</div>
