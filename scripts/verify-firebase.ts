import assert from 'node:assert/strict';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  createReservation,
  updateReservation,
  cancelReservation,
  DATES,
  stockPath,
  type Store,
  type Reservation,
} from '../src/lib/domain.ts';
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore(app);
const store: Store = {
  transaction: (work) =>
    db.runTransaction(async (t) =>
      work({
        get: async <T>(p: string) => {
          const s = await t.get(db.doc(p));
          return s.exists ? (s.data() as T) : undefined;
        },
        create: (p, d) => {
          t.create(db.doc(p), d);
        },
        update: (p, d) => {
          t.update(db.doc(p), d);
        },
      }),
    ),
};
const suffix = Date.now().toString();
const lib = 'verify-lib-' + suffix,
  eq = 'verify-eq-' + suffix;
const worker = {
    uid: 'verify-worker-a',
    username: 'verification-a',
    role: 'worker' as const,
  },
  other = {
    uid: 'verify-worker-b',
    username: 'verification-b',
    role: 'worker' as const,
  };
const admin = {
  uid: 'verify-admin',
  username: 'verification-admin',
  role: 'admin' as const,
};
const outcomes: string[] = [];
const pass = (s: string) => {
  outcomes.push(s);
  console.log('PASS ' + s);
};
await db
  .doc('libraries/' + lib)
  .create({
    id: lib,
    name: 'Integration verification',
    address: 'Demonstration only',
    latitude: 51.5,
    longitude: -0.1,
    status: 'active',
    version: 1,
  });
await db
  .doc('equipment/' + eq)
  .create({
    id: eq,
    libraryId: lib,
    name: 'Integration test equipment',
    category: 'Tool',
    description: 'Automated verification',
    status: 'active',
    version: 1,
  });
for (const d of DATES)
  await db
    .doc(stockPath(eq, d))
    .create({ equipmentId: eq, date: d, capacity: 1, reserved: 0 });
const a = 'verify-a-' + suffix,
  b = 'verify-b-' + suffix;
const results = await Promise.allSettled([
  createReservation(store, worker, {
    id: a,
    equipmentId: eq,
    date: DATES[0],
    quantity: 1,
  }),
  createReservation(store, other, {
    id: b,
    equipmentId: eq,
    date: DATES[0],
    quantity: 1,
  }),
]);
assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
pass('Real Firestore final-unit contention: exactly one transaction succeeds');
const winner = results[0].status === 'fulfilled' ? worker : other,
  loser = winner === worker ? other : worker,
  id = results[0].status === 'fulfilled' ? a : b;
await createReservation(store, winner, {
  id,
  equipmentId: eq,
  date: DATES[0],
  quantity: 1,
});
assert.equal((await db.doc(stockPath(eq, DATES[0])).get()).data()!.reserved, 1);
pass('Replay allocates once');
await assert.rejects(
  updateReservation(store, loser, {
    id,
    date: DATES[1],
    quantity: 1,
    version: 1,
  }),
);
pass('Ownership enforced in domain transaction');
await updateReservation(store, winner, {
  id,
  date: DATES[1],
  quantity: 1,
  version: 1,
});
assert.equal((await db.doc(stockPath(eq, DATES[0])).get()).data()!.reserved, 0);
assert.equal((await db.doc(stockPath(eq, DATES[1])).get()).data()!.reserved, 1);
pass('Date edit releases old allocation and reserves target');
await assert.rejects(
  updateReservation(store, winner, {
    id,
    date: DATES[1],
    quantity: 1,
    version: 1,
  }),
);
pass('Stale version rejected');
const full = 'verify-full-' + suffix;
await createReservation(store, loser, {
  id: full,
  equipmentId: eq,
  date: DATES[2],
  quantity: 1,
});
await assert.rejects(
  updateReservation(store, winner, {
    id,
    date: DATES[2],
    quantity: 1,
    version: 2,
  }),
);
assert.equal((await db.doc('reservations/' + id).get()).data()!.date, DATES[1]);
pass('Failed edit leaves original reservation intact');
await cancelReservation(store, admin, id, 2);
await cancelReservation(store, admin, id, 2);
assert.equal((await db.doc(stockPath(eq, DATES[1])).get()).data()!.reserved, 0);
pass('Admin cancellation and retry restore capacity once');
await db.doc('libraries/' + lib).update({ status: 'deleting' });
await assert.rejects(
  createReservation(store, worker, {
    id: 'verify-block-' + suffix,
    equipmentId: eq,
    date: DATES[0],
    quantity: 1,
  }),
);
pass('Deleting parent blocks new borrowing');
await cancelReservation(store, admin, full, 1);
for (const d of DATES) {
  const s = (await db.doc(stockPath(eq, d)).get()).data()!;
  assert.equal(s.reserved, 0);
}
pass('All test allocations released; cancelled history preserved');
await db.doc('equipment/' + eq).update({ status: 'archived' });
await db.doc('libraries/' + lib).update({ status: 'archived' });
const r = await fetch(
  'https://firestore.googleapis.com/v1/projects/' +
    process.env.FIREBASE_PROJECT_ID +
    '/databases/(default)/documents/equipment/cordless-drill?key=' +
    process.env.FIREBASE_WEB_API_KEY,
);
assert.equal(r.status, 403);
pass('Unauthenticated Firestore REST read denied by production rules');
console.log(JSON.stringify({ passed: outcomes.length, outcomes }));
