import { ShieldCheck, UserCircle, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Profile</p>
            <h1 className="text-3xl font-black leading-tight">Account Preview</h1>
          </div>
        </div>
        <p className="text-muted-foreground">Profile UI shell only. Verified accounts and eligibility checks come later.</p>
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-950 text-white">
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-blue-300" aria-hidden="true" />
            <CardTitle>Signed-Out State</CardTitle>
          </div>
          <CardDescription className="text-slate-300">Authentication is not implemented in this UI pass.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <Button asChild className="w-full">
            <Link href="/auth">Go to Auth Preview</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Wallet & Balances</CardTitle>
          </div>
          <CardDescription>Design-only wallet summary. Payment and ledger behavior are not wired.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="metric-tile">
              <p className="text-sm text-muted-foreground">Cash Balance</p>
              <p className="text-xl font-bold">$0.00</p>
            </div>
            <div className="metric-tile">
              <p className="text-sm text-muted-foreground">Site Credit</p>
              <p className="text-xl font-bold">$0.00</p>
            </div>
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/wallet">View Wallet Details</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Eligibility Placeholder</CardTitle>
          </div>
          <CardDescription>Future account status rows without real verification logic.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {['Email verification', 'Age and location review', 'Responsible play controls'].map((label) => (
            <div key={label} className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
              <span>{label}</span>
              <span className="text-muted-foreground">Not wired</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
