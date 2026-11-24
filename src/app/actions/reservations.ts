'use server';
import { createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { actionUser } from '@/lib/session';
import { store } from '@/lib/firebase';
import {
  createReservation,
  updateReservation,
  cancelReservation,
  DomainError,
  validId,
} from '@/lib/domain';
import type { ActionState } from './auth';
function refreshReservationPages() {
  for (const route of ['/catalogue', '/locations', '/reservations', '/admin'])
    revalidatePath(route);
}
export async function reserveAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await actionUser();
    const token = validId(String(formData.get('token') || ''));
    const id = createHash('sha256')
      .update(`${user.uid}:${token}`)
      .digest('hex')
      .slice(0, 40);
    await createReservation(store, user, {
      id,
      equipmentId: String(formData.get('equipmentId')),
      date: String(formData.get('date')),
      quantity: Number(formData.get('quantity')),
    });
    refreshReservationPages();
    return { ok: true, message: 'Your reservation is confirmed.', id };
  } catch (e) {
    return {
      ok: false,
      message:
        e instanceof DomainError
          ? e.message
          : 'The reservation could not be saved. Try again with the same form.',
    };
  }
}
export async function editReservationAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await actionUser();
    const id = String(formData.get('id'));
    await updateReservation(store, user, {
      id,
      date: String(formData.get('date')),
      quantity: Number(formData.get('quantity')),
      version: Number(formData.get('version')),
    });
    refreshReservationPages();
    revalidatePath(`/reservations/${id}`);
    return { ok: true, message: 'Reservation updated.', id };
  } catch (e) {
    return {
      ok: false,
      message:
        e instanceof DomainError
          ? e.message
          : 'The change could not be saved. Your existing reservation is unchanged.',
    };
  }
}
export async function cancelReservationAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await actionUser();
    const id = String(formData.get('id'));
    await cancelReservation(store, user, id, Number(formData.get('version')));
    refreshReservationPages();
    revalidatePath(`/reservations/${id}`);
    return {
      ok: true,
      message: 'Reservation cancelled and capacity restored.',
      id,
    };
  } catch (e) {
    return {
      ok: false,
      message:
        e instanceof DomainError
          ? e.message
          : 'Cancellation failed. Please retry.',
    };
  }
}
