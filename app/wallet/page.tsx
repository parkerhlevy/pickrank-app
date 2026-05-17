import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Wallet</p>
        <h1 className="text-3xl font-bold tracking-tight">Site Credit</h1>
        <p className="text-muted-foreground">
          Track deposits, contest entries, payouts, and withdrawals.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Wallet placeholder</CardTitle>
          <CardDescription>
            Wallet balances and transaction history will be implemented in a future phase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
