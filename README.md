<div align="center">
  <img src="Assets/logo.png" alt="FIMA logo" width="108" />
  <h1>FIMA — Smart Finance Management</h1>
  <p><strong>A connected operations workspace for inventory, suppliers, purchasing, and finance-aware business decisions.</strong></p>
  <p>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&amp;logoColor=white" alt="React 18" /></a>
    <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&amp;logoColor=white" alt="Vite 5" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&amp;logoColor=white" alt="Node.js 18+" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-4-000000?logo=express&amp;logoColor=white" alt="Express 4" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&amp;logoColor=white" alt="PostgreSQL" /></a>
  </p>
  <p>
    <a href="https://financeweb-24k3fxgwy-oshada-s-projects.vercel.app/">Live demo</a> ·
    <a href="#-features">Features</a> ·
    <a href="#-quick-start">Quick start</a> ·
    <a href="#-api-reference">API</a>
  </p>
</div>

<br />

<img src="Assets/image%204.png" alt="FIMA smart finance management banner" width="100%" />

## Overview

FIMA is a full-stack business operations platform built for growing companies. It combines company onboarding with a detailed inventory control system, supplier and purchase-request workflows, daily operational summaries, and an AI-assisted market insights panel.

The current release focuses on the **Inventory** module. Production, Sales, and Financials are represented in the product shell and are planned for future releases.

## ✨ Features

| Area | Capabilities | Status |
| --- | --- | :---: |
| Company access | Multi-step registration, secure password hashing, login, email verification codes, and password reset | ✅ |
| Inventory overview | Daily/range summaries, stock status, reorder alerts, purchase alerts, and flow metrics | ✅ |
| Raw materials | Create materials, track quantities, reorder thresholds, units, cost, and status | ✅ |
| Stock movement | Record intake, production issues, waste, and supplier returns | ✅ |
| FIFO costing | Maintain intake batches and calculate issue, waste, and return costs from the oldest available stock | ✅ |
| Suppliers | Maintain supplier contact details and material associations | ✅ |
| Purchase requests | Email suppliers with expiring approve/reject links and track request status | ✅ |
| Market assistant | Ask concise questions about trends, pricing, and business insights through Groq | ✅ |
| Production, Sales, Financials | Connected modules shown in the dashboard shell | 🛣️ Roadmap |

## 🖼️ Product modules

<table>
  <tr>
    <td align="center" width="25%"><img src="Assets/inventory.png" alt="Inventory module" width="150" /><br /><strong>Inventory</strong><br /><sub>Materials, stock flow, FIFO, suppliers</sub></td>
    <td align="center" width="25%"><img src="Assets/production.png" alt="Production module" width="180" /><br /><strong>Production</strong><br /><sub>Recipes, requirements, costing</sub></td>
    <td align="center" width="25%"><img src="Assets/sales.png" alt="Sales module" width="180" /><br /><strong>Sales</strong><br /><sub>Revenue and customer activity</sub></td>
    <td align="center" width="25%"><img src="Assets/financials.png" alt="Financials module" width="180" /><br /><strong>Financials</strong><br /><sub>Accounts, transactions, cash flow</sub></td>
  </tr>
</table>

## 🏗️ Architecture

```mermaid
flowchart LR
    U[Business user] -->|HTTPS| UI[React 18 + Vite SPA]
    UI -->|JSON / REST| API[Express API]

    subgraph Backend[Node.js backend]
        API --> C[Controllers]
        C --> S[Business services]
        S --> R[Repositories]
    end

    R -->|SQL via pg| DB[(PostgreSQL)]
    S -->|SMTP| MAIL[Supplier & reset emails]
    S -->|Chat completion| GROQ[Groq API]

    DB --- D1[Companies & reset codes]
    DB --- D2[Materials, FIFO & stock events]
    DB --- D3[Suppliers & purchase requests]
    DB --- D4[Daily inventory summaries]
```

The backend follows a layered `route → controller → service → repository` design. Controllers translate HTTP requests, services enforce workflow rules, and repositories contain PostgreSQL access.

### Inventory lifecycle

