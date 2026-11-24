'use client';
import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';
export function LoginForm() { const [state, action, pending] = useActionState(loginAction, { ok: false, message: '' }); return <form action={action} className="stack-form"><label>Username<input name="username" autoComplete="username" minLength={3} maxLength={40} required placeholder="Your GreenShare username"/></label><label>Password<input name="password" type="password" autoComplete="current-password" required minLength={6} maxLength={256} placeholder="Your password"/></label>{state.message && <div className="form-message error" role="alert">{state.message}</div>}<button className="button button-dark" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button></form>; }
