import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { sampleEquipment, sampleLibraries } from '../src/lib/sample.ts';
const required = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'SEED_WORKER_PASSWORD',
  'SEED_ADMIN_PASSWORD',
];
for (const key of required)
  if (!process.env[key])
    throw new Error(`Missing ${key}. Read README.md before seeding.`);
if (process.env.SEED_ADMIN_PASSWORD === process.env.SEED_WORKER_PASSWORD)
  throw new Error('Use different passwords for the two test roles.');
for (const name of ['SEED_ADMIN_PASSWORD', 'SEED_WORKER_PASSWORD'])
  if (process.env[name]!.length < 10)
    throw new Error(`${name} must contain at least 10 characters.`);
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
});
const auth = getAuth(app);
const db = getFirestore(app);
for (const role of ['worker', 'admin'] as const) {
  const email = `${role}@greenshare-assessment.invalid`;
  const password =
    process.env[
      role === 'worker' ? 'SEED_WORKER_PASSWORD' : 'SEED_ADMIN_PASSWORD'
    ]!;
  let account;
  try {
    account = await auth.getUserByEmail(email);
    await auth.updateUser(account.uid, { password, disabled: false });
  } catch (e) {
    if ((e as { code?: string }).code !== 'auth/user-not-found') throw e;
    account = await auth.createUser({ email, password, displayName: role });
  }
  await db
    .doc(`users/${account.uid}`)
    .set({ uid: account.uid, username: role, role, disabled: false });
  await db
    .doc(`usernameDirectory/${role}`)
    .set({ uid: account.uid, authEmail: email });
  console.log(
    `Prepared assessment account: ${role}. Password comes from your local environment.`,
  );
}
for (const library of sampleLibraries) {
  const ref = db.doc(`libraries/${library.id}`);
  if (!(await ref.get()).exists) await ref.create(library);
}
for (const item of sampleEquipment) {
  const { library: _library, stock, ...equipment } = item;
  // Existing inventory and reservations are preserved when seeding again.
  const ref = db.doc(`equipment/${equipment.id}`);
  if (!(await ref.get()).exists) await ref.create(equipment);
  for (const row of stock) {
    const stockRef = db.doc(`stockDays/${row.equipmentId}_${row.date}`);
    if (!(await stockRef.get()).exists) await stockRef.create(row);
  }
}
console.log(
  'Seed completed. Existing stock was preserved. Restart Next.js after changing .env.local.',
);
