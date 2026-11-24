import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import type { Actor } from '@/lib/domain';
export function Brand() {
  return (
    <Link href="/catalogue" className="brand">
      <span className="brand-icon" aria-hidden="true">
        <svg viewBox="0 0 28 28">
          <path d="M21 5C8 4 4 10 7 18c9 4 16-1 14-13Z" />
          <path d="m6 23 12-12" />
        </svg>
      </span>
      GreenShare<span className="brand-dot">.</span>
    </Link>
  );
}
export function Shell({
  user,
  children,
  active,
  preview = false,
}: {
  user?: Actor;
  children: React.ReactNode;
  active?: string;
  preview?: boolean;
}) {
  const links = [
    ['/catalogue', 'Find equipment', '01'],
    ['/locations', 'Library map', '02'],
    [
      '/reservations',
      user?.role === 'admin' ? 'All reservations' : 'My reservations',
      '03',
    ],
    ...(user?.role === 'admin' ? [['/admin', 'Manage inventory', '04']] : []),
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <p className="brand-sub">THE COMMUNITY TOOL LIBRARY</p>
        <div className="nav-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {links.map(([href, title, index]) => (
            <Link
              aria-current={active === href ? 'page' : undefined}
              className={active === href ? 'nav-link active' : 'nav-link'}
              key={href}
              href={
                preview
                  ? href === '/catalogue'
                    ? '/preview'
                    : href === '/locations'
                      ? '/preview/locations'
                      : '/setup'
                  : href
              }
            >
              <span className="nav-index" aria-hidden="true">
                {index}
              </span>
              {title}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="leaf-small">↟</span>
          <strong>
            More sharing.
            <br />
            Less consuming.
          </strong>
          <p>The right tool, without the footprint of owning it.</p>
        </div>
        <div className="account">
          <div className="avatar">
            {user?.username.slice(0, 2).toUpperCase() || 'GS'}
          </div>
          <div>
            <strong>{user?.username || 'Explore GreenShare'}</strong>
            <span>
              {user?.role === 'admin'
                ? 'Library administrator'
                : preview
                  ? 'Sample inventory preview'
                  : 'Community member'}
            </span>
          </div>
        </div>
        {user && (
          <form action={logoutAction}>
            <button className="signout" type="submit">
              Sign out
            </button>
          </form>
        )}
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>Borrow better. Build together.</span>
          <span className="topbar-tag">COMMUNITY, EQUIPPED.</span>
        </header>
        {preview && (
          <div className="preview-banner">
            Sample inventory preview.{' '}
            <Link href="/setup">Connect Firebase</Link> to enable accounts and
            reservations.
          </div>
        )}
        <main id="main">{children}</main>
        <footer className="site-footer">
          <span>GreenShare Community Tool Library</span>
          <span>Small actions. Shared impact.</span>
        </footer>
      </div>
    </div>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="notice" role="status">
      {children}
    </div>
  );
}
