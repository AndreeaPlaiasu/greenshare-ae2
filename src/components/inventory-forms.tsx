'use client';
import { useActionState } from 'react';
import {
  DATES,
  formatDate,
  type Library,
  type Equipment,
  type Stock,
} from '@/lib/domain';
import {
  saveLibraryAction,
  saveEquipmentAction,
  deleteInventoryAction,
} from '@/app/actions/inventory';
import type { ActionState } from '@/app/actions/auth';
const initial: ActionState = { ok: false, message: '' };
function Result({ state }: { state: ActionState }) {
  return state.message ? (
    <div
      role={state.ok ? 'status' : 'alert'}
      className={'form-message ' + (state.ok ? 'success' : 'error')}
    >
      {state.message}
    </div>
  ) : null;
}
function EquipmentFields({
  equipment,
  prefix = '',
  stock,
}: {
  equipment?: Equipment;
  prefix?: string;
  stock?: Stock[];
}) {
  return (
    <>
      <label>
        Equipment name
        <input
          name={prefix + 'name'}
          required
          maxLength={160}
          defaultValue={equipment?.name}
        />
      </label>
      <label>
        Equipment type
        <select
          name={prefix + 'category'}
          defaultValue={equipment?.category || 'Tool'}
        >
          <option>Tool</option>
          <option>Sustainability Equipment</option>
        </select>
      </label>
      <label className="full-width">
        Description
        <textarea
          name={prefix + 'description'}
          required
          minLength={5}
          maxLength={800}
          rows={3}
          defaultValue={equipment?.description}
        />
      </label>
      <fieldset className="full-width">
        <legend>Daily capacity</legend>
        <div className="capacity-fields">
          {DATES.map((d) => (
            <label key={d}>
              {formatDate(d)}
              <input
                name={d}
                type="number"
                min={stock?.find((s) => s.date === d)?.reserved || 0}
                max={100000}
                required
                defaultValue={stock?.find((s) => s.date === d)?.capacity ?? 1}
              />
            </label>
          ))}
        </div>
        <p className="muted">
          Capacity includes reserved units and cannot fall below existing
          reservations.
        </p>
      </fieldset>
    </>
  );
}
export function LibraryForm({ library }: { library?: Library }) {
  const [state, action, pending] = useActionState(saveLibraryAction, initial);
  return (
    <form action={action} className="form-grid">
      {library && (
        <>
          <input type="hidden" name="id" value={library.id} />
          <input type="hidden" name="version" value={library.version} />
        </>
      )}
      <label>
        Library name
        <input
          name="name"
          required
          maxLength={160}
          defaultValue={library?.name}
        />
      </label>
      <label>
        Address
        <input
          name="address"
          required
          minLength={5}
          maxLength={240}
          defaultValue={library?.address}
        />
      </label>
      <label>
        Latitude
        <input
          name="latitude"
          type="number"
          min={-90}
          max={90}
          step="any"
          required
          defaultValue={library?.latitude}
        />
      </label>
      <label>
        Longitude
        <input
          name="longitude"
          type="number"
          min={-180}
          max={180}
          step="any"
          required
          defaultValue={library?.longitude}
        />
      </label>
      {!library && (
        <>
          <h3 className="full-width">Initial equipment</h3>
          <EquipmentFields prefix="equipment_" />
        </>
      )}
      <div className="full-width">
        <Result state={state} />
        <button className="button button-dark" disabled={pending}>
          {pending
            ? 'Saving…'
            : library
              ? 'Save library changes'
              : 'Create library & equipment'}
        </button>
      </div>
    </form>
  );
}
export function EquipmentForm({
  equipment,
  locations,
  stock,
}: {
  equipment?: Equipment;
  locations: Library[];
  stock?: Stock[];
}) {
  const [state, action, pending] = useActionState(saveEquipmentAction, initial);
  return (
    <form action={action} className="form-grid">
      {equipment && (
        <>
          <input type="hidden" name="id" value={equipment.id} />
          <input type="hidden" name="version" value={equipment.version} />
        </>
      )}
      <label className="full-width">
        Library location
        <select name="libraryId" defaultValue={equipment?.libraryId} required>
          {locations
            .filter(
              (l) => l.status === 'active' || l.id === equipment?.libraryId,
            )
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
        </select>
      </label>
      <EquipmentFields equipment={equipment} stock={stock} />
      <div className="full-width">
        <Result state={state} />
        <button className="button button-dark" disabled={pending}>
          {pending
            ? 'Saving…'
            : equipment
              ? 'Save equipment changes'
              : 'Add equipment'}
        </button>
      </div>
    </form>
  );
}
export function DeleteInventory({
  id,
  name,
  kind,
  version,
  deleting = false,
  impact,
}: {
  id: string;
  name: string;
  kind: 'libraries' | 'equipment';
  version: number;
  deleting?: boolean;
  impact: string;
}) {
  const [state, action, pending] = useActionState(
    deleteInventoryAction,
    initial,
  );
  return (
    <details className="delete-section" open={deleting}>
      <summary>
        {deleting
          ? 'Resume deletion'
          : `Delete ${kind === 'libraries' ? 'library' : 'equipment'}`}
      </summary>
      <p>
        <strong>{name}</strong> will be removed from active inventory. {impact}{' '}
        Affected reservations will be cancelled and retained in history.
      </p>
      <form action={action}>
        <input name="id" type="hidden" value={id} />
        <input name="kind" type="hidden" value={kind} />
        <input name="version" type="hidden" value={version} />
        <label className="checkbox-label">
          <input type="checkbox" name="confirm" value="yes" required />I
          understand the impact and confirm this action.
        </label>
        <Result state={state} />
        <button className="button button-danger" disabled={pending}>
          {pending
            ? 'Processing…'
            : deleting || state.pending
              ? 'Resume deletion'
              : 'Confirm deletion'}
        </button>
      </form>
    </details>
  );
}
