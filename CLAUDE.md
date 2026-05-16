# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Infrastructure (PostgreSQL via Docker)
pnpm start:infra

# Development servers
pnpm start:api       # NestJS API on :3000
pnpm start:app       # Angular frontend on :4200

# Build, lint, test (all projects)
pnpm build
pnpm lint
pnpm test

# Target a single project
pnpm nx run api:build
pnpm nx run app:build
pnpm nx run api:test
pnpm nx run app:test

# Run a single test file
pnpm nx run api:test --testFile=apps/api/src/app/auth/auth.service.spec.ts

# Serve with dev config
pnpm nx run app:serve:development
pnpm nx run api:serve:development
```

Use `pnpm` exclusively — never `npm`, `yarn`, or `npx`. Nx targets are run via `pnpm nx run <project>:<target>`.

Copy `.env.example` to `.env` before first run.

## Architecture

**Nx monorepo** with two apps and no shared libs:

- `apps/api` — NestJS 11 backend
- `apps/app` — Angular 21 frontend

### API (`apps/api`)

Feature-based NestJS modules under `apps/api/src/app/`:

| Module         | Responsibility                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `auth`         | Login, signup, JWT access tokens, cookie refresh tokens, password change                                            |
| `accounts`     | Double-entry ledger accounts (assets/liabilities/equity/income/expense), balance calculations                       |
| `transactions` | Journal entries (each has a debit + credit account), CSV import, draft/approval flow, AI-suggested account matching |
| `categories`   | User-defined account categories                                                                                     |
| `budgets`      | Budget plans with line items, monthly/yearly progress calculations                                                  |
| `export`       | Full data export as a ZIP of CSVs                                                                                   |
| `status`       | Health check endpoint                                                                                               |
| `shared`       | `ColumnDecimalTransformer` (TypeORM decimal precision), `ForexService` (currency conversion)                        |

**Database**: PostgreSQL via TypeORM. `synchronize: false` — all schema changes must be written as migration files.

**Migrations**: TypeORM migrations live in `apps/api/src/migrations/`. The standalone DataSource config is at `apps/api/src/data-source.ts`. Run all migration commands from the workspace root with `.env` present:

```bash
# Generate a migration by diffing entities against the current DB schema
pnpm migration:generate apps/api/src/migrations/DescriptiveName

# Apply all pending migrations
pnpm migration:run

# Roll back the last applied migration
pnpm migration:revert

# Show applied / pending status
pnpm migration:show
```

Every entity change (new column, new table, renamed column, etc.) requires a `migration:generate` + commit of the resulting `.ts` file. Never use `synchronize: true`.

**Entity column convention**: Always specify `type` explicitly in every `@Column()` decorator (e.g. `@Column({ type: 'varchar' })`). TypeORM can't infer column types without `emitDecoratorMetadata` in the migration toolchain, which uses tsx/esbuild (no metadata emission).

**Auth flow**: Password login → short-lived JWT access token (in-memory on client) + HttpOnly cookie refresh token. The `AuthGuard` protects all non-public routes.

**CSV import flow**: Upload → `statementMapper/` parses bank-specific CSV formats → creates draft `Transaction` rows → frontend review → bulk approve.

Swagger docs available at `/api/docs` when `ENABLE_API_DOCS=true`.

### Frontend (`apps/app`)

Angular 21 standalone components with lazy-loaded routes. No NgModules.

**Key files:**

- `app.config.ts` — providers: router, HttpClient + auth interceptor, ngx-translate
- `app.routes.ts` — route tree; `/app/*` is behind `authGuard`

**Structure under `apps/app/src/app/`:**

```
core/
  guards/auth.guard.ts          # checks isAuthenticated() synchronously (init runs via APP_INITIALIZER)
  guards/no-auth.guard.ts       # redirects authenticated users away from login/signup
  interceptors/auth.interceptor.ts  # injects Bearer token on every request
features/                       # one directory per page, lazy-loaded
services/                       # singleton services, all provided in root
shared/components/              # base-button, base-input, base-select, base-toggle,
                                #   page-header, toast-container, category-combobox
layout/app-layout.ts            # sidebar + router-outlet shell
```

**State management**: Angular Signals throughout. No NgRx. Services hold shared state as `signal<T>()`.

**i18n**: `@ngx-translate/core` v17. Locale JSON files live in `apps/app/src/assets/i18n/{en,de,fr,it}.json`. Use `{{ 'key.path' | translate }}` in templates and `TranslateService.instant()` in TS.

**Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`. DaisyUI component classes (`btn`, `card`, `modal`, `alert`, `toggle`, etc.) are defined in `apps/app/src/styles.css`. RemixIcon used for icons: `<i class="ri-icon-name">`.

## Design System

All UI decisions — color tokens, typography, spacing, component patterns, dark mode rules, and what to avoid — are documented in [`DESIGN.md`](./DESIGN.md). Read it before making any frontend changes.

## Key Conventions

**Double-entry bookkeeping**: Every `Transaction` has exactly one credit account and one debit account. Never create single-sided entries.

**Account types** (enum `AccountType`): `ASSETS`, `LIABILITIES`, `EQUITY`, `INCOME`, `EXPENSE`. Balance sign logic differs per type — follow the existing pattern in `accounts.service.ts`.

**Angular components**: `standalone: true` is the default — omit it. Use `input()` / `output()` signal-based APIs for new component inputs/outputs. Use `@if` / `@for` control flow syntax, not `*ngIf` / `*ngFor`. Use `inject()` for DI, not constructor injection. File naming omits `.component`: `login.ts` / `login.html` / `login.css` (not `login.component.ts`). Split every component into separate `.ts`, `.html`, and `.css` files — no inline templates or styles.

**Loading states**: Always use content-shaped skeletons, never spinners. Use `<app-skeleton>` (`shared/components/skeleton/skeleton.ts`) with `class="h-X w-X"` to match the dimensions of the content being loaded. Mirror the real layout — one skeleton per content block — so the page doesn't shift when data arrives.

**API responses**: NestJS controllers return plain objects/arrays; TypeORM entities are not serialized directly — use DTOs or mapped response objects.

**Environment config**: API URL for the frontend comes from `apps/app/src/environments/environment.ts` (`this.appConfig.apiUrl`). Default is `http://localhost:3000` for dev.
