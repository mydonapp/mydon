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
pnpm format           # Prettier — write
pnpm format:check     # Prettier — check only

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

### Domain model

The API models proper double-entry bookkeeping with a tenancy layer on top:

```
Organization (PERSONAL | BUSINESS)
  └── OrganizationMembership (per user, with role OWNER/ADMIN/MEMBER/ACCOUNTANT)
  └── Ledger (1 set of books; has a baseCurrency)
        ├── AccountGroup (optional hierarchy with code/parent for SKR-style charts)
        ├── Account (ASSET/LIABILITY/EQUITY/INCOME/EXPENSE) — has code, activity window, currency, optional group
        └── Transaction (header — date, description, postedAt, reversesTransactionId)
              └── Entry[]  (≥2 — direction DEBIT|CREDIT, amount, currency, fxRate, baseAmount)
```

Invariants:

- Every `Transaction` has ≥2 `Entry` rows; `SUM(DEBIT.baseAmount) == SUM(CREDIT.baseAmount)`.
- Posted transactions (`postedAt IS NOT NULL`) are immutable — corrections happen via a reversing transaction (`POST /v1/transactions/:id/reverse`).
- DEBIT increases ASSETS/EXPENSE; CREDIT increases LIABILITIES/EQUITY/INCOME. The `account-active.ts` helper enforces the activity window when validating entries.
- Personal users get one implicit `Organization` (kind=`PERSONAL`) + one implicit `Ledger` (`"Main"`, base currency CHF). Both are hidden in the UI for the personal-use case.

### API (`apps/api`)

Feature-based NestJS modules under `apps/api/src/app/`:

| Module           | Responsibility                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `auth`           | Login, signup, JWT access tokens, cookie refresh tokens, password change                                       |
| `organizations`  | `Organization` + `OrganizationMembership` — tenant boundary; auto-created on signup                            |
| `ledgers`        | `Ledger` (one set of books per org); `getDefaultLedgerForUser(userId)` resolves the current user's ledger      |
| `account-groups` | Account groupings with optional hierarchy (replaces the old "categories" concept)                              |
| `accounts`       | `Account` rows scoped to a ledger; balance derived from entries; activity-window helper in `account-active.ts` |
| `transactions`   | `Transaction` (header) + `Entry` (legs). Create / patch (draft only) / post / reverse / delete. CSV import.    |
| `budgets`        | Budget plans with line items (per account-group or per account); monthly/yearly progress calculations          |
| `export`         | Full data export as a ZIP of CSVs                                                                              |
| `status`         | Health check endpoint                                                                                          |
| `shared`         | `ColumnDecimalTransformer` (TypeORM decimal precision), `ForexService` (currency conversion)                   |

**Database**: PostgreSQL via TypeORM. `synchronize: false` — all schema changes must be written as migration files.

**Migrations**: TypeORM migrations live in `apps/api/src/migrations/`. The standalone DataSource config is at `apps/api/src/data-source.ts` (loads entities via the `apps/api/src/app/**/*.entity.ts` glob, sidestepping the ESM extensionless-import problem). The migration CLI uses `typeorm-ts-node-commonjs` with `TS_NODE_PROJECT=apps/api/tsconfig.app.json` so decorators + `emitDecoratorMetadata` work. Run from the workspace root with `.env` present:

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

**Always generate migrations — never hand-write them.** Make the entity change first, then run `pnpm migration:generate apps/api/src/migrations/DescriptiveName` to produce the initial migration from the entity-vs-DB diff. Review the generated SQL and add anything the diff can't infer by hand (data backfills, `ALTER COLUMN ... TYPE ... USING (...)` conversions, enum value changes), then commit the resulting `.ts` file. Every entity change (new column, new table, renamed column, type change, etc.) requires this generate-review-commit cycle. Never use `synchronize: true`.

**Entity column convention**: Always specify `type` explicitly in every `@Column()` decorator (e.g. `@Column({ type: 'varchar' })`). Self-documenting and decoupled from `emitDecoratorMetadata` if we ever swap toolchains again.

**Auth flow**: Password login → short-lived JWT access token (in-memory on client) + HttpOnly cookie refresh token. The `AuthGuard` protects all non-public routes. New signups are atomically provisioned with a personal `Organization`, OWNER `OrganizationMembership`, and a default `Ledger` (in `AuthService.createUser`).

**Transactions API surface** (post-refactor — no legacy fields):

- `POST   /v1/transactions` → `{ description, reference?, transactionDate, entries: [{accountId, direction, amount, currency?, fxRate?, aiSuggested?}, ...], post? }`
- `PATCH  /v1/transactions/:id` → only allowed on drafts (`postedAt IS NULL`); `entries` is a full replacement set
- `POST   /v1/transactions/:id/post` → flips draft → posted
- `POST   /v1/transactions/:id/reverse` → creates a sign-flipped reversing transaction
- `DELETE /v1/transactions/:id` → drafts only

