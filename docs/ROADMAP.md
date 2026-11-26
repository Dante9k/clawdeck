# Roadmap

This is a direction for contributions, not a delivery commitment.

## Before a stable 1.0

- Record real OpenClaw image compatibility with exact tag/digest and a reproducible Linux acceptance run.
- Validate ARM64, rootless Docker, directory mounts and an HTTPS reverse proxy.
- Complete desktop/mobile browser and accessibility acceptance.
- Gather feedback on model/channel editing and recovery workflows.

## Good next contributions

- English dashboard translations with a maintainable message catalog.
- More image-compatibility fixtures grounded in actual OpenClaw releases.
- Searchable documentation and additional sanitized deployment examples.
- Smaller dashboard view modules as the UI grows.

## Requires design work first

Multi-server access, RBAC/SSO, centralized encrypted credentials, live channel probes, usage/cost accounting and automated upgrades change the trust model substantially. They are not implemented in this release candidate. Discuss their threat model and operational cost before starting a large implementation.
