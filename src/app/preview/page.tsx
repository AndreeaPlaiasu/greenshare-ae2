import Link from 'next/link';
import { Shell, PageHeader } from '@/components/shell';
import { EquipmentCard, Hero, SearchFilters } from '@/components/catalogue';
import { sampleEquipment, sampleLibraries } from '@/lib/sample';
import { DATES } from '@/lib/domain';
export default async function Preview({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams; const date = (DATES as readonly string[]).includes(params.date || '') ? params.date! : DATES[0];
  const items = sampleEquipment.filter(e => (!params.category || e.category === params.category) && (!params.library || e.libraryId === params.library));
  return <Shell active="/catalogue" preview><PageHeader eyebrow="A LITTLE RESOURCEFULNESS GOES A LONG WAY" title="Find your next useful thing." description="Quality equipment. Local libraries. A lighter footprint." action={<span className="date-badge">BORROWING WINDOW<strong>1–3 February 2027</strong></span>}/><Hero count={items.length} locations={sampleLibraries.length}/><SearchFilters locations={sampleLibraries} {...params} date={date} preview/><div className="section-heading"><h2>Equipment to get things done</h2><span>{items.length} items · sample inventory</span></div><div className="equipment-grid">{items.map(item => <EquipmentCard key={item.id} item={item} date={date} preview/>)}</div>{!items.length && <div className="empty-state"><h2>No matching equipment</h2><p>Try another library or equipment type.</p><Link href="/preview">Clear filters</Link></div>}</Shell>;
}
