import Link from 'next/link';
import { Mail, Shield } from 'lucide-react';
import { headers } from 'next/headers';
import { EmailSignInForm } from '@/components/auth/email-sign-in-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { defaultReturnPath, normalizeReturnPath } from '@/lib/auth-profile';
import { getAppUrl, getMissingBrowserSupabaseKeys, getRequestOrigin, hasBrowserSupabaseConfig } from '@/lib/env';
import { requestMagicLink } from './actions';

type AuthPageProps = {
  searchParams?: Promise<{
    message?: string;
    next?: string;
    status?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const requestHeaders = await headers();
  const requestOrigin = getRequestOrigin(requestHeaders, getAppUrl());
  const next = normalizeReturnPath(resolvedSearchParams.next, defaultReturnPath);
  const authConfigured = hasBrowserSupabaseConfig();
  const missingKeys = getMissingBrowserSupabaseKeys();
  const status = resolvedSearchParams.status;
  const message = resolvedSearchParams.message;

  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Auth</p>
        <h1 className="text-3xl font-black leading-tight">Account Access Preview</h1>
        <p className="text-muted-foreground">
          Placeholder-safe Phase 1 foundation for the future email-based account flow.
        </p>
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-950 text-white">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-300" aria-hidden="true" />
            <CardTitle>Email Sign In</CardTitle>
          </div>
          <CardDescription className="text-slate-300">
            {authConfigured
              ? 'Supabase auth wiring is ready for local or Vercel testing.'
              : 'Add the Supabase environment values below to turn on the email sign-in path.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {status === 'check-email' ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
              Check your email for the PickRank sign-in link.
            </div>
          ) : null}
          {status === 'error' ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
              {message || 'Auth is not ready yet. Add the required environment values and try again.'}
            </div>
          ) : null}
          {authConfigured ? (
            <>
              <EmailSignInForm action={requestMagicLink} next={next} />
              <p className="text-sm text-muted-foreground">
                Redirect target: <span className="font-medium text-foreground">{requestOrigin}/auth/callback</span>
              </p>
              {next !== defaultReturnPath ? (
                <p className="text-sm text-muted-foreground">
                  After sign-in: <span className="font-medium text-foreground">{next}</span>
                </p>
              ) : null}
            </>
          ) : (
            <div className="space-y-3 rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Missing environment values</p>
              <ul className="space-y-2">
                {missingKeys.map((key) => (
                  <li key={key} className="rounded-md bg-white px-3 py-2 font-mono text-xs text-foreground">
                    {key}
                  </li>
                ))}
              </ul>
              <p>Local: copy `.env.example` to `.env.local` and fill in the Supabase project values.</p>
              <p>Vercel: add the same values in Project Settings and redeploy before testing auth.</p>
            </div>
          )}
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
          <div className="rounded-lg border bg-white px-3 py-3">
            New users complete a username step after sign-in before returning to contest entry.
          </div>
          <div className="rounded-lg border bg-slate-50 px-3 py-3">
            Safe Phase 1 scope: email sign-in wiring, callback handling, username completion, and signed-in session detection only.
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/how-it-works">Review How It Works</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
