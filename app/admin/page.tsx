import Link from 'next/link';
import { AlertTriangle, ArrowRight, Database, FileCheck2, Trophy, Users } from 'lucide-react';
import { AdminDataFreshness } from '@/components/admin/admin-data-freshness';
import { AdminMetric, EvidenceStatus, formatAdminTimestamp } from '@/components/admin/evidence-ui';
import { Button } from '@/components/ui/button';
import { getAdminEvidenceOverview } from '@/lib/admin-evidence';
import { requireContestOperator } from '@/lib/contest-operator-access';

export default async function AdminPage() {
  const access = await requireContestOperator('/admin');
  const overview = await getAdminEvidenceOverview();
  const loadedAt = new Date().toISOString();

  return (
    <div className="space-y-6 pb-24">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Internal admin</p>
        <h1 className="text-3xl font-black leading-tight">Operator overview</h1>
        <p className="text-muted-foreground">
          Review PickRank operations and confirm that every contest entry has an analysis-ready evidence trail.
        </p>
        <p className="text-xs text-slate-500">Signed in as {access.user?.email || 'contest operator'}</p>
        <AdminDataFreshness loadedAt={loadedAt} />
      </section>

      {overview.missingRevisionCount > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-extrabold">Evidence attention required</p>
            <p className="mt-1">{overview.missingRevisionCount} entries do not have an immutable board revision.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <div>
            <p className="font-extrabold">Board evidence coverage is complete</p>
            <p className="mt-1">Every current entry has at least one preserved board revision.</p>
          </div>
          <EvidenceStatus complete />
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Admin evidence summary">
        <AdminMetric label="Users" value={overview.userCount} detail="Profiles available for operator investigation" />
        <AdminMetric label="Contests" value={overview.contestCount} detail="Draft through finalized contest records" />
        <AdminMetric label="Entries" value={overview.entryCount} detail={`${overview.scoredEntryCount} have final scoring`} />
        <AdminMetric label="Board revisions" value={overview.revisionCount} detail="Immutable entry, save, and lock states" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <WorkspaceCard
          href="/admin/contests"
          icon={Trophy}
          title="Contest operations"
          description="Create and manage contests, then investigate entrants and evidence by contest."
        />
        <WorkspaceCard
          href="/admin/users"
          icon={Users}
          title="User data"
          description="Search profiles, review every entered contest, and inspect saved board history."
        />
        <WorkspaceCard
          href="/admin/evidence"
          icon={FileCheck2}
          title="Evidence health"
          description="Review capture completeness, audit activity, and analysis-ready exports."
        />
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-slate-950">Recent admin evidence activity</p>
            <p className="mt-1 text-xs text-slate-500">Sensitive views and exports are append-only audit events.</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
            <Database className="h-4 w-4" aria-hidden="true" />
            {overview.auditEventCount} total events
          </span>
        </div>
        {overview.latestAuditEvents.length === 0 ? (
          <p className="mt-4 rounded-lg border bg-slate-50 p-3 text-sm text-slate-500">No admin audit events recorded yet.</p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {overview.latestAuditEvents.map((event) => (
              <li key={event.event_id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm">
                <span className="font-semibold text-slate-900">{event.event_type.replaceAll('_', ' ')}</span>
                <span className="text-xs text-slate-500">{formatAdminTimestamp(event.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function WorkspaceCard({
  description,
  href,
  icon: Icon,
  title,
}: {
  description: string;
  href: string;
  icon: typeof Trophy;
  title: string;
}) {
  return (
    <article className="rounded-xl border bg-white p-5 shadow-sm">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-2 min-h-16 text-sm leading-6 text-slate-600">{description}</p>
      <Button asChild variant="secondary" className="mt-4 w-full justify-between">
        <Link href={href}>
          Open workspace
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </article>
  );
}
