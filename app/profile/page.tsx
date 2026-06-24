import { ShieldCheck, UserCircle, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/app/auth/actions';
import { buildAuthHref, defaultReturnPath, getProfileIdentity, getReturnStepCopy, normalizeReturnPath } from '@/lib/auth-profile';
import { getMissingBrowserSupabaseKeys, hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
            <h1 className="text-3xl font-black leading-tight">Account Preview</h1>
          </div>
        </div>
        <p className="text-muted-foreground">Complete the minimum account identity step here before contest-entry flows expand further.</p>
      </section>

      {next !== defaultReturnPath ? (
        <Card>
          <CardHeader>
            <CardTitle>One Quick Step Left</CardTitle>
            <CardDescription>
              Save a public username here, then continue to {returnStep.detail}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
              <span>Signed in</span>
              <span className="text-emerald-700">Complete</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
              <span>Choose public username</span>
              <span className="font-medium text-foreground">Current</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
              <span>Resume saved contest step</span>
              <span>{returnStep.shortLabel}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-950 text-white">
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-blue-300" aria-hidden="true" />
            <CardTitle>{user ? 'Signed-In Session' : 'Signed-Out State'}</CardTitle>
          </div>
          <CardDescription className="text-slate-300">
            {user ? 'Supabase returned an authenticated user for this session.' : 'Create an account or log in to continue to Profile and contest entry.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {status === 'profile-saved' ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
              Your username is saved.
            </div>
          ) : null}
          {status === 'error' ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
              {message || 'Profile setup is not ready yet.'}
            </div>
          ) : null}
          {!authConfigured ? (
            <div className="space-y-3 rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Add Supabase environment values before testing sign-in.</p>
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
            <div className="space-y-3 rounded-lg border bg-slate-50 p-4 text-sm">
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
          <Card>
            <CardHeader>
              <CardTitle>Profile Identity</CardTitle>
              <CardDescription>Your current contest-entry flow can use this public username.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border bg-slate-50 px-3 py-3">
                <p className="text-muted-foreground">Username</p>
                <p className="text-lg font-bold">{identity.displayName || identity.username}</p>
              </div>
              {next !== defaultReturnPath ? (
                <Button asChild className="w-full">
                  <Link href={next}>{returnStep.actionLabel}</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card>
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
                  <div className="rounded-lg border bg-slate-50 px-3 py-3 text-sm text-muted-foreground">
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
          <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
            <span>Email verification</span>
            <span className="text-muted-foreground">{identity.isEmailVerified ? 'Verified' : 'Pending'}</span>
          </div>
          {['Age and location review', 'Responsible play controls'].map((label) => (
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
