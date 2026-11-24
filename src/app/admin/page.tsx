import { Shell, PageHeader } from '@/components/shell';
import {
  LibraryForm,
  EquipmentForm,
  DeleteInventory,
} from '@/components/inventory-forms';
import { requireUser } from '@/lib/session';
import { adminInventory } from '@/lib/data';
export default async function AdminPage() {
  const user = await requireUser('admin');
  const inventory = await adminInventory(user);
  return (
    <Shell user={user} active="/admin">
      <PageHeader
        eyebrow="KEEP YOUR COMMUNITY EQUIPPED"
        title="A well-kept library."
        description="Manage locations, equipment and borrowing capacity in one place."
      />
      <div className="admin-create-grid">
        <details className="panel">
          <summary className="large-summary">Add a library</summary>
          <p>Create a new location with its first equipment item.</p>
          <LibraryForm />
        </details>
        <details className="panel">
          <summary className="large-summary">Add equipment</summary>
          {inventory.locations.some((l) => l.status === 'active') ? (
            <>
              <p>Grow the inventory at an existing location.</p>
              <EquipmentForm locations={inventory.locations} />
            </>
          ) : (
            <p>Create an active library first.</p>
          )}
        </details>
      </div>
      <div className="section-heading">
        <h2>Locations & inventory</h2>
        <span>
          {inventory.locations.length} libraries · {inventory.equipment.length}{' '}
          equipment lines
        </span>
      </div>
      <p className="muted">
        Administration shows up to 100 locations and 200 equipment lines. Larger
        deployments require additional cursor pagination.
      </p>
      {inventory.locations.map((library) => {
        const equipment = inventory.equipment.filter(
          (e) => e.libraryId === library.id,
        );
        const reserved = equipment.reduce(
          (n, e) => n + e.stock.reduce((s, d) => s + d.reserved, 0),
          0,
        );
        return (
          <section className="panel library-admin" key={library.id}>
            <div className="section-heading">
              <div>
                <h2>{library.name}</h2>
                <p>{library.address}</p>
              </div>
              <span className={'status-tag ' + library.status}>
                {library.status}
              </span>
            </div>
            {library.status === 'active' && (
              <details>
                <summary>Edit library details</summary>
                <LibraryForm library={library} />
              </details>
            )}
            <DeleteInventory
              id={library.id}
              name={library.name}
              kind="libraries"
              version={library.version}
              deleting={library.status === 'deleting'}
              impact={`This includes all equipment in this library. The displayed inventory currently has ${reserved} reserved units across the three dates.`}
            />
            <div className="admin-equipment-list">
              {equipment.map((e) => (
                <details key={e.id} className="admin-equipment">
                  <summary>
                    <strong>{e.name}</strong>
                    <span>
                      {e.category} · {e.status}
                    </span>
                  </summary>
                  {library.status === 'active' && e.status === 'active' && (
                    <EquipmentForm
                      equipment={e}
                      stock={e.stock}
                      locations={inventory.locations}
                    />
                  )}
                  <DeleteInventory
                    id={e.id}
                    name={e.name}
                    kind="equipment"
                    version={e.version}
                    deleting={e.status === 'deleting'}
                    impact={`Currently ${e.stock.reduce((n, d) => n + d.reserved, 0)} units are reserved across the three dates.`}
                  />
                </details>
              ))}
            </div>
          </section>
        );
      })}
      {!inventory.locations.length && (
        <div className="empty-state">
          <h2>Your first library starts here</h2>
          <p>Add a location and some equipment to open borrowing.</p>
        </div>
      )}
    </Shell>
  );
}
