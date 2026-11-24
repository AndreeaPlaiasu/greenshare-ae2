import Link from 'next/link';
import { DATES, formatDate, type Library } from '@/lib/domain';
import type { CatalogueItem } from '@/lib/data';
import { Artwork } from './artwork';
export function SearchFilters({
  locations,
  category = '',
  library = '',
  date = DATES[0],
  preview = false,
}: {
  locations: Library[];
  category?: string;
  library?: string;
  date?: string;
  preview?: boolean;
}) {
  return (
    <form
      action={preview ? '/preview' : '/catalogue'}
      className="search-filters"
    >
      <label>
        Equipment type
        <select name="category" defaultValue={category}>
          <option value="">All equipment</option>
          <option>Tool</option>
          <option>Sustainability Equipment</option>
        </select>
      </label>
      <label>
        Library location
        <select name="library" defaultValue={library}>
          <option value="">All libraries</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Borrowing date
        <select name="date" defaultValue={date}>
          {DATES.map((d) => (
            <option key={d} value={d}>
              {formatDate(d)}
            </option>
          ))}
        </select>
      </label>
      <button className="button button-dark" type="submit">
        <svg
          viewBox="0 0 24 24"
          width="19"
          height="19"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="6" />
          <path d="m15 15 5 5" />
        </svg>
        Find equipment
      </button>
    </form>
  );
}
export function EquipmentCard({
  item,
  date,
  preview = false,
  admin = false,
}: {
  item: CatalogueItem;
  date: string;
  preview?: boolean;
  admin?: boolean;
}) {
  const stock = item.stock.find((s) => s.date === date);
  const available = stock ? stock.capacity - stock.reserved : 0;
  return (
    <article className="equipment-card">
      <Artwork name={item.name} category={item.category} />
      <div className="card-body">
        <div className="card-meta">
          <span>{item.category}</span>
          <span
            className={available ? 'availability' : 'availability unavailable'}
          >
            {available ? `${available} available` : 'Fully booked'}
          </span>
        </div>
        <h3>{item.name}</h3>
        <p className="library-line">
          <span aria-hidden="true">⌖</span>
          {item.library.name}
        </p>
        <p className="equipment-description">{item.description}</p>
        <div className="card-bottom">
          <span>
            Borrow for the day
            <br />
            <strong>{formatDate(date)}</strong>
          </span>
          <Link
            className="button button-small"
            href={preview ? '/setup' : `/equipment/${item.id}?date=${date}`}
          >
            {preview
              ? 'Set up borrowing'
              : admin
                ? 'View details'
                : 'View & borrow'}
          </Link>
        </div>
      </div>
    </article>
  );
}
export function Hero({
  count,
  locations,
}: {
  count: number;
  locations: number;
}) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="hero-kicker">GOOD TOOLS. SHARED LOCALLY.</span>
        <h2>
          Your next project
          <br />
          starts with sharing.
        </h2>
        <p>
          From everyday fixes to greener living. Find what you need, borrow it
          locally, and put it to good use.
        </p>
        <div className="hero-stats">
          <span>
            <strong>{count}</strong> items on this page
          </span>
          <span>
            <strong>{locations}</strong> local libraries
          </span>
          <span>
            <strong>3</strong> borrowing days
          </span>
        </div>
      </div>
      <div className="hero-graphic" aria-hidden="true">
        <span className="hero-orbit" />
        <svg viewBox="0 0 220 200" fill="none">
          <path
            d="M49 66h122v92H49Z"
            fill="#c4e59b"
            stroke="#152f28"
            strokeWidth="5"
          />
          <path
            d="M79 65V40h63v25M49 94h122M96 94v18h29V94"
            stroke="#152f28"
            strokeWidth="5"
          />
          <path
            d="m145 35 13-13M167 47h18M142 18V5"
            stroke="#d8eeaf"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="44" cy="159" r="28" fill="#f3f6f5" />
          <path
            d="m31 159 10 10 17-21"
            stroke="#2a5c48"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
        <span className="graphic-label">
          OWN LESS.
          <br />
          DO MORE.
        </span>
      </div>
    </section>
  );
}
