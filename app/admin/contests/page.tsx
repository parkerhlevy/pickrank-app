import Link from 'next/link';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { AlertCircle, ArchiveX, CheckCircle2, EyeOff, FileText, ListChecks, ShieldCheck } from 'lucide-react';
import {
  createDraftContestAction,
  fetchContestStatSnapshotAction,
  finalizeContestAction,
  lockFreeTestContestAction,
  publishContestAction,
  removePublicContestAction,
  saveContestSlateAction,
  validateDraftContestAction,
} from '@/app/admin/contests/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { canFinalizeContestStatus } from '@/lib/contest-finalization';
import { listAdminContests, type ContestSummary } from '@/lib/contest-data';
import { contestPlayerPoolSize, contestRankedPlayerCount } from '@/lib/contest-rules';
import { requireContestOperator } from '@/lib/contest-operator-access';
import {
  listAdminTestEntryReadiness,
  type AdminTestEntryContestReadiness,
} from '@/lib/admin-test-entry-readiness';
import { buildContestStatIngestionPreview } from '@/lib/contest-stat-ingestion';

export default async function AdminContestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; message?: string }>;
}) {
  const access = await requireContestOperator('/admin/contests');
  const contests = await listAdminContests();
  const contestsWithStatPreview = await Promise.all(
    contests.map(async (contest) => ({
      contest,
      finalStatPreview: canFinalizeContestStatus(contest.contestStatus)
        ? await buildContestStatIngestionPreview(contest)
        : null,
    })),
  );
  const testEntryReadiness = await listAdminTestEntryReadiness({ contests });
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const status = resolvedSearchParams?.status;
  const message = resolvedSearchParams?.message;
  const activeContestPreviews = contestsWithStatPreview.filter(({ contest }) => !isRemovedContest(contest));
  const removedContestPreviews = contestsWithStatPreview.filter(({ contest }) => isRemovedContest(contest));

  return (
    <div className="space-y-6 pb-28">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Internal admin</p>
        <h1 className="text-3xl font-black leading-tight">Contest setup</h1>
        <p className="text-muted-foreground">
          Create draft contest basics here first, run validation, and publish with a deliberate operator checkpoint.
        </p>
      </section>

      <Card>
        <CardContent className="flex items-start justify-between gap-3 pt-6 text-sm">
          <div>
            <p className="font-semibold text-foreground">Signed in as internal contest operator</p>
            <p className="text-muted-foreground">{access.user?.email || 'Operator account'}</p>
          </div>
          <span className="status-pill">contest_operator</span>
        </CardContent>
      </Card>

      {message ? (
        <Card
          className={
            isAdminSuccessStatus(status)
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-amber-200 bg-amber-50'
          }
        >
          <CardContent className="flex items-start gap-3 pt-6 text-sm">
            {isAdminSuccessStatus(status) ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 text-amber-700" aria-hidden="true" />
            )}
            <p
              className={
                isAdminSuccessStatus(status)
                  ? 'text-emerald-900'
                  : 'text-amber-900'
              }
            >
              {message}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Create draft contest</CardTitle>
                <CardDescription>
                  This first pass captures draft basics only and saves them into the shared contest data layer.
                </CardDescription>
              </div>
              <span className="status-pill shrink-0">
                <ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" />
                Draft only
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <form action={createDraftContestAction} className="space-y-4">
              <Field>
                <Label htmlFor="title">Contest title</Label>
                <TextInput id="title" name="title" placeholder="Week 2 QB Passing Yards" required />
              </Field>

              <Field>
                <Label htmlFor="description">Contest instruction</Label>
                <TextArea
                  id="description"
                  name="description"
                  placeholder="Pick and rank your top 10 quarterbacks by passing yards."
                  required
                  rows={3}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <Label htmlFor="season">Season</Label>
                  <TextInput id="season" name="season" type="number" min="2026" defaultValue="2026" required />
                </Field>
                <Field>
                  <Label htmlFor="week">Week</Label>
                  <TextInput id="week" name="week" type="number" min="1" max="18" defaultValue="2" required />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <Label htmlFor="entryFeeDollars">Entry fee</Label>
                  <TextInput
                    id="entryFeeDollars"
                    name="entryFeeDollars"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0.00"
                    required
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Early Access Beta contests should use 0.00. Paid-entry launch still requires payment and compliance
                    approval.
                  </p>
                </Field>
                <Field>
                  <Label htmlFor="entryOpenTimeLocal">Entry opens</Label>
                  <TextInput id="entryOpenTimeLocal" name="entryOpenTimeLocal" type="datetime-local" required />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-1">
                <Field>
                  <Label htmlFor="lockTimeLocal">Lock time</Label>
                  <TextInput id="lockTimeLocal" name="lockTimeLocal" type="datetime-local" required />
                </Field>
              </div>

              <div className="rounded-lg border bg-slate-50 px-3 py-3 text-sm text-muted-foreground">
                Draft contests save as hidden with `qb_passing_yards`, the current lineup shell, and beta-safe $0 entry
                defaults. Operators still run validation and confirm publish manually.
              </div>

              <Button type="submit" className="w-full">
                Save draft contest
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active contests</CardTitle>
              <CardDescription>
                Create, review, publish, and manage contests that still need operator attention.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeContestPreviews.map(({ contest, finalStatPreview }) => (
                <div key={contest.id} className="rounded-lg border bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{contest.title}</p>
                      <p className="numeric text-xs text-muted-foreground">
                        Week {contest.week} • {contest.entryFee} entry • Opens{' '}
                        {contest.entryOpenTimeIso ? contest.entryOpenTimeIso : 'Not set'} • {contest.lockTime}
                      </p>
                    </div>
                    <span className="status-pill">{contest.status}</span>
                  </div>
                  <div className="mt-3 rounded-lg border bg-slate-50 px-3 py-3 text-xs">
                    <p className="font-semibold text-foreground">
                      Validation: {contest.validation.status === 'not_run' ? 'Not run' : contest.validation.status}
                    </p>
                    <p className="numeric mt-1 text-muted-foreground">
                      Player pool setup: {contest.slatePlayers.length}/{contestPlayerPoolSize} quarterbacks saved
                    </p>
                    {contest.validation.errors.length > 0 ? (
                      <p className="mt-1 text-amber-900">{contest.validation.errors[0]}</p>
                    ) : (
                      <p className="mt-1 text-muted-foreground">
                        {contest.validation.warnings[0] || 'Ready for operator review.'}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{contest.visibilityStatus === 'visible' ? 'Visible in public browse' : 'Hidden draft'}</span>
                    {contest.visibilityStatus === 'visible' ? (
                      <Link href={`/contests/${contest.id}`} className="font-semibold text-primary">
                        View public page
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                        Not in lobby yet
                      </span>
                    )}
                  </div>
                  {contest.contestStatus === 'draft' ? (
                    <form action={saveContestSlateAction} className="mt-3 space-y-3">
                      <input type="hidden" name="contestId" value={contest.id} />
                      <div className="space-y-1.5">
                        <Label htmlFor={`slateRows-${contest.id}`}>Draft slate rows</Label>
                        <TextArea
                          id={`slateRows-${contest.id}`}
                          name="slateRows"
                          rows={10}
                          defaultValue={formatSlateRows(contest)}
                          placeholder={buildSlatePlaceholder()}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        One quarterback per line. Format:{' '}
                        <span className="font-mono">
                          playerId|providerPlayerId|providerGameId|displayName|team|opponent|homeAway|gameStartTime|QB|activeStatus
                        </span>
                      </p>
                      <div className="flex gap-2">
                        <Button type="submit" variant="secondary" className="flex-1">
                          Save draft slate
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-3 rounded-lg border bg-slate-50 px-3 py-3 text-xs text-muted-foreground">
                      Published contests keep their saved slate here as a read-only preview.
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <form action={validateDraftContestAction} className="flex-1">
                      <input type="hidden" name="contestId" value={contest.id} />
                      <Button type="submit" variant="secondary" className="w-full" disabled={contest.contestStatus !== 'draft'}>
                        Run validation
                      </Button>
                    </form>
                    <form action={publishContestAction} className="flex-1">
                      <input type="hidden" name="contestId" value={contest.id} />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={contest.contestStatus !== 'draft' || contest.validation.status !== 'passed'}
                      >
                        Publish with human confirmation
                      </Button>
                    </form>
                  </div>
                  {canShowFreeTestLockControl(contest) ? (
                    <form action={lockFreeTestContestAction} className="mt-3 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <input type="hidden" name="contestId" value={contest.id} />
                      <div>
                        <p className="text-sm font-semibold text-amber-950">Free/test proof lock</p>
                        <p className="mt-1 text-xs leading-5 text-amber-900">
                          Operator-only control for the no-money proof loop. This locks the $0 contest, blocks new
                          entries, and makes saved lineups read-only without running payment, payout, wallet, KYC, or
                          provider automation.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`lockConfirmationText-${contest.id}`}>Type LOCK TEST to confirm</Label>
                        <TextInput
                          id={`lockConfirmationText-${contest.id}`}
                          name="confirmationText"
                          placeholder="LOCK TEST"
                          required
                        />
                      </div>
                      <Button type="submit" variant="secondary" className="w-full">
                        Lock free/test contest
                      </Button>
                    </form>
                  ) : null}
                  {canShowContestRemovalControl(contest) ? (
                    <details
                      className="mt-3 rounded-lg border border-red-200 bg-red-50"
                      data-testid={`remove-contest-${contest.id}`}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-semibold text-red-950">
                        <span className="inline-flex items-center gap-2">
                          <ArchiveX className="h-4 w-4 text-red-800" aria-hidden="true" />
                          Remove contest
                        </span>
                        <span className="text-xs font-medium text-red-800">Review first</span>
                      </summary>
                      <form action={removePublicContestAction} className="space-y-3 border-t border-red-200 p-3">
                        <input type="hidden" name="contestId" value={contest.id} />
                        <input type="hidden" name="confirmationIntent" value="remove_contest" />
                        <div>
                          <p className="text-sm font-semibold text-red-950">Remove {contest.title}?</p>
                          <p className="mt-1 text-xs leading-5 text-red-900">
                            This hides the contest from public pages, changes its status to Canceled, and moves it out of
                            Active contests. The contest record and audit history stay saved. Contests with saved entries
                            cannot be removed.
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            variant="secondary"
                            className="border-red-300 bg-red-700 text-white hover:bg-red-800 sm:w-auto"
                          >
                            Yes, remove contest
                          </Button>
                        </div>
                      </form>
                    </details>
                  ) : null}
                  {canFinalizeContestStatus(contest.contestStatus) ? (
                    <form action={finalizeContestAction} className="mt-3 space-y-3 rounded-lg border bg-slate-50 p-3">
                      <input type="hidden" name="contestId" value={contest.id} />
                      <div className="flex gap-2">
                        <Button formAction={fetchContestStatSnapshotAction} type="submit" variant="ghost" className="w-full">
                          Fetch latest stat snapshot
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`finalStatRows-${contest.id}`}>Confirmed final QB stats</Label>
                        <TextArea
                          id={`finalStatRows-${contest.id}`}
                          name="finalStatRows"
                          rows={10}
                          defaultValue={finalStatPreview?.rows ?? ''}
                          placeholder="playerId|playerName|passingYards|passingTouchdowns"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{finalStatPreview?.sourceLabel ?? 'Manual entry'}.</span>{' '}
                        Internal-only scoring publish. Keep one quarterback per line as{' '}
                        <span className="font-mono">playerId|playerName|passingYards|passingTouchdowns</span>. This can
                        rerun final scoring if an official stat correction changes the slate.
                      </p>
                      <p className="text-xs text-muted-foreground">{finalStatPreview?.helperText}</p>
                      <div className="space-y-1.5">
                        <Label htmlFor={`confirmationText-${contest.id}`}>Type FINAL to confirm</Label>
                        <TextInput
                          id={`confirmationText-${contest.id}`}
                          name="confirmationText"
                          placeholder="FINAL"
                          required
                        />
                      </div>
                      <Button type="submit" variant="secondary" className="w-full">
                        Run final scoring
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))}
              {removedContestPreviews.length > 0 ? (
                <details className="rounded-lg border bg-slate-50" data-testid="removed-contests">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-semibold">
                    <span>Removed contests</span>
                    <span className="numeric text-xs text-muted-foreground">{removedContestPreviews.length}</span>
                  </summary>
                  <div className="space-y-2 border-t px-3 py-3">
                    {removedContestPreviews.map(({ contest }) => (
                      <div key={contest.id} className="flex items-start justify-between gap-3 rounded-lg border bg-white px-3 py-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{contest.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Hidden from public pages. Record preserved.</p>
                        </div>
                        <span className="status-pill shrink-0">Canceled</span>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </CardContent>
          </Card>

          <TestEntryReadinessCard readiness={testEntryReadiness} />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle>Known follow-up gaps</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>The contest operator role is the only enforced internal permission in MVP.</p>
              <p>Agent help can prepare and validate drafts, but publish still requires a human operator action.</p>
              <p>
                Eligibility review for known test accounts lives at{' '}
                <Link href="/admin/eligibility" className="font-semibold text-primary">
                  Internal eligibility review
                </Link>
                .
              </p>
              <p>Public entry and lineup flows now use server-backed entry records while the payment step stays a non-provider placeholder.</p>
              <p>
                The board builder now shows the full {contestPlayerPoolSize}-player pool and saves one ranked{' '}
                {contestRankedPlayerCount}-player board for each entry.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function canShowFreeTestLockControl(contest: ContestSummary) {
  return contest.visibilityStatus === 'visible' && contest.contestStatus === 'open' && contest.entryFeeCents === 0;
}

function isRemovedContest(contest: ContestSummary) {
  return contest.contestStatus === 'canceled' && contest.visibilityStatus === 'hidden';
}

function canShowContestRemovalControl(contest: ContestSummary) {
  return (
    contest.visibilityStatus === 'visible' &&
    (contest.contestStatus === 'scheduled' || contest.contestStatus === 'open')
  );
}

function isAdminSuccessStatus(status: string | undefined) {
  return (
    status === 'created' ||
    status === 'saved' ||
    status === 'validated' ||
    status === 'published' ||
    status === 'locked' ||
    status === 'removed' ||
    status === 'fetched' ||
    status === 'finalized'
  );
}

function TestEntryReadinessCard({ readiness }: { readiness: AdminTestEntryContestReadiness[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle>Test entry readiness</CardTitle>
            </div>
            <CardDescription>
              Read-only operator visibility for free/test entries, saved lineups, and obvious runbook blockers.
            </CardDescription>
          </div>
          <span className="status-pill shrink-0">Read only</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {readiness.length === 0 ? (
          <div className="empty-state-card text-sm text-muted-foreground">
            No scheduled, open, locked, live, finalizing, or entry-backed contests need test-entry visibility right now.
          </div>
        ) : null}

        {readiness.map((contest) => (
          <div key={contest.contestId} className="rounded-lg border bg-white p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">{contest.title}</p>
                <p className="numeric mt-1 text-xs text-muted-foreground">
                  {contest.contestId} • {contest.lifecycleStatus} • {contest.visibilityStatus} • {contest.entryFee}{' '}
                  entry • {contest.lockTime}
                </p>
              </div>
              <span className={contest.status === 'ready' ? 'status-pill bg-emerald-50 text-emerald-900' : 'status-pill'}>
                {contest.status === 'ready' ? 'Ready' : 'Needs review'}
              </span>
            </div>

            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
              <ReadinessMetric label="Total entries" value={contest.totalEntries} />
              <ReadinessMetric label="Paid entries" value={contest.paidEntries} />
              <ReadinessMetric label="Free/test entries" value={contest.freeTestEntries} />
              <ReadinessMetric label="Saved records" value={contest.savedEntryRecords} />
            </div>

            <IssueList issues={contest.issues} emptyLabel="Contest counts look consistent." />

            <div className="mt-3 rounded-md border bg-slate-50">
              <div className="border-b px-3 py-2 text-xs font-semibold text-foreground">Entrants</div>
              {contest.entrants.length === 0 ? (
                <div className="px-3 py-3 text-xs text-muted-foreground">No saved entrants found for this contest.</div>
              ) : (
                <div className="divide-y">
                  {contest.entrants.map((entrant) => (
                    <div key={entrant.entryId} className="px-3 py-3 text-xs">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{entrant.userLabel}</p>
                          <p className="mt-1 text-muted-foreground">
                            {entrant.email} • {entrant.displayName} • {entrant.username}
                          </p>
                          <p className="numeric mt-1 text-muted-foreground">
                            Entry {entrant.entryStatus} • Created {formatAdminTimestamp(entrant.createdAt)} • Updated{' '}
                            {formatAdminTimestamp(entrant.updatedAt)}
                          </p>
                        </div>
                        <span className={getLineupStatusClassName(entrant.lineupStatus)}>
                          {entrant.lineupStatusLabel}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-2 text-muted-foreground sm:grid-cols-3">
                        <ReadinessFact label="Lineup source" value={entrant.lineupSourceLabel} />
                        <ReadinessFact label="Saved players" value={`${entrant.savedPlayerCount}/10`} />
                        <ReadinessFact
                          label="Last saved"
                          value={entrant.lastSavedAt ? formatAdminTimestamp(entrant.lastSavedAt) : 'Not saved yet'}
                        />
                      </div>
                      <IssueList issues={entrant.issues} emptyLabel="Entrant is test-ready." />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReadinessMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-slate-50 px-3 py-2">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="numeric">{value}</p>
    </div>
  );
}

function ReadinessFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-white px-3 py-2">
      <p className="font-semibold text-foreground">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function IssueList({ issues, emptyLabel }: { issues: string[]; emptyLabel: string }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs">
      {issues.length === 0 ? (
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-900">
          {emptyLabel}
        </span>
      ) : (
        issues.map((issue) => (
          <span key={issue} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-950">
            {issue}
          </span>
        ))
      )}
    </div>
  );
}

function getLineupStatusClassName(status: AdminTestEntryContestReadiness['entrants'][number]['lineupStatus']) {
  if (status === 'saved') {
    return 'status-pill bg-emerald-50 text-emerald-900';
  }

  if (status === 'missing_incomplete') {
    return 'status-pill bg-amber-50 text-amber-950';
  }

  return 'status-pill status-pill-muted';
}

function formatAdminTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function Field({ children }: { children: ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

function Label({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold">
      {children}
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="numeric w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-sm"
    />
  );
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="numeric w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-sm"
    />
  );
}

function formatSlateRows(contest: ContestSummary) {
  if (contest.slatePlayers.length === 0) {
    return buildSlatePlaceholder();
  }

  return contest.slatePlayers
    .map((player) =>
      [
        player.playerId,
        player.providerPlayerId,
        player.providerGameId,
        player.displayName,
        player.teamAbbreviation,
        player.opponentAbbreviation,
        player.homeAway,
        player.gameStartTime,
        player.position,
        player.activeStatus ?? '',
      ].join('|'),
    )
    .join('\n');
}

function buildSlatePlaceholder() {
  return [
    'qb-josh-allen|provider-qb-josh-allen|buf-bal-2026-wk2|Josh Allen|BUF|BAL|home|2026-09-10T00:20:00.000Z|QB|active',
    'qb-joe-burrow|provider-qb-joe-burrow|cin-cle-2026-wk2|Joe Burrow|CIN|CLE|away|2026-09-10T20:25:00.000Z|QB|active',
  ].join('\n');
}
