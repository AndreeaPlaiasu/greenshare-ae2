'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth, db, isConfigured } from '@/lib/firebase';
import { checkOrigin } from '@/lib/session';
import { DomainError } from '@/lib/domain';
export type ActionState = { ok: boolean; message: string; id?: string; pending?: boolean };
export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    await checkOrigin();
    if (!isConfigured()) return { ok: false, message: 'Connect Firebase before signing in.' };
    const username = String(form.get('username') || '').trim().toLowerCase();
    const password = String(form.get('password') || '');
    if (!/^[a-z0-9_-]{3,40}$/.test(username) || password.length < 6 || password.length > 256) return { ok: false, message: 'Username or password is incorrect.' };
    const directory = (await db().doc(`usernameDirectory/${username}`).get()).data();
    // Unknown names still make an Auth request, reducing easy username enumeration.
    const email = directory?.authEmail || 'unknown-account@greenshare.invalid';
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(process.env.FIREBASE_WEB_API_KEY!)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }), cache: 'no-store', signal: AbortSignal.timeout(12000) });
    const result = await response.json();
    if (!response.ok || !directory || result.localId !== directory.uid) return { ok: false, message: 'Username or password is incorrect.' };
    const account = (await db().doc(`users/${result.localId}`).get()).data();
    if (!account || account.disabled || !['worker', 'admin'].includes(account.role)) return { ok: false, message: 'This account is not enabled for GreenShare.' };
    const expiresIn = 1000 * 60 * 60 * 8;
    const session = await auth().createSessionCookie(result.idToken, { expiresIn });
    (await cookies()).set('__session', session, { httpOnly: true, secure: process.env.APP_ORIGIN?.startsWith('https://') ?? false, sameSite: 'lax', path: '/', maxAge: expiresIn / 1000 });
  } catch (e) { return { ok: false, message: e instanceof DomainError ? e.message : 'Sign-in is unavailable. Check the Firebase configuration and try again.' }; }
  redirect('/catalogue');
}
export async function logoutAction() {
  await checkOrigin();
  const cookie = (await cookies()).get('__session')?.value;
  if (cookie && isConfigured()) { try { const user = await auth().verifySessionCookie(cookie); await auth().revokeRefreshTokens(user.uid); } catch { /* Always clear the local cookie. */ } }
  (await cookies()).delete('__session');
  redirect('/login');
}
