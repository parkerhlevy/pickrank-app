import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminDataFreshness } from '@/components/admin/admin-data-freshness';
import { BoardTimeline, EvidenceStatus, formatAdminTimestamp } from '@/components/admin/evidence-ui';
import { BackLinkButton } from '@/components/ui/back-link-button';
import { getAdminContestEvidence } from '@/lib/admin-evidence';
import { requireContestOperator } from '@/lib/contest-operator-access';

export default async function AdminContestEvidencePage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const { contestId } = await params;
  await requireContestOperator(`/admin/contests/${contestId}`);
  const contest = await getAdminContestEvidence(contestId);

  if (!contest) notFound();
  const loadedAt = new Date().toISOString();

  return (
    <div className="space-y-6 pb-24">
      <BackLinkButton href="/admin/contests">Contest operations</BackLinkButton>

      <section className="screen-header space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow">Contest evidence</p>
          <EvidenceStatus complete={contest.evidenceStatus === 'complete'} />
        </div>
        <h1 className="text-3xl font-black leading-tight">{contest.title}</h1>
        <p className="text-muted-foreground">
          {contest.status} · {contest.visibilityStatus} · Locks {formatAdminTimestamp(contest.lockTime)}
        </p>
        <AdminDataFreshness loadedAt={loadedAt} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ContestMetric label="Entries" value={contest.entryCount} />
        <ContestMetric label="Board revisions" value={contest.revisionCount} />
        <ContestMetric label="Scored entries" value={contest.scoredEntryCount} />
        <ContestMetric label="Missing revisions" value={contest.missingRevisionCount} attention={contest.missingRevisionCount > 0} />
      </section>

      <section>
        <h2 className="text-xl font-black text-slate-950">Entrants and saved boards</h2>
        <p className="mt-1 text-sm text-slate-500">Open a user record or inspect every preserved version from this contest.</p>
        {contest.entries.length === 0 ? (
          <p className="mt-4 rounded-xl border bg-white p-5 text-sm text-slate-500">No saved entries are available.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {contest.entries.map((entry) => (
              <article key={entry.entryId} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/admin/users/${entry.userId}`} className="font-extrabold text-primary hover:underline">
                      {entry.displayName}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">@{entry.username} · {entry.email}</p>
                    <p className="mt-1 text-xs text-slate-500">Entry {entry.entryId}</p>
                  </div>
                  <EvidenceStatus complete={entry.revisions.length > 0} label={`${entry.revisions.length} revisions`} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <ContestDatum label="Entered" value={formatAdminTimestamp(entry.createdAt)} />
                  <ContestDatum label="Current board" value={`${entry.currentBoard.length}/10 players`} />
                  <ContestDatum
                    label="Final result"
                    value={entry.score ? `${entry.score.finalRankDisplay} · ${entry.score.totalScore} points` : 'Not scored'}
                  />
                </dl>
                <BoardTimeline revisions={entry.revisions} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
function ContestMetric({
  attention = false,
  label,
  value,
}: {
  attention?: boolean;
  label: string;
  value: number;
}) {
  return (
    <div className={attention ? 'rounded-xl border border-amber-200 bg-amber-50 p-4' : 'rounded-xl border bg-white p-4 shadow-sm'}>
      <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-slate-500">{label}</p>
      <p className="numeric mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function ContestDatum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.06em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-900">{value}</dd>
    </div>
  );
}
