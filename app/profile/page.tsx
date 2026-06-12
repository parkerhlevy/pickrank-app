import Link from 'next/link';
import { ShieldCheck, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Profile</p>
            <h1 className="text-3xl font-bold tracking-tight">Account Preview</h1>
          </div>
          <Link href="/how-it-works" className="text-sm font-medium text-primary">
            How It Works
          </Link>
        </div>
        <p className="text-muted-foreground">Profile UI shell only. Verified accounts and eligibility checks come later.</p>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Signed-Out State</CardTitle>
          </div>
          <CardDescription>Authentication is not implemented in this UI pass.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/auth">Go to Auth Preview</Link>
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
            <div key={label} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span>{label}</span>
              <span className="text-muted-foreground">Not wired</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
