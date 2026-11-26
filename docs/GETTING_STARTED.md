# Deploying ClawDeck

[中文完整指南](../README.zh-CN.md)

ClawDeck runs alongside existing OpenClaw containers on one Linux Docker host. It does not create or migrate those containers.

## Install and sign in

Install Docker Engine and the Docker Compose plugin first. The deployment user must be able to access the host’s Docker daemon.

```sh
git clone https://github.com/Dante9k/clawdeck.git
cd clawdeck
sh scripts/install.sh
```

The installer checks Docker, creates `.env` with a random 64-character password and restrictive permissions, then builds and starts the panel. It uses a temporary Node image, so Node does not need to be installed on the host. An existing `.env` is never overwritten. Read the password locally on the server; do not paste it into issues or screenshots.

Open an SSH tunnel from your computer:

```sh
ssh -N -L 3210:127.0.0.1:3210 user@your-server
```

Sign in at <http://127.0.0.1:3210>. Confirm the dashboard does not show demo mode.

## Authorize an instance

Container names or image names containing `openclaw`, `clawdbot` or `moltbot` are discovered automatically. Discovery permits status and recent logs only. In the existing OpenClaw service’s Compose file, add labels:

```yaml
services:
  openclaw-gateway:
    # Keep the existing image, volumes, environment and ports.
    labels:
      io.clawdeck.managed: 'true'
      io.clawdeck.name: 'Atlas'
      io.clawdeck.description: 'Work assistant'
      io.clawdeck.url: 'https://claw.example.com'
      # Optional: absolute path inside this container.
      # io.clawdeck.config-path: '/config/openclaw.json'
```

Reapply the original Compose project to recreate the service with its labels. Explicit `io.clawdeck.managed: 'false'` excludes a container, even if its name matches. Gateway links must be HTTP(S) without credentials, query strings or fragments.

The container needs Node.js, a regular readable configuration file, a working `openclaw config validate --json` command and a writable config directory. The panel sends its helper through stdin; secrets are not passed as process arguments. JSON5 is supported when the container supplies its parser. `$include` configurations are refused rather than flattened.

Prefer a persistent **directory** mount for configuration. A single-file bind mount can prevent atomic replacement. Use instance diagnostics, then validate a harmless change on a test instance. Backups live next to the config and contain the original credentials. UI restoration applies only the editable model, provider and channel sections; unrelated current fields remain intact.

## Environment

| Variable                        | Default / purpose                                                     |
| ------------------------------- | --------------------------------------------------------------------- |
| `PANEL_PASSWORD`                | Required; at least 16 characters. Installer generates a random value. |
| `PANEL_BIND`                    | `127.0.0.1`; host address for the published panel port.               |
| `PANEL_PORT`                    | `3210`; published host port.                                          |
| `SERVER_NAME`, `SERVER_ADDRESS` | Optional display labels.                                              |
| `COOKIE_SECURE`                 | `false`; set `true` when accessing via HTTPS.                         |
| `DOCKER_SOCKET_PATH`            | `/var/run/docker.sock`; host socket mounted into the panel.           |

For rootless Docker, set the socket path for the Docker user and ensure the CLI context used by the installer reaches that same daemon. For an HTTPS reverse proxy, preserve the public `Host` header and require administrator authentication. Do not expose the Docker socket over a network.

## Backup, upgrade and recovery

Back up both the panel data volume and each OpenClaw configuration directory securely. Never run multiple panel processes against the same data directory. Review [operations guidance](OPERATIONS.md) before pruning configuration backups or operation records.

To update a source checkout, review the changelog, back up state, pull the desired revision and run `docker compose up -d --build --wait`. This project does not automatically upgrade OpenClaw images. Do not use destructive volume cleanup as an upgrade step.

If an operation reports an unknown result, inspect container state or reread configuration before retrying. Batch operations are not a cross-container transaction: earlier successes remain after a later failure.

## Acceptance

Run the [release checklist](RELEASE.md) with your exact image tag/digest, CPU architecture, mount layout and proxy. A protocol fixture or browser demo cannot establish compatibility with a production OpenClaw image.
