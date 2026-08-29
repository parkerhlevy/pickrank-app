import Link from 'next/link';
import { Download, FileCheck2, ShieldAlert } from 'lucide-react';
import { AdminMetric, EvidenceStatus, formatAdminTimestamp } from '@/components/admin/evidence-ui';
import { Button } from '@/components/ui/button';
import { getAdminEvidenceOverview } from '@/lib/admin-evidence';
import { requireContestOperator } from '@/lib/contest-operator-access';

export default async function AdminEvidencePage() {
  await requireContestOperator('/admin/evidence');
  const overview = await getAdminEvidenceOverview();
  const complete = overview.missingRevisionCount === 0;

  return (
    <div className="space-y-6 pb-24">
      <section className="screen-header space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow">Internal admin</p>
          <EvidenceStatus complete={complete} />
        </div>
        <h1 className="text-3xl font-black leading-tight">Evidence health</h1>
        <p className="text-muted-foreground">
          Confirm data completeness and create reproducible packages for independent analysis.
        </p>
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-extrabold">Data quality only</p>
          <p className="mt-1">
            This workspace reports capture coverage. It does not claim that PickRank is legally a game of skill.
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric label="Entries" value={overview.entryCount} detail="Current contest-entry population" />
        <AdminMetric label="Revisions" value={overview.revisionCount} detail="Append-only board states" />
        <AdminMetric label="Missing evidence" value={overview.missingRevisionCount} detail="Entries without any board revision" />
        <AdminMetric label="Final scores" value={overview.scoredEntryCount} detail="Entries with persisted scoring results" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Pseudonymous evidence package</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Includes contests, entries, stable analysis subjects, board revisions, ordered revision items, scores, a data dictionary, and a manifest. Direct user identity is omitted.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link href="/admin/evidence/export">
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Download pseudonymous package
            </Link>
          </Button>
        </article>

        <article className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-800" aria-hidden="true" />
            <h2 className="text-lg font-black text-amber-950">Identified exports</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Identified packages are available only with a written reason. Every export is recorded in the append-only admin audit log.
          </p>
          <form action="/admin/evidence/export" method="get" className="mt-4 space-y-3">
            <input type="hidden" name="identified" value="1" />
            <label htmlFor="identified-export-reason" className="text-xs font-extrabold uppercase tracking-[0.06em] text-amber-950">
              Export reason
            </label>
            <textarea
              id="identified-export-reason"
              name="reason"
              required
              minLength={12}
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-amber-300 bg-white p-3 text-sm outline-none ring-amber-400/20 focus:ring-4"
              placeholder="Describe why direct user identity is required."
            />
            <Button type="submit" variant="secondary" className="w-full border border-amber-400 bg-white text-amber-950 hover:bg-amber-100">
              Download identified package
            </Button>
          </form>
        </article>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Recent audit events</h2>
        {overview.latestAuditEvents.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No evidence views or exports have been recorded yet.</p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {overview.latestAuditEvents.map((event) => (
              <li key={event.event_id} className="grid gap-1 px-3 py-3 text-sm sm:grid-cols-[1fr_auto]">
                <span className="font-semibold text-slate-900">{event.event_type.replaceAll('_', ' ')}</span>
                <span className="text-xs text-slate-500">{formatAdminTimestamp(event.created_at)}</span>
                <span className="text-xs text-slate-500 sm:col-span-2">
                  {event.target_type}{event.target_id ? ` · ${event.target_id}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
