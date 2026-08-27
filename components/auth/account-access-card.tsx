import { AlertTriangle, CheckCircle2, Info, UserCircle } from 'lucide-react';
import { requestGoogleSignIn, requestMagicLink } from '@/app/auth/actions';
import { EmailSignInForm } from '@/components/auth/email-sign-in-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import type { AuthSurface } from '@/lib/auth-profile';
import { defaultReturnPath, getReturnStepCopy } from '@/lib/auth-profile';
import { getMissingBrowserSupabaseKeys, hasBrowserSupabaseConfig } from '@/lib/env';

type AccountAccessCardProps = {
  message?: string;
  next: string;
  status?: string;
  surface: AuthSurface;
};

export function AccountAccessCard({ message, next, status, surface }: AccountAccessCardProps) {
  const authConfigured = hasBrowserSupabaseConfig();
  const missingKeys = getMissingBrowserSupabaseKeys();
  const returnStep = getReturnStepCopy(next);

  return (
    <Card className="section-card overflow-hidden">
      <CardHeader className="section-card-header">
        <div className="flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-blue-300" aria-hidden="true" />
          <CardTitle>Account access</CardTitle>
        </div>
        <CardDescription className="text-slate-300">
          Choose Google or email. New users create an account as part of sign-in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
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
              <input type="hidden" name="authSurface" value={surface} />
              <Button className="w-full" type="submit">
                Continue with Google
              </Button>
            </form>
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <EmailSignInForm action={requestMagicLink} next={next} surface={surface} />
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
  );
}
