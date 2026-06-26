import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getProtectedContestEntryRedirect } from '@/lib/contest-entry-access';
import {
  contestEntryCookieName,
  getContestEntryProgressHref,
  getContestEntryRouteState,
  getContestEntryStateCopy,
  getContestEntrySteps,
  getPersistedContestEntryStage,
} from '@/lib/contest-entry-flow';
import { formatCents, getContestById, getPaymentReviewBreakdown } from '@/lib/phase-0-demo';

export default async function PaymentReviewPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const { contestId } = await params;
  const contest = getContestById(contestId);
  const next = `/contests/${contest.id}/payment`;
  const protectedRedirect = await getProtectedContestEntryRedirect(next);

  if (protectedRedirect) {
    redirect(protectedRedirect);
  }

  const cookieStore = await cookies();
  const persistedStage = getPersistedContestEntryStage(
    contest.id,
    cookieStore.get(contestEntryCookieName)?.value,
  );
  const routeState = getContestEntryRouteState({ contestId: contest.id, persistedStage, route: 'payment' });

  if (routeState.shouldRedirect && routeState.redirectHref) {
    redirect(routeState.redirectHref);
  }

  const stateCopy = getContestEntryStateCopy(routeState.stage);
  const flowSteps = getContestEntrySteps(routeState.stage);
  const breakdown = getPaymentReviewBreakdown(contest.entryFee);

  const upcomingSteps = flowSteps.filter((step) => step.status === 'upcoming');

  return (
    <div className="space-y-5 pb-28">
      <Button asChild variant="ghost" size="sm" className="-ml-3 justify-start">
        <Link href={`/contests/${contest.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Contest Details
        </Link>
      </Button>

      <div className="screen-header space-y-2">
        <p className="eyebrow">Payment Review</p>
        <h1 className="text-3xl font-black leading-tight">{contest.title}</h1>
        <p className="text-muted-foreground">Review your entry fee and confirm how this contest will be covered before you continue.</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-950 text-white">
          <CardTitle>Entry Fee Breakdown</CardTitle>
          <CardDescription className="text-slate-300">
            Site Credit is applied first, then Cash Balance, with any remaining amount due today.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5 text-sm">
          <ReviewRow label="Entry Fee" value={formatCents(breakdown.entryFeeCents)} strong />
          <div className="border-t border-slate-200 pt-3">
            <ReviewRow label="Site Credit Applied" value={`-${formatCents(breakdown.siteCreditAppliedCents)}`} />
            <ReviewRow label="Cash Balance Applied" value={`-${formatCents(breakdown.cashBalanceAppliedCents)}`} />
          </div>
          <div className="rounded-lg bg-slate-100 p-3">
            <ReviewRow label="Amount Due Today" value={formatCents(breakdown.amountDueTodayCents)} strong />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{stateCopy.title}</CardTitle>
              <CardDescription>Confirm this entry, then head straight into your lineup for this contest.</CardDescription>
            </div>
            <span className="status-pill shrink-0">{stateCopy.badge}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>Site Credit is applied first, then Cash Balance, then any external amount due.</p>
          </div>
          <div className="flex items-start gap-2">
            <CreditCard className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>If your balances do not fully cover the fee, the remaining amount shows under Amount Due Today.</p>
          </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
          <p>Once you confirm, your entry is saved and you can head straight into lineup setup.</p>
        </div>
          <div className="rounded-lg border bg-white px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Up next</p>
            <div className="mt-2 space-y-2">
              {upcomingSteps.map((step) => (
                <div key={step.key} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      Step {step.stepNumber}: {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.summary}</p>
                  </div>
                  <span className="text-muted-foreground">Next</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-white p-3 shadow-lg">
        <Button asChild className="w-full">
          <Link href={getContestEntryProgressHref(contest.id, 'entered')}>Confirm Entry</Link>
        </Button>
      </div>
    </div>
  );
}

function ReviewRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className={strong ? 'font-bold' : 'text-muted-foreground'}>{label}</span>
      <span className={strong ? 'font-black' : 'font-semibold'}>{value}</span>
    </div>
  );
}
