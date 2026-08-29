import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminContestNotFound() {
  return (
    <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-black text-slate-950">Contest evidence not found</h1>
      <p className="mt-2 text-sm text-slate-500">The contest is not available in the admin evidence workspace.</p>
      <Button asChild className="mt-5"><Link href="/admin/contests">Return to contest operations</Link></Button>
    </div>
  );
}
