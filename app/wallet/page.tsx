import Link from 'next/link';
import { CreditCard, Info, ShieldCheck, WalletCards } from 'lucide-react';
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
            <h1 className="text-3xl font-black leading-tight">Cash Balance & Site Credit</h1>
          </div>
          <span className="status-pill shrink-0">Placeholder-safe</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground">
            Placeholder balance cards for the future wallet system. Deposits, withdrawals, and ledger history are not
            live in the current product.
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
            <CardTitle>Wallet Preview</CardTitle>
          </div>
          <CardDescription className="text-slate-300">Placeholder values for reviewing balance layout and labels.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 pt-5">
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
            <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Payment Review</CardTitle>
          </div>
          <CardDescription>Future entries review Cash Balance and Site Credit before any remaining amount is handled externally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Notice
            variant="muted"
            icon={CreditCard}
            title="Payment review stays placeholder-only"
            description="Cash Balance and Site Credit labels are in place here now, but provider-backed entry funding is not live yet."
            badge="Preview"
          />
          <Button className="w-full" disabled>
            Wallet Actions Not Available
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