**CSV import flow**: Upload → `statementMapper/` parses bank-specific formats (PostFinance, Swisscard, Wise, Yuh) → `TransactionsService.importStatement` persists each row as a `Transaction` with 1–2 `Entry` rows in draft state (`postedAt = null`) → user reviews in the import view, assigns missing accounts via PATCH, then bulk-approves to post.

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
                                #   page-header, toast-container, account-group-combobox
layout/app-layout.ts            # sidebar + router-outlet shell
```

**State management**: Angular Signals throughout. No NgRx. Services hold shared state as `signal<T>()`.

**i18n**: `@ngx-translate/core` v17. Locale JSON files live in `apps/app/src/assets/i18n/{en,de,fr,it}.json`. Use `{{ 'key.path' | translate }}` in templates and `TranslateService.instant()` in TS.

**Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`. DaisyUI component classes (`btn`, `card`, `modal`, `alert`, `toggle`, etc.) are defined in `apps/app/src/styles.css`. RemixIcon used for icons: `<i class="ri-icon-name">`.

## Design System

All UI decisions — color tokens, typography, spacing, component patterns, dark mode rules, and what to avoid — are documented in [`DESIGN.md`](./DESIGN.md). Read it before making any frontend changes.

## Key Conventions

**Double-entry bookkeeping**: Every posted `Transaction` has ≥2 `Entry` rows that balance on `baseAmount`. Never write single-sided entries. Never patch a posted transaction — issue a reversal instead (`POST /v1/transactions/:id/reverse`).

**Account types** (enum `AccountType`): `ASSETS`, `LIABILITIES`, `EQUITY`, `INCOME`, `EXPENSE`. Normal-balance direction:

- ASSETS, EXPENSE: debit-positive (balance = `SUM(DEBIT.amount) − SUM(CREDIT.amount)`)
- LIABILITIES, EQUITY, INCOME: credit-positive (balance = `SUM(CREDIT.amount) − SUM(DEBIT.amount)`)

Always reuse this formula (see `accounts.service.computeBalance` and `budgets.service.getAccountActual`).

**Activity window**: `Account.activeFrom` / `Account.activeUntil` (both nullable). Use `isAccountActive(account, asOf)` from `accounts/account-active.ts` — and call it with the **transaction's date**, not "today", when validating posting eligibility.

**Multi-currency**: Each `Entry` records its own `currency` + `fxRate` + `baseAmount`. `baseAmount` is in the ledger's base currency. Balance validation works on `baseAmount`, not raw `amount`.

**Angular components**: `standalone: true` is the default — omit it. Use `input()` / `output()` signal-based APIs for new component inputs/outputs. Use `@if` / `@for` control flow syntax, not `*ngIf` / `*ngFor`. Use `inject()` for DI, not constructor injection. File naming omits `.component`: `login.ts` / `login.html` / `login.css` (not `login.component.ts`). Split every component into separate `.ts`, `.html`, and `.css` files — no inline templates or styles. Set `changeDetection: ChangeDetectionStrategy.OnPush` on every component (the app is zoneless + signal-driven). Put host bindings/listeners in the `host` object — never `@HostBinding` / `@HostListener`; for global `window` / `document` events use `Renderer2.listen` torn down via `DestroyRef`. Build accessible rich controls (select, autocomplete, combobox, menu) on `@angular/aria` headless directives.

**Loading states**: Always use content-shaped skeletons, never spinners. Use `<app-skeleton>` (`shared/components/skeleton/skeleton.ts`) with `class="h-X w-X"` to match the dimensions of the content being loaded. Mirror the real layout — one skeleton per content block — so the page doesn't shift when data arrives.

**API responses**: NestJS controllers return plain objects/arrays; TypeORM entities are not serialized directly — use DTOs or mapped response objects. Transactions are serialized via `TransactionsService.serialize()` which exposes the entries array + an `amount` convenience field.

**Environment config**: API URL for the frontend comes from `apps/app/src/environments/environment.ts` (`this.appConfig.apiUrl`). Default is `http://localhost:3000` for dev.

**Code comments**: Default to self-documenting names — comment the _why_, not the _what_. Delete comments that merely restate a name or the obvious (`// inject the router`, `// loads the budget`). Reserve comments for the non-obvious: rationale, constraints/invariants, workarounds, security/performance justifications, accounting/business semantics, and tricky SQL or type casts. Use JSDoc (`/** */`) on exported services, entities, and utilities — and on their non-obvious params/returns. Keep inline `//` comments short (≤3 lines); longer explanation belongs in a method or class JSDoc. No file-header banners. Name magic numbers as constants rather than explaining them inline.
