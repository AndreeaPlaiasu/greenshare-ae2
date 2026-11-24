# GreenShare — QHO640 AE2

Next.js App Router, React Server Components and Server Actions, Firebase Authentication, Cloud Firestore and direct Leaflet integration. The AE1 borrowing window is **1, 2 and 3 February 2027**.

## Current status

Source implementation is present for requirements A–I. Firebase project **greenshare-ae2** has been created on the free Spark plan, Email/Password Authentication is enabled and Cloud Firestore is provisioned in **europe-west2 (London)** with production-mode rules. The application is **not yet connected** to server credentials. The `/preview` route uses clearly labelled illustrative inventory and cannot make reservations. A live Firebase project, test accounts and end-to-end verification are required before submission. No AE2 technical report is represented as complete.

## Requirements and run

- Node.js 22.18+ (Node 24 recommended), npm and a Firebase account.
- Run `npm ci`, copy `.env.example` to `.env.local`, then `npm run dev`.
- Open **http://127.0.0.1:3000**. Without configuration it opens the setup screen; `/preview` shows the sample catalogue.
- `npm run typecheck`, `npm test`, `npm run build` and `npm start` provide checking, tests, production build and production serving.
- Use `APP_ORIGIN=http://127.0.0.1:3000` locally. `localhost` is a different origin; use one consistently. A deployed app needs its exact HTTPS origin.

## Connect Firebase

1. Create a dedicated Firebase project. Enable **Authentication → Email/Password**.
2. Create **Cloud Firestore in production mode**. Choose the project’s region deliberately; it is a persistent project choice.
3. Add a Web app in Firebase Project Settings. Put its `projectId` and `apiKey` into `FIREBASE_PROJECT_ID` and `FIREBASE_WEB_API_KEY`.
4. In **Project settings → Service accounts**, create a private service-account key. Set `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` in `.env.local`. The key uses escaped `\n` line breaks inside a quoted environment value. Never commit the JSON key or `.env.local`.
5. Deploy `firestore.rules` and `firestore.indexes.json` with the Firebase CLI (`firebase deploy --only firestore --project YOUR_PROJECT_ID`). Rules deny direct browser database access; the server performs all access and enforces role/ownership. The Admin SDK bypasses Security Rules.
6. Wait for composite indexes to finish building in the console. Choose different assessment-only passwords of at least 10 characters in `SEED_WORKER_PASSWORD` and `SEED_ADMIN_PASSWORD`.
7. Run `npm run seed`. It creates usernames **worker** and **admin** with the chosen passwords, three illustrative locations and six stock lines. It preserves existing inventory on rerun, but resets these two dedicated test-account passwords to the supplied values.
8. Restart the app. Verify both accounts and every test in `docs/ACCEPTANCE.md` against the real project.

## Marker access and assessment credentials

**Not configured yet.** No live accounts or passwords are claimed to exist. Before submitting, replace this paragraph with the actual test-app URL (if hosted), username **worker** and its dedicated test password, username **admin** and its dedicated test password. Keep these assessment-only credentials in the marker’s submitted README. A public repository should contain setup instructions; private service-account credentials must never be published.

The web API configuration identifies the Firebase project; it is not a service-account secret. The private Admin SDK key belongs only in the local/server environment. The marker can either access a running hosted app or configure their own dedicated Firebase project using these steps. A source ZIP with no usable test access is **not submission-ready**.

## Feature map

| Requirement | Implementation |
| --- | --- |
| A | `/catalogue` category, location and date filters; cursor pagination |
| B | Worker booking form; server date/quantity validation; Firestore transaction; idempotent request ID |
| C | `/reservations` history and `/reservations/[id]` details |
| D | Username/password login through private username directory and Firebase Auth; server session cookies; current roles |
| E | `/admin` creates a library plus initial equipment and daily capacities atomically |
| F | Admin role sees all Workers’ reservations |
| G | Worker ownership checks; Admin edit/cancel; atomic date/quantity changes and capacity restoration |
| H | Inventory details, library/equipment editing, safe capacity edits and resumable deletion |
| I | `/locations` uses Leaflet directly, marker popups with equipment/date/quantity and Borrow links; accessible list fallback |

## Important implementation decisions

- Domain rules live in `src/lib/domain.ts`, independently of Next.js and Firebase. The Firestore adapter executes the same operations in real database transactions.
- `stockDays/{equipmentId}_{date}` stores `capacity` and `reserved`. Reservation changes update both the reservation and affected stock documents in one transaction.
- Transaction callbacks read before writing and have no external side effects. Repeated booking requests use a deterministic worker/request-token reservation ID.
- Auth actions are same-origin only. Sessions use HttpOnly/SameSite cookies (Secure under HTTPS). Every action checks session, current role and ownership, as appropriate. Logout clears the cookie and revokes refresh tokens.
- Inventory deletion first gates the parent as `deleting`, then cancels at most 20 reservations per request and archives at most 100 equipment lines. A Resume deletion control continues interrupted work. Historical snapshots remain.
- Catalogue/reservations use cursor pagination. The map and admin overview currently cap their discovery reads at 100 libraries and 200 equipment lines and disclose this in the UI. Extend cursor pagination/clustering before a large deployment.
- Tile requests go directly to OpenStreetMap, with visible attribution. Map tile failure leaves an equivalent location list available. No Google Maps, React-Leaflet or other React mapping wrapper is used.
- Read-only preview data is not a substitute for live Firebase validation.

## Tests and evidence

`npm test` checks 12 cases with a serialised in-memory transaction adapter: final-unit contention, idempotency, editing, rollback, cancellation replay, ownership, stale versions, deleting parents, invalid inputs and the capacity invariant. This tests business logic and read-before-write ordering; it **does not validate Firestore integration, Security Rules or distributed contention**. Record those results separately after connection.

`docs/ACCEPTANCE.md` is the live test checklist. `docs/DEVELOPMENT.md` records actual development milestones and evidence limits. The technical report must be written after real integration and screenshots, not by inventing successful outcomes.

## Submission packaging

Run `npm run package` to create `GreenShare_AE2_Source.zip` next to the project. It excludes `node_modules`, `.next`, caches, `.git`, private environment files and service-account keys. Check the archive before uploading. Submit the technical report separately from the source ZIP.

The Git history contains genuine incremental commits made as features were added. Do not fabricate or backdate commits. If using GitHub, push the existing history to a new repository under your own account after reviewing files for private data.

## AI assistance

This source was generated and developed with OpenAI ChatGPT/Codex assistance on 24 November 2026. AI assistance covers substantial code, interface design, tests and documentation. Follow the module’s permitted-use rules; acknowledgement alone does not grant permission. Test, understand and adapt the work before assessing it as your own submission.

## Primary references

- https://nextjs.org/docs/app/getting-started/installation
- https://react.dev/reference/react/useActionState
- https://firebase.google.com/docs/firestore/manage-data/transactions
- https://firebase.google.com/docs/auth/admin/manage-cookies
- https://firebase.google.com/docs/reference/rest/auth
- https://leafletjs.com/reference-1.9.4.html
