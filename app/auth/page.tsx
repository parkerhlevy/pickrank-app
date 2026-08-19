import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Globe, Info, Mail, Shield } from 'lucide-react';
import { EmailSignInForm } from '@/components/auth/email-sign-in-form';
import { Notice } from '@/components/ui/notice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { defaultReturnPath, getReturnStepCopy, normalizeReturnPath } from '@/lib/auth-profile';
import { getMissingBrowserSupabaseKeys, hasBrowserSupabaseConfig } from '@/lib/env';
import { launchMode } from '@/lib/launch-mode';
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
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="eyebrow">Auth</p>
            <h1 className="text-3xl font-black leading-tight">Account settings</h1>
          </div>
          <span className="status-pill shrink-0">{returnStep.isContestFlow ? 'Contest flow' : 'Account setup'}</span>
        </div>
      </section>

      {next !== defaultReturnPath ? (
        <Card className="section-card">
          <CardHeader>
            <CardTitle>Before you enter</CardTitle>
            <CardDescription>{returnStep.detail}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Google or email sign-in confirms account access. PickRank still captures public username, date of birth for
            18+ eligibility, state, Beta Terms acceptance, and Privacy acceptance before beta entry.
          </CardContent>
        </Card>
      ) : null}

      <Card className="section-card overflow-hidden">
        <CardHeader className="section-card-header">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-300" aria-hidden="true" />
            <CardTitle>Google sign-in</CardTitle>
          </div>
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
                <div className="soft-panel text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">After sign-in</p>
                  <p>You&apos;ll finish any missing Profile setup before {returnStep.shortLabel.toLowerCase()}.</p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="soft-panel space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Missing environment values</p>
              <ul className="space-y-2">
                {missingKeys.map((key) => (
                  <li key={key} className="rounded-md bg-white px-3 py-2 font-mono text-xs text-foreground">
                    {key}
                  </li>
                ))}
              </ul>
              <p>Local: copy `.env.example` to `.env.local` and fill in the Supabase project values.</p>
              <p>Vercel: add the same values in project settings and redeploy before testing hosted auth.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="section-card overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Email sign-in</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {authConfigured ? (
            <>
              <EmailSignInForm action={requestMagicLink} next={next} />
              <p className="text-sm text-muted-foreground">
                We&apos;ll send a sign-in link to your inbox.
              </p>
            </>
          ) : (
            <Notice
              variant="muted"
              icon={Mail}
              title="Email sign-in not ready"
              description="Email sign-in will activate automatically once Supabase environment values are present."
              badge="Setup required"
            />
          )}
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>How PickRank uses your information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            PickRank uses account details to support sign-in, profile setup, and free beta contest entry. Review the{' '}
            <Link className="inline-link" href="/legal/terms">
              Beta Terms
            </Link>{' '}
            and{' '}
            <Link className="inline-link" href="/legal/privacy">
              Privacy Policy
            </Link>{' '}
            for details.
          </p>
          <p className="soft-panel text-foreground">{launchMode.betaNoCashValueCopy}</p>
          {next !== defaultReturnPath ? (
            <div className="detail-row bg-white text-foreground">
              <span>{returnStep.actionLabel}</span>
              <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
          ) : null}
          <Button asChild variant="secondary" className="w-full">
            <Link href="/how-it-works">Review how it works</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
