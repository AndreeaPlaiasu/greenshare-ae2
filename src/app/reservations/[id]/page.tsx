import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shell, PageHeader } from '@/components/shell';
import { ReservationForm, CancelReservation } from '@/components/reservation-form';
import { requireUser } from '@/lib/session';
import { reservationDetails, equipmentDetails } from '@/lib/data';
import { formatDate } from '@/lib/domain';
export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  let r; try { r = await reservationDetails(user, id); } catch { notFound(); } if (!r) notFound();
  const equipment = r.status === 'active' ? await equipmentDetails(r.equipmentId) : null;
  return <Shell user={user} active="/reservations"><Link href="/reservations" className="back-link">Back to reservations</Link><PageHeader eyebrow={'RESERVATION ' + r.id.slice(0, 8).toUpperCase()} title={r.equipmentName} description={r.status === 'active' ? 'Your equipment is reserved for the selected day.' : 'This reservation has been cancelled.'}/><div className="detail-grid"><section className="panel"><div className="section-heading"><h2>Reservation details</h2><span className={'status-tag ' + r.status}>{r.status === 'active' ? 'Reserved' : 'Cancelled'}</span></div><dl className="detail-list"><div><dt>Borrowing date</dt><dd>{formatDate(r.date)}</dd></div><div><dt>Quantity</dt><dd>{r.quantity}</dd></div><div><dt>Library</dt><dd>{r.libraryName}</dd></div><div><dt>Collection address</dt><dd>{r.libraryAddress}</dd></div><div><dt>Reservation reference</dt><dd className="reference">{r.id}</dd></div>{user.role === 'admin' && <div><dt>Worker UID</dt><dd className="reference">{r.workerId}</dd></div>}</dl>{r.status === 'active' && <CancelReservation reservation={r}/>}</section>{r.status === 'active' && equipment && <aside className="panel"><span className="eyebrow">PLANS CHANGED?</span><h2>Edit reservation</h2><ReservationForm equipmentId={r.equipmentId} stock={equipment.stock} selectedDate={r.date} token={r.id} reservation={r}/></aside>}{r.status === 'active' && !equipment && <aside className="panel"><h2>Inventory is being removed</h2><p>This item can no longer be edited. You can still cancel your reservation.</p></aside>}</div></Shell>;
}
