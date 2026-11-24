export function Artwork({
  name,
  category,
}: {
  name: string;
  category: string;
}) {
  const n = name.toLowerCase();
  return (
    <div
      className={
        'equipment-art ' +
        (category === 'Tool' ? 'art-tool' : 'art-sustainability')
      }
      aria-hidden="true"
    >
      <span className="art-circle" />
      <svg
        viewBox="0 0 200 130"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {n.includes('drill') ? (
          <>
            <path d="M48 40h65l22 12v24H83l-8 31H53l10-42H48Z" />
            <path d="M135 51h24v24h-24M159 63h20M52 107h35M85 44v28M64 43v20" />
            <path d="M99 80v13h17V80" />
          </>
        ) : n.includes('ladder') ? (
          <>
            <path d="m65 113 25-99h22l25 99M80 45h45M73 70h59M67 96h70M89 16l-8 97M111 16l8 97" />
          </>
        ) : n.includes('garden') || n.includes('compost') ? (
          <>
            <path d="M53 62h94l-9 48H62ZM62 62l13-24h51l12 24M82 78v19M102 78v19M122 78v19" />
            <path d="M100 38V16M100 29c-18 1-20-12-20-12 18-3 20 12 20 12ZM101 24c17 0 19-13 19-13-17-2-19 13-19 13Z" />
          </>
        ) : n.includes('energy') || n.includes('thermal') ? (
          <>
            <rect x="64" y="17" width="72" height="97" rx="10" />
            <rect x="76" y="30" width="48" height="35" rx="3" />
            <path d="m104 35-15 15h14l-9 12M80 81h5M112 81h5M97 95h6" />
          </>
        ) : n.includes('washer') ? (
          <>
            <rect x="57" y="47" width="70" height="55" rx="8" />
            <circle cx="72" cy="106" r="10" />
            <circle cx="115" cy="106" r="10" />
            <path d="M76 47V25h36v22M127 66h24V34l18-12M82 66h20M92 56v20" />
          </>
        ) : (
          <>
            <path d="M51 48h98v62H51ZM72 48V29h57v19M51 66h98M87 66v13h25V66M65 93h12M127 93h10" />
          </>
        )}
      </svg>
      <span className="art-caption">
        {category === 'Tool' ? 'MADE FOR THE JOB' : 'LIGHTER ON THE PLANET'}
      </span>
    </div>
  );
}
