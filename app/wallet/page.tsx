import Link from 'next/link';
import { ArrowRight, CreditCard, Info, ShieldCheck, WalletCards } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Wallet</p>
            <h1 className="text-3xl font-black leading-tight">PickRank Wallet</h1>
          </div>
          <span className="status-pill shrink-0">Placeholder-safe</span>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground">
            Account balance preview for contest funding and future winnings. Cash Balance and Site Credit stay distinct,
            and wallet actions remain disabled until provider and compliance review is complete.
          </p>
          <Link href="/how-it-works" className="inline-link shrink-0">
            How It Works
          </Link>
        </div>
      </section>

      <Card className="section-card overflow-hidden">
        <CardHeader className="section-card-header">
          <div className="flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-blue-300" aria-hidden="true" />
            <CardTitle>Balance Overview</CardTitle>
          </div>
          <CardDescription className="text-slate-300">
            Placeholder values with product-accurate PickRank balance labels.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 pt-5 sm:grid-cols-2">
          <div className="metric-tile">
            <p className="text-sm text-muted-foreground">Cash Balance</p>
            <p className="numeric text-2xl font-bold">$0.00</p>
            <p className="mt-1 text-xs text-muted-foreground">Withdrawable winnings after provider and compliance review.</p>
          </div>
          <div className="metric-tile">
            <p className="text-sm text-muted-foreground">Site Credit</p>
            <p className="numeric text-2xl font-bold">$0.00</p>
            <p className="mt-1 text-xs text-muted-foreground">Non-withdrawable value for refunds or promotions.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Contest Entry Funding</CardTitle>
          </div>
          <CardDescription>
            Future contest entries will review available PickRank balances before any external amount due.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="detail-row">
            <span>Site Credit</span>
            <span className="text-muted-foreground">Applied first</span>
          </div>
          <div className="detail-row">
            <span>Cash Balance</span>
            <span className="text-muted-foreground">Applied after Site Credit</span>
          </div>
          <div className="detail-row">
            <span>Amount Due Today</span>
            <span className="text-muted-foreground">External provider required</span>
          </div>
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Wallet Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Notice
            variant="muted"
            icon={Info}
            title="Wallet actions are not live yet"
            description="Payment providers, external deposits, cash withdrawals, and wallet ledger history are not live in the current product."
          />
          <Notice
            variant="warning"
            icon={ShieldCheck}
            title="Compliance and provider review still required"
            description="Site Credit cannot be withdrawn. Public real-money launch still requires legal, provider, and compliance review."
            badge="Not live"
          />
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Account Controls</CardTitle>
          </div>
          <CardDescription>
            Profile remains the main account surface. Wallet stays available here as the secondary balance route.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Notice
            variant="muted"
            icon={WalletCards}
            title="Wallet belongs to your PickRank account"
            description="Use Profile for account identity and readiness. Use Wallet for the balance summary while actions are not live."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="secondary" className="w-full">
              <Link href="/profile" className="gap-2">
                Back to Profile
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button className="w-full" disabled>
              Wallet Actions Not Available
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
