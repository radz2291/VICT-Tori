# Independent re-verification of fb52560

Verifier /root/verifier, detached clean checkout fb525608463862e9e5d2a664710a700a1f77cf8e. Reused the fresh locked install from 8223b5c because package manifest/lock did not change and all 11 VICT 0.4.0-rc.1 tarballs were verified by SHA-256. Node 24.15.0, npm 11.19.1, Vite 6.4.3, installed Windows Chrome and separate browser profiles. Product production preview 41974. Bundle index-4j3_tgjC.js and index-DMj2iC-V.css.

## Browser results

All eight tracked browser suites ran green: check-studio-integration, check-studio-creative, check-studio-workflow-fixtures, audit-studio-ui, check-studio-browser (R1/R2), check-studio-docks, check-studio-final, check-studio-responsive. Logs and screenshots preserved here. The legacy final/docks/browser suites now prove the previous selection restoration failure is repaired. Responsive suite reports desktop canvas 579/551/551px, phone canvas 707/654/654px for Agents/Workflows/Creative with no page errors. Integration confirms native resource projection contains four graph edges and hide preserves the Tool binding.

Independent browser challenge confirms one Creative Run Node artifact remains one version after linked Session continuation. The continuation points to the original artifact ID and does not get a new artifact ID. Independent negative probe confirms Agent/Workflow adapter refusal of unsupported Run To and Run From with explanatory feedback, protected action denial after both direct run and linked Session continuation, waiting/cancelled/interrupted traces, and 390px Session Select provenance/no horizontal overflow.

New Agent projection is a read-only native GraphWorkspaceV3/GraphViewport/GraphPortRow surface with accessible resource/edge IDs in adjacent markup. Studio authoring controls remain public VICT Button/Select/Input/Textarea, Feedback, Dialog/AlertDialog, Menubar/DropdownMenu, Popover/Slider. No raw native control tags in app sources. Rendered five-page audit and specific negative-probe markers passed.

## Remaining findings on this exact commit

- Phone visual FAIL despite passing geometric suite: nowrap scroll command rows shrink their children into overlapping labels on both Workflows and Creative. See responsive/workflows-phone.jpg and responsive/creative-phone.jpg. Preserve the 650px floor while fixing command intrinsic sizes.
- Source review finds Creative→Workflow writes Creative draft ID/revision/context to the Request but workflow simulation does not carry that lineage or an artifact version to Runs/Session. Direct Creative Run→Session lineage is fixed. This cannot count as full unified continuation.
- Verification of actual phone hardware, later live execution/engine integrations, and every detailed test matrix cell remains separate. Independent engineering remains HELD for the visual command labels and incomplete unified continuation on fb52560.
