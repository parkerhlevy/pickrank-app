import Link from 'next/link';
import { ArrowRight, Shield } from 'lucide-react';
import { AccountAccessCard } from '@/components/auth/account-access-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { defaultReturnPath, getReturnStepCopy, normalizeReturnPath } from '@/lib/auth-profile';
import { getHowItWorksHref } from '@/lib/how-it-works-navigation';
import { launchMode } from '@/lib/launch-mode';

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
  const status = resolvedSearchParams.status;
  const message = resolvedSearchParams.message;

  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="eyebrow">Auth</p>
            <h1 className="text-3xl font-black leading-tight">Create your account or sign in</h1>
          </div>
          {returnStep.isContestFlow ? <span className="status-pill shrink-0">Contest flow</span> : null}
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

      <AccountAccessCard message={message} next={next} status={status} surface="auth" />

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
          <p className="soft-panel text-foreground">
            {launchMode.mode === 'early_access_beta'
              ? 'No payouts or cash prizes are available during beta.'
              : launchMode.betaNoCashValueCopy}
          </p>
          {next !== defaultReturnPath ? (
            <div className="detail-row bg-white text-foreground">
              <span>{returnStep.actionLabel}</span>
              <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
          ) : null}
          <Button asChild variant="secondary" className="w-full">
            <Link href={getHowItWorksHref('/auth')}>Review how it works</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
