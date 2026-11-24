import 'server-only';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { Store, Transaction, RecordData } from './domain';
export function isConfigured() { return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_WEB_API_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY); }
function firebaseApp() {
  if (!isConfigured()) throw new Error('Firebase setup is required.');
  return getApps().find(a => a.name === 'greenshare') ?? initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n') }) }, 'greenshare');
}
export const db = () => getFirestore(firebaseApp());
export const auth = () => getAuth(firebaseApp());
export const store: Store = {
  transaction: work => db().runTransaction(async native => {
    const tx: Transaction = {
      async get<T>(path: string) { const snap = await native.get(db().doc(path)); return snap.exists ? snap.data() as T : undefined; },
      create(path: string, data: RecordData) { native.create(db().doc(path), data); },
      update(path: string, data: RecordData) { native.update(db().doc(path), data); },
    };
    return work(tx);
  }),
};
