import Link from 'next/link';
import { ArrowRight, Globe, Mail, Shield } from 'lucide-react';
import { EmailSignInForm } from '@/components/auth/email-sign-in-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { defaultReturnPath, getReturnStepCopy, normalizeReturnPath } from '@/lib/auth-profile';
import { getMissingBrowserSupabaseKeys, hasBrowserSupabaseConfig } from '@/lib/env';
import { requestGoogleSignIn, requestMagicLink } from './actions';

type AuthPageProps = {
  searchParams?: Promise<{
    message?: string;
    next?: string;
    status?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const next = normalizeReturnPath(resolvedSearchParams.next, defaultReturnPath);
  const returnStep = getReturnStepCopy(next);
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
          {returnStep.isContestFlow
            ? `Sign in now, finish one quick username step if needed, and then resume ${returnStep.shortLabel.toLowerCase()}.`
            : 'Placeholder-safe Phase 1 foundation for sign-in, profile completion, and clear return paths.'}
        </p>
      </section>

      {next !== defaultReturnPath ? (
        <Card>
          <CardHeader>
            <CardTitle>You&apos;re Resuming</CardTitle>
            <CardDescription>{returnStep.detail}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
              <span>1. Sign in</span>
              <span className="font-medium text-foreground">Current</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
              <span>2. Save username if this is a new account</span>
              <span>Next if needed</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
              <span>3. Resume your saved step</span>
              <span>{returnStep.shortLabel}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-950 text-white">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-300" aria-hidden="true" />
            <CardTitle>Google Sign In</CardTitle>
          </div>
          <CardDescription className="text-slate-300">
            {authConfigured
              ? 'Primary low-friction sign-in path for preserving contest-entry intent.'
              : 'Add the Supabase environment values below to turn on hosted sign-in.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {status === 'check-email' ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
              Check your email for the PickRank sign-in link. After sign-in, you&apos;ll resume {returnStep.shortLabel.toLowerCase()}.
            </div>
          ) : null}
          {status === 'signed-out' ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900">
              You have been signed out.
            </div>
          ) : null}
          {status === 'error' ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
              {message || 'Auth is not ready yet. Add the required environment values and try again.'}
            </div>
          ) : null}
          {authConfigured ? (
            <>
              <form action={requestGoogleSignIn}>
                <input type="hidden" name="next" value={next} />
                <Button className="w-full" type="submit">
                  Continue with Google
                </Button>
              </form>
              {next !== defaultReturnPath ? (
                <div className="rounded-lg border bg-slate-50 px-3 py-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">After sign-in</p>
                  <p>You&apos;ll go to {returnStep.detail}.</p>
                </div>
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
              <p>Vercel: add the same values in Project Settings and redeploy before testing hosted auth.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="bg-white">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Email Fallback</CardTitle>
          </div>
          <CardDescription>
            Keep magic-link access available, but use custom SMTP before relying on it in production.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {authConfigured ? (
            <>
              <EmailSignInForm action={requestMagicLink} next={next} />
              <p className="text-sm text-muted-foreground">
                Production note: Supabase&apos;s built-in sender is rate-limited. Configure custom SMTP for dependable email fallback.
              </p>
            </>
          ) : (
            <div className="rounded-lg border bg-slate-50 px-3 py-3 text-sm text-muted-foreground">
              Email fallback will activate automatically once Supabase environment values are present.
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
          <div className="rounded-lg border bg-white px-3 py-3">New users complete a username step after sign-in before returning to the saved contest step.</div>
          <div className="rounded-lg border bg-slate-50 px-3 py-3">Google is the fast path. Email remains the fallback once custom SMTP is configured in Supabase.</div>
          {next !== defaultReturnPath ? (
            <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-3 text-foreground">
              <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{returnStep.actionLabel}</span>
            </div>
          ) : null}
          <Button asChild variant="secondary" className="w-full">
            <Link href="/how-it-works">Review How It Works</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
