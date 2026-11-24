# Live Firebase acceptance checks

Status: connected to real Firebase, verified 24 November 2026. Browser and database evidence are distinguished below. Extended checks remain pending.

| Case | Procedure and expected result | Status |
| --- | --- | --- |
| Authentication | Correct worker/admin credentials open the correct role. Incorrect password fails. Logout removes access. | Extended coverage pending |
| A search | Filter each category, library and each allowed date; verify returned equipment and quantities. | Extended coverage pending |
| B booking | Reserve two units; view the reference; verify reserved rises by two and remaining availability falls by two. | Extended coverage pending |
| Concurrency | Two signed-in Workers request the final unit concurrently; exactly one succeeds. | Extended coverage pending |
| Replay | Replay the same request token; one reservation and one allocation remain. | Extended coverage pending |
| Invalid input | Tamper with date, quantity, identifiers and role payload; server rejects invalid input. | Extended coverage pending |
| C history | Worker sees own history and full details; direct URL to another Worker’s record is unavailable. | Extended coverage pending |
| E creation | Admin creates library and first equipment; verify three stockDays and map marker. Force a failed transaction and verify no partial creation. | Extended coverage pending |
| F Admin list | Admin sees both Workers’ records; Worker cannot access Admin route/actions. | Extended coverage pending |
| G editing | Change quantity on same date; move to another date. Verify both stock documents and reservation version. | Extended coverage pending |
| Failed edit | Move to a full date; original booking and stock remain unchanged. | Extended coverage pending |
| Cancellation | Cancel once, then retry; capacity restores only once and cancelled history remains. | Extended coverage pending |
| H capacity | Try reducing capacity below reserved units; reject without corrupting stock. | Extended coverage pending |
| H deletion | Delete equipment/library with active reservations. It immediately becomes unbookable, cancellations restore capacity, history persists. | Extended coverage pending |
| Interrupted deletion | Seed >20 active reservations, start deletion, retry Resume; no double refunds and final state archived. | Extended coverage pending |
| I map | Marker popup lists equipment, all three dates, quantities and item-specific Borrow links. | Extended coverage pending |
| Map fallback | Block tile requests; location list still permits browsing and borrowing. | Extended coverage pending |
| Rules | Unauthenticated/browser SDK Firestore reads and writes fail. Server paths still authorise correctly. | Extended coverage pending |
| Accessibility | Complete login, filtering, booking and cancellation with keyboard; test dialog escape/focus. | Extended coverage pending |
| Responsive | Check narrow mobile viewport, table scrolling and map/list layout. | Extended coverage pending |

Capture screenshots and the actual environment/version with test results. Add those observations to the final technical report.

## Actual results

Passed in Chrome: Worker and Admin login, booking two units, cross-date quantity editing, cancellation, Worker logout, Admin history, library/initial-equipment creation, equipment name/capacity edit, library archive, and real-data map popup.

Passed against real Firestore: final-unit contention between two domain actors (not two browser sessions), replay, domain ownership, date allocation transfer, stale-version rejection, failed-edit preservation, Admin cancellation/retry, deleting-parent blocking, released allocations/history preservation, unauthenticated REST read denial.

Not yet established: wrong-password browser case, full category/date filter matrix, cross-user URL/action tampering, failure-injected inventory creation, reserved-capacity reduction, >20 interrupted deletion, deliberately blocked tiles, complete keyboard and cross-browser/mobile matrix. These are limitations, not passed tests.
