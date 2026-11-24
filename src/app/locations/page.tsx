import Link from 'next/link';
import { Shell, PageHeader } from '@/components/shell';
import { LocationMap } from '@/components/location-map';
import { requireUser } from '@/lib/session';
import { mapData } from '@/lib/data';
import { formatDate } from '@/lib/domain';
export default async function Locations() {
  const user = await requireUser();
  const locations = await mapData();
  return (
    <Shell user={user} active="/locations">
      <PageHeader
        eyebrow="GOOD THINGS, CLOSE TO HOME"
        title="Your neighbourhood, equipped."
        description="Select a library marker to see equipment, available quantities and borrowing dates."
      />
      <LocationMap locations={locations} admin={user.role === 'admin'} />
      <div className="section-heading">
        <h2>Browse libraries</h2>
        <span>{locations.length} locations</span>
      </div>
      <p className="muted">
        Map view displays up to 100 libraries and 200 equipment lines. The
        catalogue supports further pages.
      </p>
      <div className="location-list">
        {locations.map((library) => (
          <section className="panel" key={library.id}>
            <h2>{library.name}</h2>
            <p>{library.address}</p>
            {library.equipment.map((e) => (
              <div key={e.id} className="location-equipment">
                <div>
                  <strong>{e.name}</strong>
                  <span>{e.category}</span>
                  {e.stock.map((s) => (
                    <small key={s.date}>
                      {formatDate(s.date)} · {s.capacity - s.reserved} available
                    </small>
                  ))}
                </div>
                <Link
                  className="button button-small"
                  href={user.role === 'admin' ? '/admin' : '/equipment/' + e.id}
                >
                  {user.role === 'admin' ? 'Manage' : 'Borrow'}
                </Link>
              </div>
            ))}
            {!library.equipment.length && (
              <p>No active equipment at this location.</p>
            )}
          </section>
        ))}
      </div>
    </Shell>
  );
}