```mermaid
flowchart TD
    M[Create raw material] --> S{Stock source}
    S -->|Supplier delivery| I[Record stock intake]
    I --> F[Create FIFO batch]
    F --> Q[Increase on-hand quantity and value]
    Q --> D{Operational decision}
    D -->|Use in production| O[Issue oldest FIFO stock]
    D -->|Damaged or expired| W[Record FIFO waste]
    D -->|Return to supplier| R[Record batch return]
    O --> U[Update balances and daily summary]
    W --> U
    R --> E[Email supplier]
    E --> U
    U --> L{At or below reorder level?}
    L -->|Yes| P[Create purchase request]
    P --> A[Supplier approves or rejects by secure link]
    L -->|No| Q
```

## 🧰 Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 5, native Fetch API, custom CSS |
| Backend | Node.js, Express 4, CommonJS |
| Database | PostgreSQL with `pg` connection pooling |
| Authentication | `bcryptjs` password hashing and company registration number login |
| Email | Nodemailer over SMTP |
| AI assistant | Groq OpenAI-compatible chat completions API |
| IDs | UUID v4 |
| Deployment | Vercel multi-service configuration |

## 📁 Project structure

```text
Finance-Web/
├── Assets/                 # README and brand imagery
├── backend/
│   ├── config/             # Local JSON configuration
│   └── src/
│       ├── config/         # Database and email config loaders
│       ├── controllers/    # HTTP handlers
│       ├── repositories/   # PostgreSQL queries
│       ├── routes/         # Express routes
│       ├── services/       # Business rules and integrations
│       └── server.js       # API entry point
├── database/
│   └── schema.sql          # Current schema reference
├── frontend/
│   ├── public/             # Runtime application images
│   └── src/
│       ├── components/     # Shared React components
│       ├── pages/          # Auth, home, and inventory views
│       ├── api.js          # Frontend API client
│       └── styles.css      # Application styling
├── vercel.json
└── README.md
```

## 🚀 Quick start

### Prerequisites

- Node.js 18 or newer
- npm
- A PostgreSQL database
- SMTP credentials for email workflows
- A Groq API key for the market assistant (optional if chat is not used)

### 1. Clone and install

```bash
git clone <your-repository-url>
cd Finance-Web

cd backend
npm install

cd ../frontend
npm install
```

### 2. Prepare PostgreSQL

Provision a PostgreSQL database containing the tables described in [`database/schema.sql`](database/schema.sql). The file is currently a **schema reference snapshot**: review table order and constraints before using it as a migration in a new database.

### 3. Configure the backend

The API accepts environment variables or the JSON files in `backend/config/`. Environment variables take precedence when `overrideEnv` is enabled.

Create `backend/.env`:

```dotenv
PORT=8080

# Database — use DATABASE_URL or the individual POSTGRES_* values
DATABASE_URL=postgresql://postgres:password@localhost:5432/fima
POSTGRES_SSL=false
POSTGRES_SSL_REJECT_UNAUTHORIZED=false

# SMTP email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_ENABLE_SSL=true
EMAIL_USERNAME=your-smtp-user
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM=FIMA <no-reply@example.com>
EMAIL_SUBJECT=Purchase Request
PURCHASE_ACTION_BASE_URL=http://localhost:8080/api/purchase-requests/action

# Market assistant
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.1-8b-instant
```

> Never commit real database, SMTP, or API credentials. Keep production secrets in your deployment platform's environment settings.

### 4. Configure the frontend

Create `frontend/.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

### 5. Run both services

Open two terminals from the repository root.

```bash
# Terminal 1 — API at http://localhost:8080
cd backend
npm start
```

```bash
# Terminal 2 — Vite development server
cd frontend
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). Check API availability at `http://localhost:8080/health`.

## ⚙️ Environment reference

