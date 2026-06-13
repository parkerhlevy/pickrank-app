import Link from 'next/link';
import { Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthPage() {
  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Auth</p>
        <h1 className="text-3xl font-black leading-tight">Account Access Preview</h1>
        <p className="text-muted-foreground">Phase 0 placeholder for the future email-based account flow.</p>
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-950 text-white">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-300" aria-hidden="true" />
            <CardTitle>Email Sign In</CardTitle>
          </div>
          <CardDescription className="text-slate-300">Authentication is not wired yet. This screen is visual only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          <div className="rounded-lg border bg-slate-50 px-3 py-3 text-sm text-muted-foreground">Email address</div>
          <Button className="w-full" disabled>
            Continue Not Available
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Before Paid Entry</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Future paid contests require a verified account, eligibility checks, and payment review before entry creation.</p>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/how-it-works">Review How It Works</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
