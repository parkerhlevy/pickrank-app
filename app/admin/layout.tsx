import type { ReactNode } from 'react';
import { LockKeyhole } from 'lucide-react';
import { AdminNavigation } from '@/components/admin/admin-navigation';

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div
      data-admin-shell
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-8"
    >
      <aside className="section-card min-w-0 overflow-hidden lg:sticky lg:top-6">
        <div className="section-card-header space-y-3 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-300">PickRank</p>
              <p className="mt-1 text-lg font-black text-white">Admin Workspace</p>
            </div>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white">
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="text-xs leading-5 text-slate-300">
            Protected tools for contest operators. Public product navigation stays separate.
          </p>
        </div>

        <div className="space-y-4 p-3">
          <AdminNavigation />
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-950">
            <p className="font-extrabold">Internal operator boundary</p>
            <p className="mt-1 text-amber-900">
              Eligibility actions remain limited to known test accounts and controlled no-money flows.
            </p>
          </div>
        </div>
      </aside>

      <div className="admin-content">{children}</div>
    </div>
  );
}
