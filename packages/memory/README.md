# TORI saved memory contract

This private, reusable package is installed separately from Studio in the independent consumer. The [accepted slice](../../docs/implementation/MEMORY-FOUNDATION.md) and [owner repair addendum](../../docs/evidence/v1c-memory/OWNER-REVIEW.md) govern its scope.

SQLite `user_version = 1` adds record-header fields `derivedFrom: string[]` and `compactedInto: string | null` (stored as `derived_from` JSON text and nullable `compacted_into`). Their defaults are `[]` and `null`. The unversioned shipped schema is version 0. One transaction creates or extends the schema, keeps the operation fingerprint key and existing rows, and sets the version. An unknown version fails closed. Record IDs, content, revision history, scope, receipts and content-free tombstones are preserved. Correction adds a revision to the same record ID. Neither operator inputs nor the model can set lineage. It is excluded from admission blocks and Run receipts.

Future compaction requires a governed, receipted and reversible host operation: its result records the source record IDs in `derivedFrom`, and each source links to the result through `compactedInto`. This contract reserves representation only.

The canonical Memory Policy resolves `organizer: off`. The public package policy export resolves `tori.memory-policy@1` from the installed VICT memory policy artifact reference in an activation. Legacy history-only and governed references retain their identity and their prior saved-memory posture; both resolve organizer off. This field is not a VICT memory config key, is not exposed as a control and adds no organizer execution.
