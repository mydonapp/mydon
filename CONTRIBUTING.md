# Contributing to Mydon

Thanks for your interest in contributing to **Mydon**!  
We welcome all contributions—bug fixes, new features, documentation, testing, and feedback.

---

## How to Contribute

### Report Bugs or Suggest Features

- Open an issue with clear steps or screenshots
- Use the appropriate issue template (Bug or Feature)
- Include logs or browser details if relevant

---

### Setup for Development

1. **Clone the repo:**

```bash
git clone https://github.com/mydonapp/mydon.git
cd mydon
```

2. **Set up environment variables:**

```bash
cp .env.example .env
```

Edit `.env` with your local configuration values.

3. **Install dependencies:**

```bash
pnpm install
```

4. **Start services (Postgres via Docker):**

```bash
pnpm start:infra
```

5. **Start backend and frontend:**

```bash
nx serve api
nx serve app
```

- API: [http://localhost:3000](http://localhost:3000)
- App: [http://localhost:4200](http://localhost:4200)

> You'll need Node.js, pnpm, and the nx CLI installed globally.

---

### Run Tests

```bash
nx test api
nx test app
```

---

### Lint & Format

```bash
pnpm lint
```

---

### Folder Structure

- `apps/api` — NestJS backend
- `apps/app` — Vue frontend
- `libs/` — Shared TypeScript libraries

---

### Pull Request Checklist

- [ ] Code builds and passes tests
- [ ] Follows existing code style (run linter & formatter)
- [ ] Includes helpful commit messages and PR description
- [ ] Linked to an issue if applicable

---

### Questions or Help?

- Start a GitHub Discussion
- Or open a draft PR and ask for feedback!

---

Thank you for helping build Mydon
