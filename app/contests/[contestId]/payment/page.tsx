import Link from 'next/link';
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCents, getPaymentReviewBreakdown, openContests } from '@/lib/phase-0-demo';

export default async function PaymentReviewPage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = await params;
  const contest = openContests.find((item) => item.id === contestId) ?? openContests[0];
  const breakdown = getPaymentReviewBreakdown(contest.entryFee);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-3 justify-start">
        <Link href={`/contests/${contest.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Contest Details
        </Link>
      </Button>

      <div className="screen-header space-y-2">
        <p className="eyebrow">Payment Review</p>
        <h1 className="text-3xl font-black leading-tight">{contest.title}</h1>
        <p className="text-muted-foreground">Review how this entry fee would be covered before lineup access opens.</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-950 text-white">
          <CardTitle>Entry Fee Breakdown</CardTitle>
          <CardDescription className="text-slate-300">
            Visual placeholder only. Confirming entry, charging payment, and creating entries are not wired.
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
          <CardTitle>Entry Status</CardTitle>
          <CardDescription>Lineup access remains behind successful entry in the product flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>Site Credit is applied first, then Cash Balance, then any external amount due.</p>
          </div>
          <div className="flex items-start gap-2">
            <CreditCard className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>External payment provider selection and payment processing are still future work.</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>No wallet funds are debited and no contest entry is created from this placeholder screen.</p>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-20 rounded-lg border bg-white p-3 shadow-lg">
        <Button className="w-full" disabled>
          Confirm Entry - Placeholder Only
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
