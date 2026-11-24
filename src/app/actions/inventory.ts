'use server';
import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { actionUser } from '@/lib/session';
import { db, store } from '@/lib/firebase';
import { DATES, DomainError, fail, capacity, text, validId, checkVersion, checkStock, cancelReservation, type Equipment, type Library, type Stock, type Reservation } from '@/lib/domain';
import type { ActionState } from './auth';
function refresh() { for (const p of ['/admin', '/catalogue', '/locations', '/reservations']) revalidatePath(p); }
function locationFields(form: FormData) {
  const latitude = Number(form.get('latitude')), longitude = Number(form.get('longitude'));
  if (!String(form.get('latitude') ?? '').trim() || !String(form.get('longitude') ?? '').trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) fail('Enter valid latitude and longitude.');
  return { name: text(form.get('name'), 'Library name'), address: text(form.get('address'), 'Address', 5, 240), latitude, longitude };
}
function equipmentFields(form: FormData, prefix = '') {
  const category = String(form.get(prefix + 'category'));
  if (!['Tool', 'Sustainability Equipment'].includes(category)) fail('Select an equipment category.');
  return { name: text(form.get(prefix + 'name'), 'Equipment name'), category: category as Equipment['category'], description: text(form.get(prefix + 'description'), 'Description', 5, 800) };
}
function capacities(form: FormData) { return DATES.map(d => capacity(form.get(d))); }
export async function saveLibraryAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    await actionUser(true); const fields = locationFields(form); const inputId = String(form.get('id') || '');
    if (inputId) {
      const id = validId(inputId);
      await store.transaction(async tx => { const current = await tx.get<Library>(`libraries/${id}`); if (!current || current.status !== 'active') fail('This library cannot be edited.'); checkVersion(current.version, Number(form.get('version'))); tx.update(`libraries/${id}`, { ...fields, version: current.version + 1 }); });
    } else {
      const id = randomUUID(), equipmentId = randomUUID(), eq = equipmentFields(form, 'equipment_'), amounts = capacities(form);
      await store.transaction(async tx => {
        tx.create(`libraries/${id}`, { id, ...fields, status: 'active', version: 1 });
        tx.create(`equipment/${equipmentId}`, { id: equipmentId, libraryId: id, ...eq, status: 'active', version: 1 });
        DATES.forEach((date, i) => tx.create(`stockDays/${equipmentId}_${date}`, { equipmentId, date, capacity: amounts[i], reserved: 0 }));
      });
    }
    refresh(); return { ok: true, message: 'Library saved.' };
  } catch (e) { return { ok: false, message: e instanceof DomainError ? e.message : 'The library could not be saved.' }; }
}
export async function saveEquipmentAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    await actionUser(true); const fields = equipmentFields(form), amounts = capacities(form), libraryId = validId(String(form.get('libraryId')));
    const editing = Boolean(form.get('id')); const id = editing ? validId(String(form.get('id'))) : randomUUID();
    await store.transaction(async tx => {
      const parent = await tx.get<Library>(`libraries/${libraryId}`); if (parent?.status !== 'active') fail('Select an active library.');
      if (editing) {
        const current = await tx.get<Equipment>(`equipment/${id}`); if (!current || current.libraryId !== libraryId || current.status !== 'active') fail('Equipment cannot be edited.'); checkVersion(current.version, Number(form.get('version')));
        const stocks = await Promise.all(DATES.map(d => tx.get<Stock>(`stockDays/${id}_${d}`)));
        stocks.forEach((s, i) => { checkStock(s); if (amounts[i] < s.reserved) fail(`Capacity on ${DATES[i]} cannot be below ${s.reserved} reserved units.`); });
        tx.update(`equipment/${id}`, { ...fields, version: current.version + 1 });
        DATES.forEach((d, i) => tx.update(`stockDays/${id}_${d}`, { capacity: amounts[i] }));
      } else {
        tx.create(`equipment/${id}`, { id, libraryId, ...fields, status: 'active', version: 1 });
        DATES.forEach((date, i) => tx.create(`stockDays/${id}_${date}`, { equipmentId: id, date, capacity: amounts[i], reserved: 0 }));
      }
    });
    refresh(); return { ok: true, message: 'Equipment saved.' };
  } catch (e) { return { ok: false, message: e instanceof DomainError ? e.message : 'Equipment could not be saved.' }; }
}
export async function deleteInventoryAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const actor = await actionUser(true); const kind = String(form.get('kind')); if (!['libraries', 'equipment'].includes(kind)) fail('Invalid inventory type.'); const id = validId(String(form.get('id')));
    await store.transaction(async tx => {
      const item = await tx.get<Library | Equipment>(`${kind}/${id}`); if (!item) fail('Inventory not found.');
      if (item.status === 'active') { checkVersion(item.version, Number(form.get('version'))); tx.update(`${kind}/${id}`, { status: 'deleting', version: item.version + 1 }); }
    });
    const field = kind === 'libraries' ? 'libraryId' : 'equipmentId';
    const reservations = await db().collection('reservations').where(field, '==', id).where('status', '==', 'active').limit(20).get();
    for (const r of reservations.docs) await cancelReservation(store, actor, (r.data() as Reservation).id);
    const remaining = await db().collection('reservations').where(field, '==', id).where('status', '==', 'active').limit(1).get();
    if (!remaining.empty) { refresh(); return { ok: true, pending: true, message: 'Deletion is in progress. Select Resume deletion to continue cancelling reservations.' }; }
    if (kind === 'libraries') {
      const children = await db().collection('equipment').where('libraryId', '==', id).get();
      const unfinished = children.docs.filter(d => d.data().status !== 'archived');
      const batch = db().batch(); unfinished.slice(0, 100).forEach(d => batch.update(d.ref, { status: 'archived' })); await batch.commit();
      if (unfinished.length > 100) { refresh(); return { ok: true, pending: true, message: 'Reservations are cancelled. Resume deletion to finish archiving the inventory.' }; }
    }
    await db().doc(`${kind}/${id}`).update({ status: 'archived' });
    refresh(); return { ok: true, message: 'Inventory removed. Affected reservations are cancelled; history is retained.' };
  } catch (e) { refresh(); return { ok: false, pending: true, message: e instanceof DomainError ? e.message : 'Deletion is paused. The inventory stays unavailable; retry Resume deletion.' }; }
}
