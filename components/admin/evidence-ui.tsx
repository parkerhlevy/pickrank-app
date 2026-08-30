import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import type { AdminBoardRevision, AdminEvidenceEntry } from '@/lib/admin-evidence';

export function AdminMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="numeric mt-2 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}
export function EvidenceStatus({ complete, label }: { complete: boolean; label?: string }) {
  return (
    <span
      className={complete
        ? 'inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800'
        : 'inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900'}
    >
      {complete
        ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        : <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
      {label || (complete ? 'Evidence complete' : 'Needs attention')}
    </span>
  );
}

export function EntrySummaryCard({ entry }: { entry: AdminEvidenceEntry }) {
  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/admin/contests/${entry.contestSlug}`} className="font-extrabold text-primary hover:underline">
            {entry.contestTitle}
          </Link>
          <p className="mt-1 text-xs text-slate-500">
            Entry {entry.entryId} · {entry.contestStatus}
          </p>
        </div>
        <EvidenceStatus complete={entry.revisions.length > 0} label={`${entry.revisions.length} revisions`} />
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <DataPoint label="Entered" value={formatAdminTimestamp(entry.createdAt)} />
        <DataPoint label="Last current update" value={formatAdminTimestamp(entry.updatedAt)} />
        <DataPoint
          label="Final result"
          value={entry.score ? `${entry.score.finalRankDisplay} · ${entry.score.totalScore} points` : 'Not scored'}
        />
      </dl>

      <BoardList title="Current board" items={entry.currentBoard} />
      <BoardTimeline revisions={entry.revisions} />
    </article>
  );
}

export function BoardTimeline({ revisions }: { revisions: AdminBoardRevision[] }) {
  if (revisions.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        No immutable board revision is available for this entry.
      </div>
    );
  }

  return (
    <div className="mt-5">
      <h3 className="text-sm font-extrabold text-slate-950">Saved board history</h3>
      <div className="mt-3 space-y-3">
        {revisions.slice().reverse().map((revision, index, reversed) => {
          const previous = reversed[index + 1];
          return (
            <details key={revision.revisionId} className="rounded-lg border bg-slate-50 p-3" open={index === 0}>
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-950">
                    Version {revision.revisionNumber} · {formatEvidenceEvent(revision.eventType)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatAdminTimestamp(revision.savedAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {describeBoardChange(previous, revision)}
                </p>
              </summary>
              <BoardList title="Board at this version" items={revision.items} compact />
              <p className="mt-3 break-all font-mono text-[11px] text-slate-400">SHA-256 {revision.boardHash}</p>
            </details>
          );
        })}
      </div>
    </div>
  );
}

function BoardList({
  title,
  items,
  compact = false,
}: {
  title: string;
  items: Array<{ playerName: string; rankPosition: number }>;
  compact?: boolean;
}) {
  return (
    <div className="mt-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-slate-500">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Empty board</p>
      ) : (
        <ol className={compact ? 'mt-2 grid gap-1 sm:grid-cols-2' : 'mt-2 grid gap-2 sm:grid-cols-2'}>
          {items.map((item) => (
            <li key={`${item.rankPosition}-${item.playerName}`} className="flex items-center gap-2 rounded-md border bg-white px-2.5 py-2 text-sm">
              <span className="numeric w-6 font-black text-slate-500">{item.rankPosition}</span>
              <span className="font-semibold text-slate-900">{item.playerName}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.06em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-900">{value}</dd>
    </div>
  );
}

function describeBoardChange(previous: AdminBoardRevision | undefined, current: AdminBoardRevision) {
  if (!previous) return current.items.length === 0 ? 'Entry created with an empty board.' : 'First preserved board state.';
  if (previous.boardHash === current.boardHash) return 'No rank changes from the previous preserved version.';

  const priorRankByPlayer = new Map(previous.items.map((item) => [item.slatePlayerId, item.rankPosition]));
  const changes = current.items.flatMap((item) => {
    const priorRank = priorRankByPlayer.get(item.slatePlayerId);
    if (priorRank === undefined) return [`${item.playerName} added at #${item.rankPosition}`];
    if (priorRank === item.rankPosition) return [];
    return [`${item.playerName} moved #${priorRank} to #${item.rankPosition}`];
  });

  return changes.slice(0, 3).join('; ') || 'Board membership changed.';
}

function formatEvidenceEvent(eventType: string) {
  return eventType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatAdminTimestamp(value: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Los_Angeles',
  }).format(date)} PT · ${date.toISOString()}`;
}
