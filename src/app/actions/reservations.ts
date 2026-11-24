'use server';
import { createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { actionUser } from '@/lib/session';
import { store } from '@/lib/firebase';
import { createReservation, updateReservation, cancelReservation, DomainError, validId } from '@/lib/domain';
import type { ActionState } from './auth';
function refresh() { for (const route of ['/catalogue', '/locations', '/reservations', '/admin']) revalidatePath(route); }
export async function reserveAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const actor = await actionUser(); const token = validId(String(form.get('token') || ''));
    const id = createHash('sha256').update(`${actor.uid}:${token}`).digest('hex').slice(0, 40);
    await createReservation(store, actor, { id, equipmentId: String(form.get('equipmentId')), date: String(form.get('date')), quantity: Number(form.get('quantity')) });
    refresh(); return { ok: true, message: 'Your reservation is confirmed.', id };
  } catch (e) { return { ok: false, message: e instanceof DomainError ? e.message : 'The reservation could not be saved. Try again with the same form.' }; }
}
export async function editReservationAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const actor = await actionUser(); const id = String(form.get('id'));
    await updateReservation(store, actor, { id, date: String(form.get('date')), quantity: Number(form.get('quantity')), version: Number(form.get('version')) });
    refresh(); revalidatePath(`/reservations/${id}`); return { ok: true, message: 'Reservation updated.', id };
  } catch (e) { return { ok: false, message: e instanceof DomainError ? e.message : 'The change could not be saved. Your existing reservation is unchanged.' }; }
}
export async function cancelReservationAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const actor = await actionUser(); const id = String(form.get('id'));
    await cancelReservation(store, actor, id, Number(form.get('version')));
    refresh(); revalidatePath(`/reservations/${id}`); return { ok: true, message: 'Reservation cancelled and capacity restored.', id };
  } catch (e) { return { ok: false, message: e instanceof DomainError ? e.message : 'Cancellation failed. Please retry.' }; }
}
