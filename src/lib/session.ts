import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth, db, isConfigured } from './firebase';
import { DomainError, type Actor } from './domain';
export async function currentUser(): Promise<Actor | null> {
  if (!isConfigured()) return null;
  const token = (await cookies()).get('__session')?.value;
  if (!token) return null;
  try {
    const claims = await auth().verifySessionCookie(token, true);
    const account = (await db().doc(`users/${claims.uid}`).get()).data();
    if (!account || !['worker', 'admin'].includes(account.role) || account.disabled) return null;
    return { uid: claims.uid, username: account.username, role: account.role };
  } catch { return null; }
}
export async function requireUser(role?: 'admin'): Promise<Actor> {
  if (!isConfigured()) redirect('/setup');
  const user = await currentUser();
  if (!user) redirect('/login');
  if (role && user.role !== role) redirect('/catalogue');
  return user;
}
export async function actionUser(adminOnly = false): Promise<Actor> {
  await checkOrigin();
  const user = await currentUser();
  if (!user) throw new DomainError('Your session expired. Sign in again.');
  if (adminOnly && user.role !== 'admin') throw new DomainError('Administrator access is required.');
  return user;
}
export async function checkOrigin() {
  const origin = (await headers()).get('origin');
  if (!origin || origin !== new URL(process.env.APP_ORIGIN || 'http://127.0.0.1:3000').origin) throw new DomainError('The request origin is not allowed. Reload the application.');
}
