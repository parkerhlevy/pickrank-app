import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Globe, Info, Mail, Shield } from 'lucide-react';
import { EmailSignInForm } from '@/components/auth/email-sign-in-form';
import { Notice } from '@/components/ui/notice';
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
        <h1 className="text-3xl font-black leading-tight">Account Access</h1>
        <p className="text-muted-foreground">
          {returnStep.isContestFlow
            ? `You need to be signed in to enter any contest. Sign in now, finish one quick username step if needed, and then resume ${returnStep.shortLabel.toLowerCase()}.`
            : 'Create your account, choose a public username, and keep your contest and profile steps in one place.'}
        </p>
      </section>

      {next !== defaultReturnPath ? (
        <Card>
          <CardHeader>
            <CardTitle>Before You Enter</CardTitle>
            <CardDescription>{returnStep.detail}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Sign in first, then PickRank will send you back to {returnStep.shortLabel.toLowerCase()}. If this is a new account, you may also need to choose a username before you continue.
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
            <Notice
              variant="success"
              icon={CheckCircle2}
              title="Check your email"
              description={`Check your email for the PickRank sign-in link. After sign-in, you'll resume ${returnStep.shortLabel.toLowerCase()}.`}
              badge="Sign-in link sent"
            />
          ) : null}
          {status === 'signed-out' ? (
            <Notice
              variant="muted"
              icon={Info}
              title="Signed out"
              description="You have been signed out."
            />
          ) : null}
          {status === 'error' ? (
            <Notice
              variant="error"
              icon={AlertTriangle}
              title="Sign-in unavailable"
              description={message || 'Sign-in is temporarily unavailable here. Add the required environment values and try again.'}
              badge="Needs attention"
            />
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
            <CardTitle>Email Sign In</CardTitle>
          </div>
          <CardDescription>
            Sign in by email if you do not want to use Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {authConfigured ? (
            <>
              <EmailSignInForm action={requestMagicLink} next={next} />
              <p className="text-sm text-muted-foreground">
                We&apos;ll send a sign-in link to your inbox.
              </p>
            </>
          ) : (
            <div className="rounded-lg border bg-slate-50 px-3 py-3 text-sm text-muted-foreground">
              Email sign-in will activate automatically once Supabase environment values are present.
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
          <p>PickRank uses account sign-in, username setup, and entry review so each contest step feels clear and tied to one account.</p>
          <div className="rounded-lg border bg-white px-3 py-3">New users complete a username step after sign-in before returning to the saved contest step.</div>
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
