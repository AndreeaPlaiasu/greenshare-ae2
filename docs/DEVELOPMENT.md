# Development evidence — 24 November 2026

The local Git history records project setup, domain transactions, Firebase/session boundaries, query and inventory actions, catalogue/auth screens, reservation screens, administration/map, responsive styling, tests and documentation as distinct development changes. Commits were made in their actual order; no historic timeline was manufactured.

## Completed local checks

- Twelve domain transaction tests passed using a serialised in-memory adapter.
- TypeScript checking and the final production build passed, including the seed script and preview map.
- Browser catalogue filters returned the expected single drill kit for Tool / North London / 2 February.
- Leaflet preview rendered three markers; the North London popup showed both equipment lines and all three daily quantities.
- Firebase project greenshare-ae2 created on Spark; Email/Password Auth enabled and production-mode Firestore provisioned in europe-west2.
- Production compilation used webpack with the official Next.js WASM SWC package because the host’s signed Node process rejects native SWC loading. Compilation does not prove Firebase integration.

## Still required

- Register the Web app and connect server credentials securely.
- Deploy rules/indexes and seed assessment accounts.
- Run the real integration cases in ACCEPTANCE.md.
- Check both roles, capture actual screenshots and record any fixes.
- Write the approximately 1,500-word technical report, including code extracts and a 250–500-word final evaluation.
- Provide usable marker access and review the final archive and GitHub history before submission.
