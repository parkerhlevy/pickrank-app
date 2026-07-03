import Link from 'next/link';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { AlertCircle, CheckCircle2, EyeOff, FileText, ShieldCheck } from 'lucide-react';
import {
  createDraftContestAction,
  finalizeContestAction,
  publishContestAction,
  saveContestSlateAction,
  validateDraftContestAction,
} from '@/app/admin/contests/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { canFinalizeContestStatus } from '@/lib/contest-finalization';
import { listAdminContests, type ContestSummary } from '@/lib/contest-data';
import { requireContestOperator } from '@/lib/contest-operator-access';
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
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const status = resolvedSearchParams?.status;
  const message = resolvedSearchParams?.message;

  return (
    <div className="space-y-6 pb-28">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Internal Admin</p>
        <h1 className="text-3xl font-black leading-tight">Contest Setup</h1>
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
            status === 'created' || status === 'saved' || status === 'validated' || status === 'published' || status === 'finalized'
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-amber-200 bg-amber-50'
          }
        >
          <CardContent className="flex items-start gap-3 pt-6 text-sm">
            {status === 'created' || status === 'saved' || status === 'validated' || status === 'published' || status === 'finalized' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 text-amber-700" aria-hidden="true" />
            )}
            <p
              className={
                status === 'created' || status === 'saved' || status === 'validated' || status === 'published' || status === 'finalized'
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
                <CardTitle>Create Draft Contest</CardTitle>
                <CardDescription>
                  This first pass captures draft basics only and saves them into the shared contest data layer.
                </CardDescription>
              </div>
              <span className="status-pill shrink-0">
                <ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" />
                Draft Only
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
                    defaultValue="5.00"
                    required
                  />
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
                Draft contests save as hidden with `qb_passing_yards`, the current lineup shell, and the current
                economics defaults. Operators still run validation and confirm publish manually.
              </div>

              <Button type="submit" className="w-full">
                Save Draft Contest
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Contest Records</CardTitle>
              <CardDescription>
                Public pages now read from these records instead of the old demo constants.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {contestsWithStatPreview.map(({ contest, finalStatPreview }) => (
                <div key={contest.id} className="rounded-lg border bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{contest.title}</p>
                      <p className="text-xs text-muted-foreground">
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
                    <p className="mt-1 text-muted-foreground">
                      Slate setup: {contest.slatePlayers.length}/15 quarterbacks saved
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
                          Save Draft Slate
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
                        Run Validation
                      </Button>
                    </form>
                    <form action={publishContestAction} className="flex-1">
                      <input type="hidden" name="contestId" value={contest.id} />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={contest.contestStatus !== 'draft' || contest.validation.status !== 'passed'}
                      >
                        Publish with Human Confirmation
                      </Button>
                    </form>
                  </div>
                  {canFinalizeContestStatus(contest.contestStatus) ? (
                    <form action={finalizeContestAction} className="mt-3 space-y-3 rounded-lg border bg-slate-50 p-3">
                      <input type="hidden" name="contestId" value={contest.id} />
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
                        Run Final Scoring
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle>Known Follow-Up Gaps</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>The contest operator role is the only enforced internal permission in MVP.</p>
              <p>Agent help can prepare and validate drafts, but publish still requires a human operator action.</p>
              <p>Public entry and lineup flows now use server-backed entry records while the payment step stays a non-provider placeholder.</p>
              <p>The lineup builder now shows the full 15-player slate and saves one ranked 10-player lineup for each entry.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
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
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
    />
  );
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
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
