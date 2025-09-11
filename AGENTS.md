# Repository Guidelines

## Project Structure & Module Organization
- App code lives in `src/app` (Next.js App Router) with route folders and `page.tsx` files. Shared UI lives in `src/components`; utilities in `src/utils`; data/state in `src/stores` and `src/lib`.
- Styles: global in `src/app/globals.css`; Tailwind configured via `tailwind.config.ts`.
- Tests are under `tests/` with subfolders: `integration/`, `a11y/`, `security/`, and Playwright `e2e/`. Public assets in `public/`. Scripts in `scripts/`.

## Build, Test, and Development Commands
- `npm run dev` — Start local dev server.
- `npm run build` — Production build (Next.js).
- `npm start` — Serve the production build.
- `npm run lint` / `npm run lint:fix` — ESLint checks and autofix.
- `npm run type-check` — TypeScript type checking.
- `npm test` — Unit tests (Vitest).
- `npm run test:integration` — Integration tests (Vitest). `:coverage` adds coverage.
- `npm run test:e2e` — E2E tests (Playwright).
- `npm run test:a11y` / `npm run test:security` — Accessibility and security suites.

## Coding Style & Naming Conventions
- Language: TypeScript, React 18, Next 14. Indentation: 2 spaces; single quotes; semicolons optional per ESLint.
- Components: PascalCase files (e.g., `PerformanceMonitor.tsx`), colocate small subcomponents by feature directory.
- Hooks and utilities: lowerCamelCase (e.g., `useDebounce.ts`, `formatDate.ts`).
- Prefer functional components, React Server Components in `src/app` where appropriate.
- Linting via `eslint.config.mjs`/`eslint-config-next`. Tailwind classnames allowed; keep classes sorted logically.

## Testing Guidelines
- Frameworks: Vitest (`tests/integration`, `tests/a11y`, `tests/security`) and Playwright (`tests/e2e`).
- Name tests `*.test.ts(x)`; colocate under the matching subfolder. Keep assertions focused and deterministic.
- Aim for coverage on core business logic; run `npm run test:integration:coverage` before PRs.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `type(scope): summary` (e.g., `feat(dashboard): add widget editor`). Version tags used in history (e.g., `[V1.6.0_YYYYMM_REV###]`) are welcome when relevant.
- PRs must include: clear description, linked issues, reproduction steps, and screenshots for UI changes. Note any config/env changes (`.env.local`) and update docs (`README.md`, `WEAVE_ARCHITECTURE.md`, `PAGE_STRUCTURE.md`) as needed.

## Security & Configuration
- Do not commit secrets. Use `.env.local` for Supabase, API keys, etc.
- Validate builds with `npm run pre-deploy`; deploy via `deploy:staging` or `deploy:production` when authorized.

# USER RULES
- 무조건 한글로 의사소통