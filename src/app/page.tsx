import { redirect } from 'next/navigation';
import { isConfigured } from '@/lib/firebase';
export default function Home() { redirect(isConfigured() ? '/catalogue' : '/setup'); }
