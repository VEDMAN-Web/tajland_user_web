# Tajlandia Frontend Architecture

This is a Next.js App Router application organized so each major website feature can be built, tested, and replaced independently.

## 1. Project architecture

The codebase is split into five layers:

| Layer           | Location                                | Responsibility                                    |
| --------------- | --------------------------------------- | ------------------------------------------------- |
| Routing         | `app/`                                  | URLs, layouts, metadata, error/loading boundaries |
| Feature modules | `src/modules/`                          | Feature UI, content, schemas, services            |
| Shared UI       | `src/components/`                       | Reusable layout, navigation, and primitives       |
| Infrastructure  | `src/lib/`                              | Env, API client, validation, SEO, security        |
| Tests           | colocated `*.test.ts(x)` and `test/e2e` | Unit, component, and E2E coverage                 |

Dependency direction is one-way and lint-enforced:

`app` → `modules` → `components` / `lib`

Additional walls:

- `components` cannot import `modules`
- `lib` cannot import `modules` or `components`
- modules cannot import other modules
- `app` can import a module only through `@/modules/<name>`

## 2. Folder structure

```text
app/                       # App Router only
  (marketing)/             # Public site chrome: header + footer
src/
  modules/
    home/                  # Implemented feature
      data/home.mock.ts    # Static CMS-shaped content
    explore-map|blog|contact
    registry.ts            # Module names only
  components/ui|layout|navigation|shared
  lib/api|config|security|validation|seo|utils|constants
proxy.ts                   # Nonce CSP
scripts/new-module.mjs     # Scaffold a feature
test/e2e/
```

## 3. Module boundaries

Each feature owns its code:

```text
src/modules/<feature>/
  components/
  sections/
  services/
  schemas/
  types/
  data/                    # Mock or CMS-shaped fixtures
  constants/
  index.ts                 # Public API
```

Allowed:

- `home` → `components/*`, `lib/*`, its own files
- `app` → `@/modules/home` (public API only)

Not allowed:

- `home` → `modules/blog/...`
- `app` → `@/modules/home/sections/HeroSection`

Create a module with `npm run new-module -- feature-name`.

## 4. Where UI components belong

- Reused across features: `src/components/ui/`
- Site chrome: `src/components/layout/` and `src/components/navigation/`
- Feature-specific: `src/modules/<feature>/components/` or `sections/`

Do not put feature sections in `components/`.

## 5. Where business logic belongs

- content assembly and feature rules → `modules/<feature>/services/`
- feature validation → `modules/<feature>/schemas/`
- shared env/API/security rules → `src/lib/`

UI files should not contain `fetch`, auth, or secret handling.

## 6. Where API calls belong

Use `src/lib/api/client.ts` from a module service.

UI → Server Component / Server Function → module service → API client → backend

The client is `server-only`, validates with Zod, times out, rejects cross-origin paths, ignores error bodies, and sends `API_SECRET` only from server env.

Home currently reads validated mock data from `src/modules/home/data/home.mock.ts`. When a CMS/API exists, change `home.service.ts` only.

## 7. Where validation belongs

- Env: `src/lib/validation/env.schema.ts`
- Feature payloads/forms: `src/modules/<feature>/schemas/`
- Redirects: `src/lib/security/redirects.ts`
- Reuse schemas in services, Server Functions, and tests

## 8. Where tests belong

- Unit/component tests: colocated `*.test.ts(x)`
- Feature section tests: `modules/<feature>/__tests__/`
- E2E: `test/e2e/`
- Coverage: `npm run test:coverage` (thresholds: 85% lines/statements/functions, 80% branches on lib security/API/SEO and Home data)

Vitest does not reliably test async Server Components; cover those with Playwright.

## 9. Server vs Client Component rules

Default to Server Components. `"use client"` only for state, effects, browser APIs, and interactive widgets.

`MobileNav` is client. `SiteHeader` stays a Server Component.

The marketing layout awaits `connection()` so Next.js can apply a per-request CSP nonce. That is an intentional security/performance tradeoff.

## 10. Environment variable rules

- `NEXT_PUBLIC_*` is public.
- Secrets stay in server env.
- Copy `.env.example`. Never commit `.env.local`.
- `getPublicEnv()` / `getServerEnv()` (`server-only`).
- `src/instrumentation.ts` validates server env at startup.
- Site images live in `public/images/` and are referenced from data/constants, not hardcoded in JSX.

## 11. Security guidelines

- React text rendering is the default XSS control.
- JSON-LD is the only `dangerouslySetInnerHTML` usage and escapes `<`.
- External links go through `ExternalLink` / `toSafeExternalUrl`.
- Internal redirects must be in the `routes` allowlist.
- CSP is nonce-based in `proxy.ts`. Production does not allow `unsafe-inline` or `unsafe-eval`. JSON-LD scripts receive the request nonce from `x-nonce`.
- Static headers (frame, nosniff, CORP, HSTS in production) are in `next.config.ts`.
- API errors returned to users are generic (`toUserErrorMessage`).
- Future mutation routes should use `createInMemoryRateLimiter` locally and a shared store (for example Redis) in multi-instance production.
- Do not invent cryptography.

## 12. Naming conventions

- Components: `HeroSection.tsx`
- Services: `home.service.ts`
- Schemas: `home-content.schema.ts`
- Types: `home.types.ts`
- Tests: `home.service.test.ts`

Avoid catch-all names like `data.ts` or `helpers.ts`.

## 13. How to add a new module

1. `npm run new-module -- feature-name`
2. Add the name to `src/modules/registry.ts`
3. Add a thin route in `app/(marketing)/<route>/page.tsx` that imports only from `@/modules/<feature>`
4. Put shared UI in `src/components/` only if a second consumer exists
5. Add schemas/services before wiring forms or API calls
6. Add unit/component tests and an E2E journey
7. Do not import another module's internals

## 14. How to add a new API

1. Add server env in `.env.example` and `serverEnvSchema` if needed
2. Add a Zod response schema in the owning module
3. Call `apiGet(path, schema)` from the module service
4. Keep secrets on the server. Inject `fetchImpl` in tests; do not hit production APIs

## 15. How to add a new reusable component

Add it to `src/components/ui/` when it is stable, semantically meaningful, and used in more than one place. Otherwise keep it in the feature module until reuse is real.
