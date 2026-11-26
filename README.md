# ClawDeck

**Enterprise OpenClaw management. On your infrastructure.**

ClawDeck is an open-source OpenClaw management platform for enterprise IT operations and AI platform teams. Centralize instance operations, model/provider configuration and channels, with change review, backup recovery and operation records on your own infrastructure.

The current release candidate is a **single-host pilot edition** for trusted administrators. Enterprise identity, RBAC/SSO, approval workflows, encrypted credential storage and multi-server management are planned, not delivered. See the [enterprise roadmap](docs/ROADMAP.md).

[Website](https://clawdeck.jupyter-community.chatgpt.site/) · [Interactive demo](https://clawdeck.jupyter-community.chatgpt.site/demo.html) · [Quick start](docs/GETTING_STARTED.md) · [简体中文](README.zh-CN.md)

[![Release checks](https://github.com/Dante9k/clawdeck/actions/workflows/ci.yml/badge.svg)](https://github.com/Dante9k/clawdeck/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-476c51.svg)](LICENSE)

> **1.0.0-rc.2 — release candidate.** Built for trusted administrators of a single server. The dashboard currently uses Chinese; the website and deployment guide are bilingual. Validate your exact OpenClaw image before production rollout. See the [acceptance checklist](docs/RELEASE.md).

## Why ClawDeck?

Enterprise teams need a consistent way to operate OpenClaw instances, review configuration changes and recover from mistakes. ClawDeck brings those tasks into one console while preserving existing Compose deployments. The current edition records operations and outcomes under a shared administrator session; it does not attribute activity to individual people.

| Task                  | What ClawDeck does                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| Understand your fleet | Discover containers; view Docker health, CPU, memory, ports, Compose projects and recent logs.    |
| Manage instances      | Start, stop and restart individual containers or a selected batch.                                |
| Organize models       | Edit default/fallback models, providers, endpoints, API types, keys and model lists per instance. |
| Configure channels    | Forms for Feishu, Telegram and Discord, plus JSON editing for other channel configurations.       |
| Review changes        | Mask secrets, preview diffs, run the native OpenClaw validator and reject stale revisions.        |
| Recover safely        | Create pre-write backups; preview and restore the editable configuration sections.                |
| Track outcomes        | Persist operation IDs and results; distinguish success, failure and an unknown outcome.           |

Batch model changes preserve each instance’s own credentials and channels. All targets are checked before the first write. If a write fails, the remaining targets are skipped; earlier successful changes remain applied.

## Try it without a server

[Open the interactive demo](https://clawdeck.jupyter-community.chatgpt.site/demo.html), or open `preview.html` from this repository in a browser. It bundles the same UI with an in-memory API. Nothing connects to Docker or a model provider; refreshing resets the sample data.

To try the full HTTP demo locally with Node.js 22.14+:

```sh
node server.mjs --demo
```

Visit <http://127.0.0.1:3210>.

## Deploy on Linux

Prerequisites: Docker Engine, Docker Compose, and permission to use the local Docker socket.

```sh
git clone https://github.com/Dante9k/clawdeck.git
cd clawdeck
sh scripts/install.sh
```

The installer creates a random administrator password in `.env` without overwriting an existing file, builds the panel and waits for its health check. Host Node.js is not required. Read the password on the server; keep `.env` private.

From your computer, open a tunnel:

```sh
ssh -N -L 3210:127.0.0.1:3210 user@your-server
```

Visit <http://127.0.0.1:3210> and sign in. Add these labels to an existing OpenClaw Compose service, then reapply that service’s Compose configuration:

```yaml
labels:
  io.clawdeck.managed: 'true'
  io.clawdeck.name: 'Atlas'
```

Automatically discovered containers stay read-only until explicitly labelled. Do not replace your existing volumes or environment settings. Follow the [deployment guide](docs/GETTING_STARTED.md) for config paths, persistent storage, rootless Docker and HTTPS.

## Trust and compatibility

Docker socket access grants host-level authority. The panel is for trusted server administrators; it has no tenant isolation, role system or SSO. It binds to loopback by default. Use an SSH tunnel, a private network or a properly authenticated HTTPS proxy.

Secrets are masked in API responses and diffs. Actual configurations and backups remain in the OpenClaw container’s storage; this is **not a central encrypted credential vault**. Log masking is best-effort and cannot cover every third-party log format.

Supported editing requires a running container with Node.js, a readable regular configuration file and a working `openclaw config validate --json` command. Native validation must return explicit success. Include-based and read-only configurations are refused. See [compatibility and acceptance](docs/RELEASE.md) before adopting an image.

ClawDeck is an independent community project, not affiliated with or endorsed by OpenClaw.

## Development

The production server has zero third-party runtime dependencies. Development uses Node.js 22.14+ and pnpm 11.25.0.

```sh
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm build:preview
pnpm test
pnpm build:site
```

The CI matrix checks Linux and Windows on Node 22 and 24. A separate Linux job builds the Docker image and exercises a real Docker socket against a deliberately small OpenClaw CLI protocol fixture. That fixture does not certify every OpenClaw release.

See [CONTRIBUTING.md](CONTRIBUTING.md), the [architecture](docs/ARCHITECTURE.md), [security policy](SECURITY.md) and [roadmap](docs/ROADMAP.md).

## Help the project grow

Useful issue reports include an image tag/digest, a minimal reproduction and sanitized logs. Contributions to real-image compatibility, accessibility, dashboard translations and deployment documentation are particularly welcome. If ClawDeck helps you, a star makes it easier for others to discover it.

## License

[MIT](LICENSE). OpenClaw and third-party provider names belong to their respective owners.
