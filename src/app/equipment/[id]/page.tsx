import Link from 'next/link';
import { randomUUID } from 'node:crypto';
import { notFound } from 'next/navigation';
import { Shell, PageHeader } from '@/components/shell';
import { Artwork } from '@/components/artwork';
import { ReservationForm } from '@/components/reservation-form';
import { equipmentDetails } from '@/lib/data';
import { requireUser } from '@/lib/session';
import { DATES, formatDate } from '@/lib/domain';
export default async function EquipmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string }> }) {
  const user = await requireUser(); const { id } = await params; const query = await searchParams;
  let item; try { item = await equipmentDetails(id); } catch { notFound(); } if (!item) notFound();
  const date = (DATES as readonly string[]).includes(query.date || '') ? query.date! : DATES[0];
  return <Shell user={user} active="/catalogue"><Link className="back-link" href="/catalogue">Back to equipment</Link><PageHeader eyebrow={item.category.toUpperCase()} title={item.name} description={item.library.name}/><div className="detail-grid"><section className="detail-main"><Artwork name={item.name} category={item.category}/><div className="panel"><h2>A useful addition to your next project</h2><p>{item.description}</p><h3>Collect from</h3><p><strong>{item.library.name}</strong><br/>{item.library.address}</p><Link href="/locations">View libraries on the map</Link><h3>Availability by date</h3><div className="availability-days">{item.stock.map(s => <div key={s.date}><span>{formatDate(s.date)}</span><strong>{s.capacity - s.reserved} / {s.capacity} available</strong></div>)}</div></div></section><aside className="panel booking-panel"><span className="eyebrow">MAKE IT HAPPEN</span><h2>{user.role === 'worker' ? 'Borrow this equipment' : 'Inventory overview'}</h2>{user.role === 'worker' ? <ReservationForm equipmentId={item.id} stock={item.stock} selectedDate={date} token={randomUUID()}/> : <><p>Administrators manage inventory and existing Worker reservations.</p><Link href="/admin" className="button button-dark">Manage inventory</Link></>}</aside></div></Shell>;
}
