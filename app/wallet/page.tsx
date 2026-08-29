import Link from 'next/link';
import { ArrowRight, CreditCard, Info, ShieldCheck, WalletCards } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HowItWorksButton } from '@/components/ui/how-it-works-button';
import { Notice } from '@/components/ui/notice';
import { launchMode } from '@/lib/launch-mode';

export default function WalletPage() {
  const isPaidPreview = launchMode.paidPreviewVisible;

  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">{isPaidPreview ? 'Wallet' : 'Beta Pass'}</p>
            <h1 className="text-3xl font-black leading-tight">{isPaidPreview ? 'PickRank wallet' : 'Beta Pass status'}</h1>
          </div>
          <span className="status-pill shrink-0">{launchMode.displayName}</span>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground">
            {isPaidPreview
              ? 'Beta Pass status for free beta contests. Paid balances, deposits, withdrawals, payouts, and wallet actions remain disabled until provider and compliance review is complete.'
              : 'Beta Pass gives you free entry access during Early Access Beta. It has no cash value, cannot be withdrawn, and does not create payouts or cash prizes.'}
          </p>
          <HowItWorksButton className="self-start" returnTo="/wallet" />
        </div>
      </section>

      <Card className="section-card overflow-hidden">
        <CardHeader className="section-card-header">
          <div className="flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-blue-300" aria-hidden="true" />
            <CardTitle>{isPaidPreview ? 'Balance overview' : 'Beta Pass overview'}</CardTitle>
          </div>
          <CardDescription className="text-slate-300">
            Early Access Beta uses a Beta Pass instead of cash-like credits.
          </CardDescription>
        </CardHeader>
        <CardContent className={isPaidPreview ? 'grid gap-3 pt-5 sm:grid-cols-2' : 'grid gap-3 pt-5'}>
          <div className="metric-tile">
            <p className="text-sm text-muted-foreground">{launchMode.betaPassLabel}</p>
            <p className="numeric text-2xl font-bold">Active</p>
            <p className="mt-1 text-xs text-muted-foreground">Covers free beta entries. No cash value.</p>
          </div>
          {isPaidPreview ? (
            <div className="metric-tile">
            <p className="text-sm text-muted-foreground">Future paid balances</p>
              <p className="numeric text-2xl font-bold">$0.00</p>
              <p className="mt-1 text-xs text-muted-foreground">Not live during beta.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle>Beta entry access</CardTitle>
          </div>
          <CardDescription>
            {isPaidPreview
              ? 'Beta entries are free to play. Future paid contest entries will use a separate provider-backed funding path.'
              : 'Beta entries are free to play with Beta Pass access.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="detail-row">
            <span>{launchMode.betaPassLabel}</span>
            <span className="text-muted-foreground">Active during beta</span>
          </div>
          <div className="detail-row">
            <span>No payouts</span>
            <span className="text-muted-foreground">No cash prizes</span>
          </div>
          {isPaidPreview ? (
            <div className="detail-row">
              <span>Amount due today</span>
              <span className="text-muted-foreground">$0.00 during beta</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Wallet status</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Notice
            variant="muted"
            icon={Info}
            title={isPaidPreview ? 'Wallet actions are not live yet' : 'Future wallet is parked'}
            description={
              isPaidPreview
                ? 'Payment providers, external deposits, cash withdrawals, payouts, and wallet ledger history are not live in the current product.'
                : 'The public beta uses Beta Pass only. Payment providers, deposits, withdrawals, payouts, and wallet history are not active beta UI.'
            }
          />
          <Notice
            variant="warning"
            icon={ShieldCheck}
            title="No cash value"
            description="Beta Pass cannot be withdrawn or redeemed for cash. No payouts or cash prizes are available during beta."
            badge="Beta"
          />
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Account controls</CardTitle>
          </div>
          <CardDescription>
            Profile remains the main account surface during Early Access Beta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Notice
            variant="muted"
            icon={WalletCards}
            title={isPaidPreview ? 'Wallet belongs to your PickRank account' : 'Beta Pass belongs to your PickRank account'}
            description={
              isPaidPreview
                ? 'Use Profile for account identity and beta readiness. Use Wallet for Beta Pass status while paid actions are not live.'
                : 'Use Profile for account identity and beta readiness. Use this page only to confirm Beta Pass status.'
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="secondary" className="w-full">
              <Link href="/profile" className="gap-2">
                Back to profile
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild className="w-full">
              <Link href="/contests">View contests</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
