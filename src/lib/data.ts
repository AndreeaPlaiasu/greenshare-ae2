import 'server-only';
import { FieldPath, type Query } from 'firebase-admin/firestore';
import { db } from './firebase';
import {
  DATES,
  date,
  validId,
  owner,
  type Actor,
  type Equipment,
  type Library,
  type Reservation,
  type Stock,
} from './domain';
export type CatalogueItem = Equipment & { library: Library; stock: Stock[] };
export async function libraries(includeInactive = false) {
  const result = await db().collection('libraries').limit(100).get();
  return result.docs
    .map((d) => d.data() as Library)
    .filter((l) =>
      includeInactive ? l.status !== 'archived' : l.status === 'active',
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}
export async function catalogue(params: {
  category?: string;
  library?: string;
  date?: string;
  after?: string;
}) {
  const selectedDate = date(params.date || DATES[0]);
  let query: Query = db()
    .collection('equipment')
    .where('status', '==', 'active');
  if (
    params.category &&
    !['Tool', 'Sustainability Equipment'].includes(params.category)
  )
    throw new Error('Invalid equipment type.');
  if (params.category) query = query.where('category', '==', params.category);
  if (params.library)
    query = query.where('libraryId', '==', validId(params.library));
  query = query.orderBy('name').orderBy(FieldPath.documentId());
  if (params.after) {
    const id = validId(params.after);
    const cursor = await db().doc(`equipment/${id}`).get();
    if (cursor.exists) query = query.startAfter(cursor);
  }
  const result = await query.limit(25).get();
  const items = result.docs.map((d) => d.data() as Equipment);
  const locations = await libraries();
  const locationMap = new Map(locations.map((l) => [l.id, l]));
  const snapshots = items.length
    ? await db().getAll(
        ...items.flatMap((e) =>
          DATES.map((d) => db().doc(`stockDays/${e.id}_${d}`)),
        ),
      )
    : [];
  const stockMap = new Map(
    snapshots.filter((d) => d.exists).map((d) => [d.id, d.data() as Stock]),
  );
  const data = items
    .filter((e) => locationMap.has(e.libraryId))
    .map((e) => ({
      ...e,
      library: locationMap.get(e.libraryId)!,
      stock: DATES.map(
        (d) =>
          stockMap.get(`${e.id}_${d}`) ?? {
            equipmentId: e.id,
            date: d,
            capacity: 0,
            reserved: 0,
          },
      ),
    }));
  return {
    data,
    locations,
    selectedDate,
    next: result.size === 25 ? result.docs.at(-1)!.id : null,
  };
}
export async function equipmentDetails(
  id: string,
): Promise<CatalogueItem | null> {
  const eq = (
    await db()
      .doc(`equipment/${validId(id)}`)
      .get()
  ).data() as Equipment | undefined;
  if (!eq || eq.status !== 'active') return null;
  const library = (await db().doc(`libraries/${eq.libraryId}`).get()).data() as
    | Library
    | undefined;
  if (!library || library.status !== 'active') return null;
  const snaps = await db().getAll(
    ...DATES.map((d) => db().doc(`stockDays/${id}_${d}`)),
  );
  return {
    ...eq,
    library,
    stock: snaps.map((snap, i) =>
      snap.exists
        ? (snap.data() as Stock)
        : { equipmentId: id, date: DATES[i], capacity: 0, reserved: 0 },
    ),
  };
}
export async function reservationList(actor: Actor, after?: string) {
  let query: Query = db().collection('reservations');
  if (actor.role === 'worker') query = query.where('workerId', '==', actor.uid);
  query = query
    .orderBy('createdAt', 'desc')
    .orderBy(FieldPath.documentId(), 'desc');
  if (after) {
    const snap = await db()
      .doc(`reservations/${validId(after)}`)
      .get();
    if (snap.exists) {
      owner(actor, snap.data() as Reservation);
      query = query.startAfter(snap);
    }
  }
  const result = await query.limit(30).get();
  return {
    data: result.docs.map((d) => d.data() as Reservation),
    next: result.size === 30 ? result.docs.at(-1)!.id : null,
  };
}
export async function reservationDetails(actor: Actor, id: string) {
  const r = (
    await db()
      .doc(`reservations/${validId(id)}`)
      .get()
  ).data() as Reservation | undefined;
  if (!r || (actor.role !== 'admin' && r.workerId !== actor.uid)) return null;
  return r;
}
export async function adminInventory(actor: Actor) {
  if (actor.role !== 'admin')
    throw new Error('Administrator access is required.');
  const [locations, result] = await Promise.all([
    libraries(true),
    db().collection('equipment').limit(200).get(),
  ]);
  const all = result.docs
    .map((d) => d.data() as Equipment)
    .filter((e) => e.status !== 'archived');
  const snaps = all.length
    ? await db().getAll(
        ...all.flatMap((e) =>
          DATES.map((d) => db().doc(`stockDays/${e.id}_${d}`)),
        ),
      )
    : [];
  const stocks = new Map(
    snaps.filter((s) => s.exists).map((s) => [s.id, s.data() as Stock]),
  );
  return {
    locations,
    equipment: all.map((e) => ({
      ...e,
      stock: DATES.map(
        (d) =>
          stocks.get(`${e.id}_${d}`) ?? {
            equipmentId: e.id,
            date: d,
            capacity: 0,
            reserved: 0,
          },
      ),
    })),
  };
}
export async function mapData() {
  const locations = await libraries();
  const result = await db()
    .collection('equipment')
    .where('status', '==', 'active')
    .limit(200)
    .get();
  const eq = result.docs
    .map((d) => d.data() as Equipment)
    .filter((e) => locations.some((l) => l.id === e.libraryId));
  const snaps = eq.length
    ? await db().getAll(
        ...eq.flatMap((e) =>
          DATES.map((d) => db().doc(`stockDays/${e.id}_${d}`)),
        ),
      )
    : [];
  const stocks = new Map(
    snaps.filter((s) => s.exists).map((s) => [s.id, s.data() as Stock]),
  );
  return locations.map((l) => ({
    ...l,
    equipment: eq
      .filter((e) => e.libraryId === l.id)
      .map((e) => ({
        ...e,
        stock: DATES.map(
          (d) =>
            stocks.get(`${e.id}_${d}`) ?? {
              equipmentId: e.id,
              date: d,
              capacity: 0,
              reserved: 0,
            },
        ),
      })),
  }));
}
