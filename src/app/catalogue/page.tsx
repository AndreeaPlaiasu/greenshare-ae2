import Link from 'next/link';
import { Shell, PageHeader, Notice } from '@/components/shell';
import { EquipmentCard, Hero, SearchFilters } from '@/components/catalogue';
import { catalogue } from '@/lib/data';
import { requireUser } from '@/lib/session';
export default async function Catalogue({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser(); const params = await searchParams;
  let result; try { result = await catalogue(params); } catch { return <Shell user={user} active="/catalogue"><PageHeader eyebrow="THE TOOL LIBRARY" title="Let’s try that search again." description="Check the equipment type, location and allowed borrowing date."/><Notice>We could not load this search. Check the filters or Firebase indexes.</Notice><Link href="/catalogue" className="button button-dark">Reset search</Link></Shell>; }
  const nextParams = new URLSearchParams(Object.entries({ category: params.category, library: params.library, date: result.selectedDate, after: result.next }).filter(([, v]) => v) as [string, string][]);
  return <Shell user={user} active="/catalogue"><PageHeader eyebrow="A LITTLE RESOURCEFULNESS GOES A LONG WAY" title="Find your next useful thing." description="Quality equipment. Local libraries. A lighter footprint." action={<span className="date-badge">BORROWING WINDOW<strong>1–3 February 2027</strong></span>}/><Hero count={result.data.length} locations={result.locations.length}/><SearchFilters locations={result.locations} {...params} date={result.selectedDate}/><div className="section-heading"><h2>Equipment to get things done</h2><span>{result.data.length} items on this page</span></div><div className="equipment-grid">{result.data.map(item => <EquipmentCard key={item.id} item={item} date={result.selectedDate} admin={user.role === 'admin'}/>)}</div>{!result.data.length && <div className="empty-state"><h2>No matches this time</h2><p>Try another library or equipment type.</p><Link href="/catalogue">Clear filters</Link></div>}{result.next && <div className="pagination"><Link className="button button-outline" href={'/catalogue?' + nextParams}>Next page</Link></div>}</Shell>;
}
