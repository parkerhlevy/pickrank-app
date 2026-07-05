import Link from 'next/link';
import { CreditCard, Info, WalletCards } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Wallet</p>
            <h1 className="text-3xl font-black leading-tight">Cash Balance & Site Credit</h1>
          </div>
          <Link href="/how-it-works" className="text-sm font-bold text-primary">
            How It Works
          </Link>
        </div>
        <p className="text-muted-foreground">
          Placeholder balance cards for the future wallet system. Deposits, withdrawals, and ledger history are not live in the current product.
        </p>
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
            <p className="text-2xl font-bold">$0.00</p>
            <p className="mt-1 text-xs text-muted-foreground">Withdrawable winnings after provider and compliance review.</p>
          </div>
          <div className="metric-tile">
            <p className="text-sm text-muted-foreground">Site Credit</p>
            <p className="text-2xl font-bold">$0.00</p>
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
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Payment providers, external deposits, cash withdrawals, and wallet ledger history are not live yet.</p>
          <p>Site Credit cannot be withdrawn. Public real-money launch still requires legal, provider, and compliance review.</p>
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
          <div className="empty-state-card text-sm text-muted-foreground">
            Payment review stays placeholder-only here until provider-backed entry funding is live.
          </div>
          <Button className="w-full" disabled>
            Wallet Actions Not Available
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
