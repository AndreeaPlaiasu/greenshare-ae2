import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Brand } from '@/components/shell';
import { LoginForm } from '@/components/login-form';
import { currentUser } from '@/lib/session';
import { isConfigured } from '@/lib/firebase';
export default async function Login() { if (!isConfigured()) redirect('/setup'); if (await currentUser()) redirect('/catalogue'); return <main id="main" className="login-page"><section className="login-story"><Brand/><div><span className="eyebrow">WELCOME TO YOUR COMMUNITY LIBRARY</span><h1>Good things<br/>are better shared.</h1><p>Borrow a tool. Start a project.<br/>Leave a smaller footprint.</p></div><span>GreenShare · Community, equipped.</span></section><section className="login-panel"><div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Welcome back.</h2><p>Sign in to find equipment and manage your borrowing.</p><LoginForm/><p className="muted">Accounts are provided by your library administrator.</p><Link href="/preview">Explore the sample catalogue</Link></div></section></main>; }
