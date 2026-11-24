import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createReservation,
  updateReservation,
  cancelReservation,
  DATES,
  type Actor,
  type Store,
  type Transaction,
  type RecordData,
  type Reservation,
} from '../src/lib/domain.ts';
class MemoryStore implements Store {
  data = new Map<string, RecordData>();
  private queue: Promise<unknown> = Promise.resolve();
  transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    const operation = this.queue.then(async () => {
      const next = structuredClone(this.data);
      let wrote = false;
      const tx: Transaction = {
        async get<T>(path: string) {
          assert.equal(
            wrote,
            false,
            'Firestore requires all reads before writes',
          );
          return structuredClone(next.get(path)) as T | undefined;
        },
        create(path, value) {
          assert.equal(next.has(path), false);
          wrote = true;
          next.set(path, structuredClone(value));
        },
        update(path, value) {
          assert.ok(next.has(path));
          wrote = true;
          next.set(path, { ...next.get(path), ...structuredClone(value) });
        },
      };
      const result = await work(tx);
      this.data = next;
      return result;
    });
    this.queue = operation.catch(() => undefined);
    return operation;
  }
}
const worker: Actor = { uid: 'worker1', username: 'worker', role: 'worker' };
const other: Actor = { uid: 'worker2', username: 'other', role: 'worker' };
const admin: Actor = { uid: 'admin1', username: 'admin', role: 'admin' };
function fixture(capacity = 3) {
  const store = new MemoryStore();
  store.data.set('libraries/library1', {
    id: 'library1',
    name: 'Test Library',
    address: 'Test address',
    status: 'active',
    version: 1,
  });
  store.data.set('equipment/tool1', {
    id: 'tool1',
    name: 'Drill',
    libraryId: 'library1',
    category: 'Tool',
    status: 'active',
    version: 1,
  });
  DATES.forEach((date) =>
    store.data.set(`stockDays/tool1_${date}`, {
      equipmentId: 'tool1',
      date,
      capacity,
      reserved: 0,
    }),
  );
  return store;
}
const request = (id = 'r1', quantity = 1, date = DATES[0]) => ({
  id,
  equipmentId: 'tool1',
  date,
  quantity,
});
const reserved = (s: MemoryStore, d: string = DATES[0]) =>
  s.data.get(`stockDays/tool1_${d}`)!.reserved;
test('booking consumes stock; replayed request does not allocate twice', async () => {
  const s = fixture();
  await createReservation(s, worker, request('r1', 2));
  await createReservation(s, worker, request('r1', 2));
  assert.equal(reserved(s), 2);
  assert.equal(s.data.size, 6);
});
test('two Workers competing for the final unit produce one booking', async () => {
  const s = fixture(1);
  const result = await Promise.allSettled([
    createReservation(s, worker, request('r1')),
    createReservation(s, other, request('r2')),
  ]);
  assert.equal(result.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(reserved(s), 1);
});
test('same-date edit accounts for original allocation', async () => {
  const s = fixture(3);
  await createReservation(s, worker, request('r1', 3));
  await updateReservation(s, worker, {
    id: 'r1',
    date: DATES[0],
    quantity: 2,
    version: 1,
  });
  assert.equal(reserved(s), 2);
});
test('date change releases old date and allocates destination atomically', async () => {
  const s = fixture();
  await createReservation(s, worker, request('r1', 2));
  await updateReservation(s, worker, {
    id: 'r1',
    date: DATES[1],
    quantity: 2,
    version: 1,
  });
  assert.equal(reserved(s), 0);
  assert.equal(reserved(s, DATES[1]), 2);
});
test('failed destination booking preserves the original allocation', async () => {
  const s = fixture(2);
  await createReservation(s, worker, request('r1', 2));
  await createReservation(s, other, { ...request('r2', 2), date: DATES[1] });
  const before = structuredClone(s.data);
  await assert.rejects(
    updateReservation(s, worker, {
      id: 'r1',
      date: DATES[1],
      quantity: 1,
      version: 1,
    }),
    /original reservation is unchanged/,
  );
  assert.deepEqual(s.data, before);
});
test('cancellation replay restores capacity only once, including Admin cancellation', async () => {
  const s = fixture();
  await createReservation(s, worker, request('r1', 2));
  await cancelReservation(s, admin, 'r1', 1);
  await cancelReservation(s, admin, 'r1', 1);
  assert.equal(reserved(s), 0);
  assert.equal(s.data.get('reservations/r1')!.status, 'cancelled');
});
test('Workers cannot edit or cancel other Workers reservations', async () => {
  const s = fixture();
  await createReservation(s, worker, request());
  await assert.rejects(
    cancelReservation(s, other, 'r1', 1),
    /not available to your account/,
  );
  await assert.rejects(
    updateReservation(s, other, {
      id: 'r1',
      date: DATES[0],
      quantity: 2,
      version: 1,
    }),
    /not available to your account/,
  );
  assert.equal(reserved(s), 1);
});
test('stale version cannot overwrite a more recent edit', async () => {
  const s = fixture();
  await createReservation(s, worker, request());
  await updateReservation(s, worker, {
    id: 'r1',
    date: DATES[0],
    quantity: 2,
    version: 1,
  });
  await assert.rejects(
    updateReservation(s, worker, {
      id: 'r1',
      date: DATES[0],
      quantity: 3,
      version: 1,
    }),
    /record changed/,
  );
  assert.equal(reserved(s), 2);
});
test('deleting library blocks new bookings but allows cancellation', async () => {
  const s = fixture();
  await createReservation(s, worker, request());
  s.data.set('libraries/library1', {
    ...s.data.get('libraries/library1'),
    status: 'deleting',
  });
  await assert.rejects(
    createReservation(s, other, request('r2')),
    /no longer available/,
  );
  await cancelReservation(s, worker, 'r1', 1);
  assert.equal(reserved(s), 0);
});
test('invalid date, fractional quantity, tampered ID and Admin booking are rejected', async () => {
  const s = fixture();
  await assert.rejects(
    createReservation(s, worker, { ...request(), date: '2027-02-04' }),
    /only on/,
  );
  await assert.rejects(
    createReservation(s, worker, request('r1', 1.5)),
    /whole quantity/,
  );
  await assert.rejects(
    createReservation(s, worker, { ...request(), equipmentId: '../private' }),
    /Invalid record/,
  );
  await assert.rejects(createReservation(s, admin, request()), /Only Workers/);
  assert.equal(reserved(s), 0);
});
test('request token cannot be reused for a different quantity', async () => {
  const s = fixture();
  await createReservation(s, worker, request());
  await assert.rejects(
    createReservation(s, worker, request('r1', 2)),
    /already been used/,
  );
  assert.equal(reserved(s), 1);
});
test('stock invariant equals active reservation quantities after mixed changes', async () => {
  const s = fixture(8);
  await createReservation(s, worker, request('r1', 3));
  await createReservation(s, other, request('r2', 2));
  await updateReservation(s, worker, {
    id: 'r1',
    date: DATES[1],
    quantity: 4,
    version: 1,
  });
  await cancelReservation(s, admin, 'r2');
  for (const d of DATES) {
    const sum = [...s.data.entries()]
      .filter(
        ([key, value]) =>
          key.startsWith('reservations/') &&
          value.status === 'active' &&
          value.date === d,
      )
      .reduce((n, [, v]) => n + Number(v.quantity), 0);
    assert.equal(reserved(s, d), sum);
  }
});
