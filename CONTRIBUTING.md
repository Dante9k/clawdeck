# Contributing to ClawDeck

Thanks for helping make a small, reliable console for OpenClaw fleets. Start with a reproducible problem or a narrowly scoped proposal. Check existing issues before opening a new one.

## Local workflow

Use Node.js 22.14+ and pnpm 11.25.0. Run `pnpm install --frozen-lockfile`, then `pnpm demo` for the HTTP demo. Docker is only needed for the container smoke test.

Before submitting a pull request:

```sh
pnpm format
pnpm lint
pnpm build:preview
pnpm test
pnpm build:site
git diff --check
```

Commit the generated `preview.html` whenever its inputs change. Do not commit `node_modules`, `.pnpm-store`, `.env`, data volumes, logs, backups or website build output. Keep `pnpm-lock.yaml` in sync with development dependencies. Runtime dependencies are intentionally absent.

On a disposable Linux Docker host, run `docker build -t clawdeck:ci .` followed by `node scripts/docker-smoke.mjs`. This creates temporary test containers and cleans up only those containers. Never point a test at production configurations.

## Code expectations

- Keep modules focused; isolate transport, persistence and pure configuration transformations.
- Use named functions and clear domain terms. Explain invariants or unusual decisions in comments.
- Use the formatter and ESLint configuration in this repository. Prefer small, reviewable changes over unrelated rewrites.
- Add regression tests for bugs and meaningful behavior changes. Cover failure, partial-success and concurrent-request behavior when changing mutations.
- Preserve unknown OpenClaw fields and missing-field semantics. Credentials must not leak into responses, diffs, command arguments or audit records.
- Keep explicit management labels, optimistic concurrency checks and native validation mandatory. Never silently fall back to demo data.
- A successful mutation followed by a reporting failure must stay distinguishable from a failed mutation. Never automatically retry an unknown result.

## Pull requests

Describe the user-visible problem, what changes and how you verified it. Include sanitized before/after screenshots for UI work and note any untested environments. Update the relevant guide when behavior changes. CI must pass before merge.

English and Chinese issues and pull requests are welcome. Be constructive and respectful; focus discussion on the work. Use GitHub’s reporting tools for abuse. Report vulnerabilities through [SECURITY.md](SECURITY.md), not a public issue.

By contributing, you agree that your contribution is licensed under the project’s MIT license.
