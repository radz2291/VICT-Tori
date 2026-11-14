# Run visibility

`@tori/run-visibility` is a pure, read-only projection of host-authorized Run receipts and the installed strict VICT stream. It imports only the public `@victframework/contracts` entry point. It has no Studio dependency, dispatch, storage, provider, tool, timer or credential access.

`capturePublicEvent(event, at)` validates the installed closed schema and returns a detached `tori.public-event-receipt@1` operational receipt. Text deltas retain sequence/correlation metadata only, with an explicit payloadStatus: a streamed output may not yet have passed structured-output acceptance. Accepted Run output is authoritative for content. This receipt is not a fabricated VICT event and does not alter the original stream/hub. `projectRunReport({run, relatedRuns})` returns `tori.run-report@1`. Pass only records already authorized for the current actor/workspace. The host, not this view, owns authorization and retention.

Missing counts are null (Unavailable). There is no aggregate team cap. No parent-question capability is claimed at the installed boundary. Invalid/foreign/late events cannot rewrite the saved Run outcome. Quiet/Summary/Full are UI preferences over the same result and do not change retention.

Pack locally with `npm pack ./packages/run-visibility --pack-destination .local`. Install the resulting archive and the pinned contracts archive into a fresh consumer. Import from `@tori/run-visibility` without source aliases. Publication is not part of this slice.
