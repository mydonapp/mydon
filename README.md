# MyDon | Your Clever Finance Tracker

![Build](https://img.shields.io/github/actions/workflow/status/mydonapp/mydon/ci.yml?branch=main)
![License](https://img.shields.io/github/license/mydonapp/mydon)
![Docker Pulls](https://img.shields.io/docker/pulls/mydon/mydon?logo=docker)
![GitHub stars](https://img.shields.io/github/stars/mydonapp/mydon?style=social)

**Mydon** is an open-source personal finance tracker built for efficient and structured money management.
It helps individuals take control of their finances with a clean, simple interface—while still supporting advanced use cases like double-entry accounting.
I created Mydon because I couldn't find a tool that made it easy to import bank statements and manage finances with proper bookkeeping principles.

---

## 📦 Features

- 📥 **Bank CSV Import**
- 💼 **Double-entry bookkeeping**
- 🏷 **Manual/Automatic categorization and tagging**
- 📊 **Monthly & category-based spending analytics**
- 📁 **Data export (CSV/Excel)**
- 📱 **Mobile-ready** (built with Vue + Capacitor)
- 🐳 **Self-hostable with Docker**

> 💡 Looking for an easy hosted version? Check out [mydon.app](https://mydon.app)

---

## 🚀 Quickstart (Self-Hosted)

To run Mydon locally with Docker, create a `docker-compose.yml` file:

```yaml
version: "3.8"

services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: mydon
      POSTGRES_PASSWORD: mydonpass
      POSTGRES_DB: mydon
    ports:
      - "5432:5432"

  backend:
    image: mydon/mydon-api:latest
    environment:
      DATABASE_URL: postgres://mydon:mydonpass@db:5432/mydon
    depends_on:
      - db
    ports:
      - "3000:3000"

  frontend:
    image: mydon/mydon-app:latest
    environment:
      VITE_API_URL: http://localhost:3000
    depends_on:
      - backend
    ports:
      - "4000:80"
```

Then run:

```bash
docker-compose up
```

Once running:

🖥 Frontend → http://localhost:4000

⚙️ API → http://localhost:3000

---
## 🧑‍💻 Contributing
### 🔧 Local Development Guide

To run the full app locally for development or contributions:

1. **Start infrastructure (Postgres) via Docker:**

```bash
pnpm start:infra
```
2. **Start the backend API (NestJS):**
```bash
nx serve api
```
3. **Start the frontend app (Vue):**
```bash
nx serve app
```

Once running:

API: http://localhost:3000

Frontend: http://localhost:4200

## 📜 License

This project is licensed under the [MIT License](./LICENSE).
