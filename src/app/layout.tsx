import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'GreenShare | Community Tool Library',
  description: 'Borrow useful things. Build a greener community.',
};
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
