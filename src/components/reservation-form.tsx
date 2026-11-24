'use client';
import Link from 'next/link';
import { useActionState, useRef, useState } from 'react';
import { DATES, formatDate, type Reservation, type Stock } from '@/lib/domain';
import {
  reserveAction,
  editReservationAction,
  cancelReservationAction,
} from '@/app/actions/reservations';
import type { ActionState } from '@/app/actions/auth';
const initial: ActionState = { ok: false, message: '' };
export function ReservationForm({
  equipmentId,
  stock,
  selectedDate,
  token,
  reservation,
}: {
  equipmentId: string;
  stock: Stock[];
  selectedDate: string;
  token: string;
  reservation?: Reservation;
}) {
  const [selected, setSelected] = useState(selectedDate);
  const [state, action, pending] = useActionState(
    reservation ? editReservationAction : reserveAction,
    initial,
  );
  const today = stock.find((s) => s.date === selected);
  const available =
    (today ? today.capacity - today.reserved : 0) +
    (reservation?.date === selected && reservation.status === 'active'
      ? reservation.quantity
      : 0);
  return (
    <form action={action} className="stack-form reservation-form">
      <input type="hidden" name="equipmentId" value={equipmentId} />
      <input type="hidden" name="token" value={token} />
      {reservation && (
        <>
          <input type="hidden" name="id" value={reservation.id} />
          <input type="hidden" name="version" value={reservation.version} />
        </>
      )}
      <label>
        Borrowing date
        <select
          name="date"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {DATES.map((d) => (
            <option key={d} value={d}>
              {formatDate(d)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Quantity
        <input
          name="quantity"
          type="number"
          min="1"
          max={Math.max(available, 1)}
          required
          defaultValue={reservation?.quantity || 1}
        />
      </label>
      <div className="availability-note">
        <strong>{available} available</strong>
        <span>
          {reservation
            ? 'Includes your existing allocation on its current date.'
            : 'Availability is checked again when you confirm.'}
        </span>
      </div>
      {state.message && (
        <div
          role={state.ok ? 'status' : 'alert'}
          className={'form-message ' + (state.ok ? 'success' : 'error')}
        >
          {state.message}
          {state.ok && state.id && (
            <Link href={'/reservations/' + state.id}>View reservation</Link>
          )}
        </div>
      )}
      <button
        className="button button-dark"
        disabled={pending || available < 1 || (!reservation && state.ok)}
      >
        {pending
          ? 'Checking availability…'
          : reservation
            ? 'Save changes'
            : state.ok
              ? 'Reservation confirmed'
              : 'Confirm reservation'}
      </button>
      <p className="muted">
        One-day borrowing. Collection and return take place at the selected
        library.
      </p>
    </form>
  );
}
export function CancelReservation({
  reservation,
}: {
  reservation: Reservation;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(
    cancelReservationAction,
    initial,
  );
  return (
    <>
      <button
        className="button button-danger"
        onClick={() => dialog.current?.showModal()}
      >
        Cancel reservation
      </button>
      <dialog
        ref={dialog}
        className="confirm-dialog"
        aria-labelledby="cancel-title"
      >
        <h2 id="cancel-title">Cancel this reservation?</h2>
        <p>
          {reservation.quantity} × {reservation.equipmentName},{' '}
          {formatDate(reservation.date)}.
        </p>
        <p>
          The equipment will become available to other members. Your cancelled
          reservation stays in your history.
        </p>
        <form action={action}>
          <input type="hidden" name="id" value={reservation.id} />
          <input type="hidden" name="version" value={reservation.version} />
          {state.message && (
            <div
              className={'form-message ' + (state.ok ? 'success' : 'error')}
              role={state.ok ? 'status' : 'alert'}
            >
              {state.message}
            </div>
          )}
          <div className="button-row">
            <button
              className="button button-outline"
              type="button"
              onClick={() => dialog.current?.close()}
            >
              Close
            </button>
            {!state.ok && (
              <button className="button button-danger" disabled={pending}>
                {pending ? 'Cancelling…' : 'Yes, cancel reservation'}
              </button>
            )}
          </div>
        </form>
      </dialog>
    </>
  );
}