| Variable | Required | Default | Purpose |
| --- | :---: | --- | --- |
| `PORT` | No | `8080` | Express server port |
| `DATABASE_URL` | Yes* | — | PostgreSQL connection string |
| `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`, `POSTGRES_PORT` | Yes* | Mixed | Alternative database configuration |
| `POSTGRES_SSL` | No | `true` | Enable TLS for PostgreSQL |
| `POSTGRES_SSL_REJECT_UNAUTHORIZED` | No | `false` | Verify the database TLS certificate |
| `EMAIL_HOST`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_FROM` | Yes** | — | SMTP connection and sender |
| `EMAIL_PORT` | No | `587` | SMTP port |
| `EMAIL_ENABLE_SSL` | No | `true` | Enable SMTP TLS |
| `EMAIL_SUBJECT` | No | `Purchase Request` | Default purchase email subject |
| `PURCHASE_ACTION_BASE_URL` | Yes** | — | Public API URL used for approve/reject links |
| `GROQ_API_KEY` | Yes*** | — | Enables the market assistant |
| `GROQ_MODEL` | No | `llama-3.1-8b-instant` | Groq model identifier |
| `VITE_API_BASE_URL` | No | `http://localhost:8080` | Browser-facing API origin |

- \* Configure either `DATABASE_URL` or the `POSTGRES_*` connection values.
- \** Required for password reset, purchase-request email, and return notification workflows.
- \*** Required only when using the market assistant.

## 🔌 API reference

All successful and error responses are JSON unless the endpoint is an email action page.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | API health check |
| `POST` | `/api/companies/register` | Register a company |
| `POST` | `/api/companies/login` | Sign in with registration number and password |
| `POST` | `/api/companies/forgot-password` | Email a reset verification code |
| `POST` | `/api/companies/verify-reset-code` | Verify a reset code |
| `POST` | `/api/companies/reset-password` | Set a new password |
| `GET`, `POST` | `/api/raw-materials` | List or create raw materials |
| `GET`, `POST` | `/api/stock-intakes` | List or record incoming stock |
| `GET`, `POST` | `/api/stock-issues` | List or issue stock using FIFO |
| `GET` | `/api/fifo?materialId=:id` | List available FIFO batches |
| `GET`, `POST` | `/api/waste-stocks` | List or record wasted stock |
| `GET`, `POST` | `/api/return-stocks` | List or create supplier returns |
| `GET` | `/api/return-stocks/batches?materialId=:id` | List returnable batches |
| `GET`, `POST` | `/api/suppliers` | List/filter or create suppliers |
| `GET`, `POST` | `/api/purchase-requests` | List or create purchase requests |
| `GET` | `/api/purchase-requests/action` | Process an emailed approve/reject token |
| `GET` | `/api/inventory-summary?date=YYYY-MM-DD` | Get a daily inventory summary |
| `GET` | `/api/inventory-summary?range=:range` | Get a summary range |
| `POST` | `/api/chat` | Send a message to the market assistant |

## 🧪 Available scripts

| Location | Command | Description |
| --- | --- | --- |
| `frontend` | `npm run dev` | Start the Vite development server |
| `frontend` | `npm run build` | Create a production frontend build |
| `frontend` | `npm run preview` | Preview the production build locally |
| `backend` | `npm start` | Start the Express API |

No automated test or lint scripts are configured yet.

## 🔐 Security notes

- Passwords are hashed with bcrypt before persistence.
- Purchase actions use UUID tokens with a seven-day expiry and one-time-use state.
- Password reset codes expire after ten minutes.
- The frontend currently stores the authenticated company only in React state; the API does not yet issue sessions or access tokens.
- Add request authentication/authorization, strict CORS origins, rate limiting, input schemas, and security headers before production use.
- The registration UI prepares image data, but the current company schema does not persist company images.

## 🗺️ Roadmap

- [ ] Add authenticated sessions and route protection
- [ ] Complete Production, Sales, and Financials modules
- [ ] Convert the schema snapshot into ordered, repeatable migrations
- [ ] Add unit, integration, and end-to-end tests
- [ ] Add validation, rate limiting, and audit logging
- [ ] Add reporting exports and richer dashboard charts
- [ ] Add CI checks and deployment documentation

## 🤝 Contributing

1. Create a focused branch from the default branch.
2. Keep frontend and backend changes scoped and documented.
3. Run `npm run build` in `frontend` and manually verify affected API workflows.
4. Open a pull request describing the behavior change and test evidence.

---

<div align="center">
  Built to turn stock movement into clearer financial decisions.
</div>
