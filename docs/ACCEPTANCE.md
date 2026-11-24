# Live Firebase acceptance checks

Status: **pending real Firebase connection**. Do not mark a case passed from the sample preview or from unit tests alone.

| Case | Procedure and expected result | Status |
| --- | --- | --- |
| Authentication | Correct worker/admin credentials open the correct role. Incorrect password fails. Logout removes access. | Pending |
| A search | Filter each category, library and each allowed date; verify returned equipment and quantities. | Pending |
| B booking | Reserve two units; view the reference; verify reserved rises by two and remaining availability falls by two. | Pending |
| Concurrency | Two signed-in Workers request the final unit concurrently; exactly one succeeds. | Pending |
| Replay | Replay the same request token; one reservation and one allocation remain. | Pending |
| Invalid input | Tamper with date, quantity, identifiers and role payload; server rejects invalid input. | Pending |
| C history | Worker sees own history and full details; direct URL to another Worker’s record is unavailable. | Pending |
| E creation | Admin creates library and first equipment; verify three stockDays and map marker. Force a failed transaction and verify no partial creation. | Pending |
| F Admin list | Admin sees both Workers’ records; Worker cannot access Admin route/actions. | Pending |
| G editing | Change quantity on same date; move to another date. Verify both stock documents and reservation version. | Pending |
| Failed edit | Move to a full date; original booking and stock remain unchanged. | Pending |
| Cancellation | Cancel once, then retry; capacity restores only once and cancelled history remains. | Pending |
| H capacity | Try reducing capacity below reserved units; reject without corrupting stock. | Pending |
| H deletion | Delete equipment/library with active reservations. It immediately becomes unbookable, cancellations restore capacity, history persists. | Pending |
| Interrupted deletion | Seed >20 active reservations, start deletion, retry Resume; no double refunds and final state archived. | Pending |
| I map | Marker popup lists equipment, all three dates, quantities and item-specific Borrow links. | Pending |
| Map fallback | Block tile requests; location list still permits browsing and borrowing. | Pending |
| Rules | Unauthenticated/browser SDK Firestore reads and writes fail. Server paths still authorise correctly. | Pending |
| Accessibility | Complete login, filtering, booking and cancellation with keyboard; test dialog escape/focus. | Pending |
| Responsive | Check narrow mobile viewport, table scrolling and map/list layout. | Pending |

Capture screenshots and the actual environment/version with test results. Add those observations to the final technical report.
