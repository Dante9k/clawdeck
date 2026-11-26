# Security policy

## Supported versions

Security fixes currently target the latest release candidate and the `main` branch. No long-term support window is promised before a stable release.

## Report privately

Use [GitHub private vulnerability reporting](https://github.com/Dante9k/clawdeck/security/advisories/new). Include affected versions, the smallest reproduction and likely impact. Do not submit real API keys, private configuration files or customer data. Do not open a public issue containing an exploitable vulnerability.

If the private reporting form is unavailable, open a public issue asking for a private contact channel without including vulnerability details. Response timing depends on maintainer availability; there is no guaranteed SLA.

## Deployment boundary

ClawDeck is a single-host administration tool. Access to the Docker socket provides host-level authority. Its shared administrator session is not a tenant boundary or RBAC system. Only trusted administrators should have access.

- Keep the default loopback binding and use SSH, or deploy behind an authenticated HTTPS proxy. Set `COOKIE_SECURE=true` with HTTPS.
- Keep the panel password, `.env`, data directory, container configuration and backups private. Run one panel per data directory.
- Explicit management labels authorize container mutations and configuration access. Automatic discovery alone permits status and recent logs.
- Configuration responses and diffs mask recognized secrets. Log masking is heuristic; third-party logs can contain unrecognized sensitive data.
- Backups contain original configuration including credentials. Store them in appropriately protected persistent volumes and manage retention.
- Native validation executes the OpenClaw CLI already installed in a managed container. Only manage trusted images.

Validation and revision checks reduce accidental overwrites. They cannot coordinate arbitrary external writers during the final check-to-rename interval. A result marked `unknown` requires inspection before another request.
