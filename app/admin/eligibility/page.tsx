import Link from 'next/link';
import type { ReactNode, TextareaHTMLAttributes } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';
import { reviewEligibilityAction } from '@/app/admin/eligibility/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireContestOperator } from '@/lib/contest-operator-access';
import { listEligibilityReviewCandidates, type EligibilityReviewCandidate } from '@/lib/eligibility-review';

export default async function AdminEligibilityPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; message?: string }>;
}) {
  const access = await requireContestOperator('/admin/eligibility');
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const status = resolvedSearchParams?.status;
  const message = resolvedSearchParams?.message;
  let candidates: EligibilityReviewCandidate[] = [];
  let loadError = '';

  try {
    candidates = await listEligibilityReviewCandidates();
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Unable to load eligibility review candidates.';
  }

  return (
    <div className="space-y-6 pb-28">
      <Button asChild variant="ghost" size="sm" className="-ml-3 justify-start">
        <Link href="/admin/contests">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Contest Admin
        </Link>
      </Button>

      <section className="screen-header space-y-2">
        <p className="eyebrow">Internal Admin</p>
        <h1 className="text-3xl font-black leading-tight">Eligibility Review</h1>
        <p className="text-muted-foreground">
          Review captured account fields for known test accounts only. This does not approve public real-money entry.
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
        <StatusNotice status={status === 'reviewed' ? 'success' : 'warning'}>{message}</StatusNotice>
      ) : null}

      {loadError ? <StatusNotice status="warning">{loadError}</StatusNotice> : null}

      <Card className="section-card">
        <CardHeader className="section-card-header">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Known Test Accounts</CardTitle>
              <CardDescription className="text-slate-300">
                Internal-test eligibility is stored separately from public paid-entry eligibility and is logged as an
                audit event. Age gate is computed from DOB; only the age-only restriction reason can resolve through
                DOB aging.
              </CardDescription>
            </div>
            <span className="status-pill shrink-0 bg-white/10 text-white border-white/15">
              <ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" />
              Internal Only
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {candidates.length === 0 && !loadError ? (
            <div className="empty-state-card text-sm text-muted-foreground">
              No known test accounts are available for review. Add fixture emails under the `.test` domain or configure
              `PICKRANK_INTERNAL_TEST_ACCOUNT_EMAILS` server-side.
            </div>
          ) : null}

          {candidates.map((candidate) => (
            <div key={candidate.userId} className="rounded-lg border bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                    <p className="font-semibold text-foreground">{candidate.email}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {candidate.displayName || candidate.username || 'Profile name missing'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="status-pill">{formatStatus(candidate.eligibility.eligibilityStatus)}</span>
                  <span className="status-pill status-pill-muted">{candidate.eligibility.jurisdiction || 'No jurisdiction'}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                <ReviewFact label="Account status" value={formatStatus(candidate.eligibility.accountStatus)} />
                <ReviewFact label="Eligibility" value={formatStatus(candidate.eligibility.eligibilityStatus)} />
                <ReviewFact label="DOB / 18+ check" value={candidate.eligibility.ageConfirmed ? 'Confirmed' : 'Missing'} />
                <ReviewFact label="Age gate" value={formatStatus(candidate.eligibility.ageGateStatus)} />
                <ReviewFact label="Terms" value={candidate.eligibility.termsAcceptedAt ? 'Captured' : 'Missing'} />
                <ReviewFact label="Privacy" value={candidate.eligibility.privacyPolicyAcceptedAt ? 'Captured' : 'Missing'} />
                <ReviewFact label="KYC" value={formatStatus(candidate.eligibility.kycStatus)} />
                <ReviewFact
                  label="Self-exclusion"
                  value={formatStatus(candidate.eligibility.selfExclusionStatus)}
                />
                <ReviewFact label="Entry restriction" value={formatStatus(candidate.entryRestrictionStatus)} />
                <ReviewFact
                  label="Restriction type"
                  value={
                    candidate.eligibility.restrictionReason
                      ? candidate.eligibility.isAgeOnlyRestriction
                        ? 'Age-only'
                        : 'Admin / compliance'
                      : 'None'
                  }
                />
                <ReviewFact
                  label="Restriction reason"
                  value={candidate.eligibility.restrictionReason || 'None'}
                />
              </div>

              {candidate.eligibility.restrictionReason ? (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {candidate.eligibility.restrictionReason}
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <form action={reviewEligibilityAction} className="space-y-3 rounded-lg border bg-slate-50 p-3">
                  <input type="hidden" name="targetUserId" value={candidate.userId} />
                  <input type="hidden" name="decision" value="eligible_for_internal_testing" />
                  <Field>
                    <Label htmlFor={`eligibleReason-${candidate.userId}`}>Internal-test eligibility reason</Label>
                    <TextArea
                      id={`eligibleReason-${candidate.userId}`}
                      name="reason"
                      required
                      rows={3}
                      placeholder="Known QA account for controlled no-money preseason testing."
                    />
                  </Field>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      !candidate.eligibility.isEligibilityComplete ||
                      candidate.eligibility.accountStatus !== 'active' ||
                      ['requested', 'active'].includes(candidate.eligibility.selfExclusionStatus) ||
                      candidate.entryRestrictionStatus !== 'none' ||
                      candidate.eligibility.eligibilityStatus === 'blocked'
                    }
                  >
                    Mark Eligible for Internal Testing
                  </Button>
                </form>

                <form action={reviewEligibilityAction} className="space-y-3 rounded-lg border bg-slate-50 p-3">
                  <input type="hidden" name="targetUserId" value={candidate.userId} />
                  <input type="hidden" name="decision" value="blocked" />
                  <Field>
                    <Label htmlFor={`blockedReason-${candidate.userId}`}>Block reason</Label>
                    <TextArea
                      id={`blockedReason-${candidate.userId}`}
                      name="reason"
                      required
                      rows={3}
                      placeholder="Internal testing hold until account details are corrected."
                    />
                  </Field>
                  <Button type="submit" variant="secondary" className="w-full">
                    Block Eligibility
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusNotice({ children, status }: { children: ReactNode; status: 'success' | 'warning' }) {
  const isSuccess = status === 'success';

  return (
    <Card className={isSuccess ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}>
      <CardContent className="flex items-start gap-3 pt-6 text-sm">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" aria-hidden="true" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 text-amber-700" aria-hidden="true" />
        )}
        <p className={isSuccess ? 'text-emerald-900' : 'text-amber-900'}>{children}</p>
      </CardContent>
    </Card>
  );
}

function ReviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-slate-50 px-3 py-2">
      <p className="font-semibold text-foreground">{label}</p>
      <p>{value}</p>
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

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="numeric w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base shadow-sm outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-sm"
    />
  );
}

function formatStatus(value: string) {
  return value.replaceAll('_', ' ');
}
