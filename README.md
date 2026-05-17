# MyDon | Your Clever Finance Tracker

![Build](https://img.shields.io/github/actions/workflow/status/mydonapp/mydon/ci.yml?branch=main)
![License](https://img.shields.io/github/license/mydonapp/mydon)
![Docker Pulls](https://img.shields.io/docker/pulls/mydon/mydon?logo=docker)
![GitHub stars](https://img.shields.io/github/stars/mydonapp/mydon?style=social)

**MyDon** is an open-source personal finance tracker built for efficient and structured money management.
It helps individuals take control of their finances with a clean, simple interface—while still supporting advanced use cases like double-entry accounting.
I created MyDon because I couldn't find a tool that made it easy to import bank statements and manage finances with proper bookkeeping principles.

---

## 📦 Features

- 📥 **Bank CSV import** — PostFinance, Swisscard, Wise and Yuh statements, parsed into balanced journal entries you can review before posting
- 💼 **Proper double-entry bookkeeping** — every transaction is a header + ≥2 entries that balance on `baseAmount`; assets/liabilities/equity/income/expense account types with the correct debit/credit semantics
- ⏪ **Immutable posted transactions** — corrections happen via reversing transactions, preserving a full audit trail
- 🗓 **Activity windows on accounts** — `activeFrom` / `activeUntil` for scheduled activation/deactivation (year-end chart-of-accounts changes, SKR migrations) without manual intervention
- 🏷 **Account groups** — optional SKR-style hierarchy with codes and parent groups, used for grouping and budget rollups
- 🤖 **AI-assisted import** — similarity-matched account suggestions on draft imports
- 📊 **Budgeting** — monthly or yearly budgets per account or account-group, with progress and projections
- 💱 **Multi-currency entries** — each entry tracks its own currency + FX rate; balances roll up in the ledger's base currency
- 📁 **Data export** — full ZIP export with separate CSVs for accounts, transactions, entries, budgets, budget items, and account groups
- 🌍 **Multi-language** — English, German, French, Italian
- 🎨 **Theming** — light, dark and system theme with persisted user preferences
- 📱 **Native app** — iOS and desktop via Tauri, with configurable self-hosted API URL
- 🐳 **Self-hostable** — single Docker Compose stack

> 💡 Looking for an easy hosted version? Check out [mydon.app](https://mydon.app)

---

## 🚀 Quickstart (Self-Hosted)

To run Mydon locally with Docker, create a `docker-compose.yml` file:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: mydon
      POSTGRES_PASSWORD: mydonpass
      POSTGRES_DB: mydon
    ports:
      - '5432:5432'

  backend:
    image: maece/mydon.api:latest
    environment:
      DATABASE_URL: postgres://mydon:mydonpass@db:5432/mydon
      CORS_ORIGINS: http://localhost:4000
      ENABLE_API_DOCS: 'false'
    depends_on:
      - db
    ports:
      - '3000:3000'

  frontend:
    image: maece/mydon.app:latest
    volumes:
      # Point the frontend at your API — replace with your actual API URL
      - ./config.json:/usr/share/nginx/html/assets/config.json
    depends_on:
      - backend
    ports:
      - '4000:80'
```

Create a `config.json` next to your `docker-compose.yml`:

```json
{
  "apiUrl": "http://localhost:3000"
}
```

Then run:

```bash
docker-compose up
```

Once running:

🖥 Frontend → http://localhost:4000

⚙️ API → http://localhost:3000

📚 API Documentation → http://localhost:3000/api/docs (set `ENABLE_API_DOCS=true`)

---

## 🧑‍💻 Contributing

### 🔧 Local Development Guide

To run the full app locally for development or contributions:

1. **Set up environment variables:**

```bash
cp .env.example .env
```

Edit `.env` with your local configuration values.

2. **Install dependencies:**

```bash
pnpm install
```

3. **Start infrastructure (Postgres) via Docker:**

```bash
pnpm start:infra
```

4. **Start the backend API (NestJS):**

```bash
pnpm nx run api:serve:development
```

5. **Start the frontend app (Angular):**

```bash
pnpm nx run app:serve:development
```

Once running:

API: http://localhost:3000

API Documentation: http://localhost:3000/api/docs

Frontend: http://localhost:4200

### Tech Stack

| Layer    | Technology                            |
| -------- | ------------------------------------- |
| Frontend | Angular 21, Tailwind CSS v4, Tauri v2 |
| Backend  | NestJS 11, TypeORM, PostgreSQL        |
| Monorepo | Nx                                    |
| Native   | Tauri v2 (iOS + desktop)              |

## 📜 License

This project is licensed under the [MIT License](./LICENSE).

---

## 🤝 Support the Project

If you find MyDon useful, please consider supporting its development:

- ⭐ **Star this repository** — it helps others discover the project
- 🐛 **Report bugs** — help us improve by reporting issues
- 💡 **Suggest features** — share your ideas for new functionality
- 🔧 **Contribute code** — submit pull requests with improvements
