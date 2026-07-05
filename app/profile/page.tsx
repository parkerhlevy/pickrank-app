import { ShieldCheck, UserCircle, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/app/auth/actions';
import { buildAuthHref, defaultReturnPath, getProfileIdentity, getReturnStepCopy, normalizeReturnPath } from '@/lib/auth-profile';
import { getMissingBrowserSupabaseKeys, hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { completeProfile } from './actions';

type ProfilePageProps = {
  searchParams?: Promise<{
    message?: string;
    next?: string;
    status?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const next = normalizeReturnPath(resolvedSearchParams.next, defaultReturnPath);
  const returnStep = getReturnStepCopy(next);
  const authConfigured = hasBrowserSupabaseConfig();
  const missingKeys = getMissingBrowserSupabaseKeys();
  const status = resolvedSearchParams.status;
  const message = resolvedSearchParams.message;
  let user = null;

  if (authConfigured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();

      user = data.user;
    } catch {
      user = null;
    }
  }

  const identity = getProfileIdentity(user);

  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Profile</p>
            <h1 className="text-3xl font-black leading-tight">{user ? 'Your Account' : 'Create Your Account'}</h1>
          </div>
        </div>
        <p className="text-muted-foreground">
          {user
            ? 'Manage your username, account session, and the basics tied to contest entry from one place.'
            : 'You can browse contests without signing in. Create an account here to enter contests, save lineups, and keep your place in the flow.'}
        </p>
      </section>

      {next !== defaultReturnPath ? (
        <Card className="section-card">
          <CardHeader>
            <CardTitle>One Quick Step Left</CardTitle>
            <CardDescription>
              Save a public username here, then continue to {returnStep.detail}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="detail-row bg-white">
              <span>Signed in</span>
              <span className="text-emerald-700">Complete</span>
            </div>
            <div className="detail-row">
              <span>Choose public username</span>
              <span className="font-medium text-foreground">Current</span>
            </div>
            <div className="detail-row">
              <span>Resume saved contest step</span>
              <span>{returnStep.shortLabel}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="section-card overflow-hidden">
        <CardHeader className="section-card-header">
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-blue-300" aria-hidden="true" />
            <CardTitle>{user ? 'Signed-In Session' : 'Signed-Out State'}</CardTitle>
          </div>
          <CardDescription className="text-slate-300">
            {user
              ? 'Your account session is active.'
              : 'Create an account or log in to continue from contest browsing into entry, lineup, and wallet views.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {status === 'profile-saved' ? (
            <Notice
              variant="success"
              icon={UserCircle}
              title="Username saved"
              description="Your public profile name is ready for contest-entry flow."
              badge="Saved"
            />
          ) : null}
          {status === 'error' ? (
            <Notice
              variant="warning"
              icon={ShieldCheck}
              title="Profile setup needs attention"
              description={message || 'Profile setup is not ready yet.'}
              badge="Action needed"
            />
          ) : null}
          {!authConfigured ? (
            <div className="soft-panel space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Add Supabase environment values before testing sign-in here.</p>
              <ul className="space-y-2">
                {missingKeys.map((key) => (
                  <li key={key} className="rounded-md bg-white px-3 py-2 font-mono text-xs text-foreground">
                    {key}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {authConfigured && !user ? (
            <Button asChild className="w-full">
              <Link href={buildAuthHref(next)}>
                {next !== defaultReturnPath ? 'Create Account or Log In to Continue' : 'Create Account or Log In'}
              </Link>
            </Button>
          ) : null}
          {user ? (
            <div className="soft-panel space-y-3 text-sm">
              <p className="font-medium text-foreground">Signed in as {identity.email}</p>
              <form action={signOut}>
                <Button className="w-full" type="submit" variant="secondary">
                  Manage Auth Session
                </Button>
              </form>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {user ? (
        identity.isProfileComplete ? (
          <Card className="section-card">
            <CardHeader>
              <CardTitle>Profile Identity</CardTitle>
              <CardDescription>Your current contest-entry flow can use this public username.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="section-card-muted px-3 py-3">
                <p className="text-muted-foreground">Username</p>
                <p className="text-lg font-bold">{identity.displayName || identity.username}</p>
              </div>
              {!identity.isEmailVerified && next !== defaultReturnPath ? (
                <Notice
                  variant="warning"
                  icon={ShieldCheck}
                  title="Verify your email to enter contests"
                  description={`After you confirm your email, come back here and continue to ${returnStep.shortLabel.toLowerCase()}.`}
                  badge="Pending"
                />
              ) : null}
              {identity.isEmailVerified && next !== defaultReturnPath ? (
                <Button asChild className="w-full">
                  <Link href={next}>{returnStep.actionLabel}</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card className="section-card">
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Add a public username before returning to {returnStep.shortLabel.toLowerCase()}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form className="space-y-3" action={completeProfile}>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Username</span>
                  <input
                    required
                    type="text"
                    name="username"
                    placeholder="pickrank_user"
                    className="w-full rounded-lg border bg-slate-50 px-3 py-3 text-sm text-foreground outline-none ring-0 transition focus:border-slate-950"
                  />
                </label>
                <p className="text-sm text-muted-foreground">
                  Use 3-20 lowercase letters, numbers, or underscores. This is the public name shown for your account.
                </p>
                {next !== defaultReturnPath ? (
                  <div className="section-card-muted px-3 py-3 text-sm text-muted-foreground">
                    After you save, PickRank will send you straight to {returnStep.detail}.
                  </div>
                ) : null}
                <input type="hidden" name="next" value={next} />
                <Button className="w-full" type="submit">
                  Save Username
                </Button>
              </form>
            </CardContent>
          </Card>
        )
      ) : null}

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Wallet & Balances</CardTitle>
          </div>
          <CardDescription>Wallet balances appear here for signed-in accounts as contest funding and payout support expands.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="metric-tile">
              <p className="text-sm text-muted-foreground">Cash Balance</p>
              <p className="text-xl font-bold">$0.00</p>
              <p className="mt-1 text-xs text-muted-foreground">Withdrawable winnings after provider review.</p>
            </div>
            <div className="metric-tile">
              <p className="text-sm text-muted-foreground">Site Credit</p>
              <p className="text-xl font-bold">$0.00</p>
              <p className="mt-1 text-xs text-muted-foreground">Non-withdrawable refunds or promotional credit.</p>
            </div>
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/wallet">View Wallet Details</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Entry Readiness</CardTitle>
          </div>
          <CardDescription>These checks help PickRank confirm when an account is ready for contest entry and later wallet actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="detail-row">
            <span>Email verification</span>
            <span className="text-muted-foreground">{identity.isEmailVerified ? 'Verified' : 'Pending'}</span>
          </div>
          {['Age and location review', 'Responsible play controls', 'Withdrawal verification'].map((label) => (
            <div key={label} className="detail-row">
              <span>{label}</span>
              <span className="text-muted-foreground">Not started</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
