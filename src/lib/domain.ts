export const DATES = ['2027-02-01', '2027-02-02', '2027-02-03'] as const;
export type BorrowDate = (typeof DATES)[number];
export type Role = 'worker' | 'admin';
export type Actor = { uid: string; username: string; role: Role };
export type Status = 'active' | 'deleting' | 'archived';
export type Library = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: Status;
  version: number;
};
export type Equipment = {
  id: string;
  libraryId: string;
  name: string;
  category: 'Tool' | 'Sustainability Equipment';
  description: string;
  status: Status;
  version: number;
};
export type Stock = {
  equipmentId: string;
  date: string;
  capacity: number;
  reserved: number;
};
export type Reservation = {
  id: string;
  workerId: string;
  libraryId: string;
  equipmentId: string;
  date: string;
  quantity: number;
  status: 'active' | 'cancelled';
  version: number;
  equipmentName: string;
  libraryName: string;
  libraryAddress: string;
  createdAt: string;
  updatedAt: string;
};
export type RecordData = Record<string, unknown>;
export interface Transaction {
  get<T>(path: string): Promise<T | undefined>;
  create(path: string, data: RecordData): void;
  update(path: string, data: RecordData): void;
}
export interface Store {
  transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T>;
}
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
export function fail(message: string): never {
  throw new DomainError(message);
}
export function validId(value: string) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(value)) fail('Invalid record reference.');
  return value;
}
export function quantity(value: unknown) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1 || n > 100000)
    fail('Enter a whole quantity between 1 and 100,000.');
  return n;
}
export function date(value: string): BorrowDate {
  if (!(DATES as readonly string[]).includes(value))
    fail('Borrowing is available only on 1, 2 and 3 February 2027.');
  return value as BorrowDate;
}
export function capacity(value: unknown) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0 || n > 100000)
    fail('Capacity must be a whole number from 0 to 100,000.');
  return n;
}
export function text(value: unknown, label: string, min = 1, max = 160) {
  const t = String(value ?? '').trim();
  if (t.length < min || t.length > max)
    fail(`${label} must contain ${min}–${max} characters.`);
  return t;
}
export function admin(actor: Actor) {
  if (actor.role !== 'admin') fail('Administrator access is required.');
}
export function owner(actor: Actor, record: Reservation) {
  if (actor.role !== 'admin' && record.workerId !== actor.uid)
    fail('This reservation is not available to your account.');
}
export function checkStock(s: Stock | undefined): asserts s is Stock {
  if (
    !s ||
    !Number.isSafeInteger(s.capacity) ||
    !Number.isSafeInteger(s.reserved) ||
    s.reserved < 0 ||
    s.capacity < s.reserved
  )
    fail('Stock is unavailable. Please contact the library.');
}
export function checkVersion(actual: number, expected: number) {
  if (!Number.isSafeInteger(expected) || actual !== expected)
    fail('This record changed. Reload the page before trying again.');
}
export const stockPath = (id: string, d: string) =>
  `stockDays/${validId(id)}_${date(d)}`;
export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value + 'T12:00:00Z'));
}

export async function createReservation(
  store: Store,
  actor: Actor,
  input: { id: string; equipmentId: string; date: string; quantity: number },
): Promise<string> {
  if (actor.role !== 'worker')
    fail('Only Workers can create borrowing reservations.');
  const id = validId(input.id),
    equipmentId = validId(input.equipmentId),
    d = date(input.date),
    q = quantity(input.quantity);
  return store.transaction(async (tx) => {
    const previous = await tx.get<Reservation>(`reservations/${id}`);
    if (previous) {
      if (
        previous.workerId !== actor.uid ||
        previous.equipmentId !== equipmentId ||
        previous.date !== d ||
        previous.quantity !== q
      )
        fail(
          'This request token has already been used. Reload before submitting a new request.',
        );
      return previous.id;
    }
    const eq = await tx.get<Equipment>(`equipment/${equipmentId}`);
    if (!eq || eq.status !== 'active')
      fail('This equipment is no longer available.');
    const library = await tx.get<Library>(`libraries/${validId(eq.libraryId)}`);
    const stock = await tx.get<Stock>(stockPath(equipmentId, d));
    if (!library || library.status !== 'active')
      fail('This library is no longer available.');
    checkStock(stock);
    if (q > stock.capacity - stock.reserved)
      fail(
        `Only ${stock.capacity - stock.reserved} available on this date. Choose a smaller quantity or another date.`,
      );
    const now = new Date().toISOString();
    tx.create(`reservations/${id}`, {
      id,
      workerId: actor.uid,
      libraryId: library.id,
      equipmentId,
      date: d,
      quantity: q,
      status: 'active',
      version: 1,
      equipmentName: eq.name,
      libraryName: library.name,
      libraryAddress: library.address,
      createdAt: now,
      updatedAt: now,
    });
    tx.update(stockPath(equipmentId, d), { reserved: stock.reserved + q });
    return id;
  });
}

export async function updateReservation(
  store: Store,
  actor: Actor,
  input: { id: string; date: string; quantity: number; version: number },
) {
  const id = validId(input.id),
    d = date(input.date),
    q = quantity(input.quantity);
  return store.transaction(async (tx) => {
    const r = await tx.get<Reservation>(`reservations/${id}`);
    if (!r) fail('Reservation not found.');
    owner(actor, r);
    checkVersion(r.version, input.version);
    if (r.status !== 'active')
      fail('A cancelled reservation cannot be edited.');
    const library = await tx.get<Library>(`libraries/${validId(r.libraryId)}`);
    const eq = await tx.get<Equipment>(`equipment/${validId(r.equipmentId)}`);
    const old = await tx.get<Stock>(stockPath(r.equipmentId, r.date));
    const target =
      d === r.date ? old : await tx.get<Stock>(stockPath(r.equipmentId, d));
    if (library?.status !== 'active' || eq?.status !== 'active')
      fail('This inventory is being removed; contact the library.');
    checkStock(old);
    checkStock(target);
    if (old.reserved < r.quantity)
      fail('Stock requires an administrator review.');
    const newReserved = target.reserved - (d === r.date ? r.quantity : 0) + q;
    if (newReserved > target.capacity)
      fail(
        'The requested quantity is no longer available. Your original reservation is unchanged.',
      );
    if (d !== r.date)
      tx.update(stockPath(r.equipmentId, r.date), {
        reserved: old.reserved - r.quantity,
      });
    tx.update(stockPath(r.equipmentId, d), { reserved: newReserved });
    tx.update(`reservations/${id}`, {
      date: d,
      quantity: q,
      version: r.version + 1,
      updatedAt: new Date().toISOString(),
    });
    return id;
  });
}

export async function cancelReservation(
  store: Store,
  actor: Actor,
  id: string,
  expectedVersion?: number,
) {
  validId(id);
  return store.transaction(async (tx) => {
    const r = await tx.get<Reservation>(`reservations/${id}`);
    if (!r) fail('Reservation not found.');
    owner(actor, r);
    if (r.status === 'cancelled') return id;
    if (expectedVersion !== undefined) checkVersion(r.version, expectedVersion);
    const stock = await tx.get<Stock>(stockPath(r.equipmentId, r.date));
    checkStock(stock);
    if (stock.reserved < r.quantity)
      fail('Stock requires an administrator review.');
    tx.update(stockPath(r.equipmentId, r.date), {
      reserved: stock.reserved - r.quantity,
    });
    tx.update(`reservations/${id}`, {
      status: 'cancelled',
      version: r.version + 1,
      updatedAt: new Date().toISOString(),
    });
    return id;
  });
}
