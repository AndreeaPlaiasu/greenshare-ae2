import Link from 'next/link';
export default function NotFound() { return <main id="main" className="setup-page"><div className="setup-card"><span className="eyebrow">NOT AVAILABLE</span><h1>We couldn’t find that.</h1><p>The record may have been removed or may belong to another account.</p><Link className="button button-dark" href="/catalogue">Return to the catalogue</Link></div></main>; }
