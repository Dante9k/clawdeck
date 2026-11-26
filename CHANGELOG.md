# Changelog

## 1.0.0-rc.2

- Fix a race in operation-ID reservation during expired-record cleanup; concurrent requests now have one owner.
- Expire completed IDs before replay lookup, validate persisted records and sort recovered operations by timestamp.
- Reject misleading JSON media types and malformed cross-origin requests consistently.
- Use salted scrypt for administrator password verification and independently constrain operation-record paths at the filesystem boundary.
- Enforce absolute Docker request/exec deadlines and reject truncated multiplexed responses.
- Extract HTTP, audit, fleet and pure configuration modules; remove unused code and unify formatting.
- Replace source-rewriting demo assembly with an esbuild module bundle.
- Add pinned development dependencies, format/lint checks and additional regression tests.
- Add MIT licensing, English/Chinese documentation, contribution and security policies, and a bilingual product website.

## 1.0.0-rc.1

- Initial single-host Docker dashboard with explicit container management authorization.
- Model/provider/channel editing, masked diffs, native validation, backups and editable-scope restoration.
- Batch model changes, operation tracking, idempotency and unknown-outcome handling.
- In-memory demonstration and deployment acceptance checklist.
