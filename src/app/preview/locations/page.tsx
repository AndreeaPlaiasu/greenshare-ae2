import Link from 'next/link';
import { Shell, PageHeader } from '@/components/shell';
import { LocationMap } from '@/components/location-map';
import { sampleLibraries, sampleEquipment } from '@/lib/sample';
import { formatDate } from '@/lib/domain';
export default function PreviewLocations() {
  const locations = sampleLibraries.map(l => ({ ...l, equipment: sampleEquipment.filter(e => e.libraryId === l.id) }));
  return <Shell active="/locations" preview><PageHeader eyebrow="ILLUSTRATIVE LOCATIONS" title="Your neighbourhood, equipped." description="Try the interactive map with sample inventory. These are demonstration locations, not real lending services."/><LocationMap locations={locations} admin={false} preview/><div className="section-heading"><h2>Sample libraries</h2><span>{locations.length} locations</span></div><div className="location-list">{locations.map(l => <section className="panel" key={l.id}><h2>{l.name}</h2><p>{l.address}</p>{l.equipment.map(e => <div className="location-equipment" key={e.id}><div><strong>{e.name}</strong>{e.stock.map(s => <small key={s.date}>{formatDate(s.date)} · {s.capacity - s.reserved} available</small>)}</div><Link className="button button-small" href="/setup">Set up borrowing</Link></div>)}</section>)}</div></Shell>;
}
