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
            <h1 className="text-3xl font-black leading-tight">Balances</h1>
          </div>
          <Link href="/how-it-works" className="text-sm font-bold text-primary">
            How It Works
          </Link>
        </div>
        <p className="text-muted-foreground">
          Placeholder balance cards for the future wallet system. No deposits, withdrawals, or ledger behavior is active.
        </p>
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-950 text-white">
          <div className="flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-blue-300" aria-hidden="true" />
            <CardTitle>Demo Balance</CardTitle>
          </div>
          <CardDescription className="text-slate-300">Design-only values for reviewing the UI.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 pt-5">
          <div className="metric-tile">
            <p className="text-sm text-muted-foreground">Cash Balance</p>
            <p className="text-2xl font-bold">$0.00</p>
            <p className="mt-1 text-xs text-muted-foreground">Withdrawable winnings after provider review.</p>
          </div>
          <div className="metric-tile">
            <p className="text-sm text-muted-foreground">Site Credit</p>
            <p className="text-2xl font-bold">$0.00</p>
            <p className="mt-1 text-xs text-muted-foreground">Non-withdrawable value for refunds or promotions.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Wallet Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Payment providers, external deposits, cash withdrawals, and wallet ledger history are not implemented in Phase 0.</p>
          <p>Site Credit cannot be withdrawn. Public real-money launch requires legal and payment-provider review.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Payment Review</CardTitle>
          </div>
          <CardDescription>Future entries will review Cash Balance and Site Credit before external payment.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" disabled>
            Wallet Actions Not Available
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
