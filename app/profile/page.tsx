import { ShieldCheck, UserCircle, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildAuthHref, defaultReturnPath, getProfileIdentity, normalizeReturnPath } from '@/lib/auth-profile';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
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
  const authConfigured = hasBrowserSupabaseConfig();
  const supabase = authConfigured ? await createClient() : null;
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const profileIdentity = getProfileIdentity(user);
  const status = resolvedSearchParams.status;
  const message = resolvedSearchParams.message;

  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Profile</p>
            <h1 className="text-3xl font-black leading-tight">Account Preview</h1>
          </div>
        </div>
        <p className="text-muted-foreground">
          Complete the minimum account identity step here before contest-entry flows expand further.
        </p>
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-950 text-white">
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-blue-300" aria-hidden="true" />
            <CardTitle>{user ? 'Signed-In Session' : 'Signed-Out State'}</CardTitle>
          </div>
          <CardDescription className="text-slate-300">
            {user ? 'Supabase returned an authenticated user for this session.' : 'Sign in before using Profile or contest-entry actions.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {!user ? (
            <>
              <div className="rounded-lg border bg-slate-50 px-3 py-3 text-sm text-foreground">
                Create an account or log in to continue to Profile and contest entry.
              </div>
              {!authConfigured ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                  Add Supabase environment values before testing sign-in.
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-lg border bg-slate-50 px-3 py-3 text-sm text-foreground">
              Signed in as <span className="font-medium">{profileIdentity.email || 'authenticated user'}</span>
            </div>
          )}
          <Button asChild className="w-full">
            <Link href={buildAuthHref(next)}>{user ? 'Manage Auth Session' : 'Go to Auth Preview'}</Link>
          </Button>
        </CardContent>
      </Card>

      {user ? (
        <Card>
          <CardHeader>
            <CardTitle>{profileIdentity.isProfileComplete ? 'Profile Identity' : 'Complete Your Profile'}</CardTitle>
            <CardDescription>
              {profileIdentity.isProfileComplete
                ? 'Your current contest-entry flow can use this public username.'
                : 'Add a public username before returning to contest entry.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'profile-saved' ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-950">
                Username saved.
              </div>
            ) : null}
            {status === 'error' ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                {message || 'Unable to save your profile right now.'}
              </div>
            ) : null}
            {profileIdentity.isProfileComplete ? (
              <div className="space-y-3">
                <div className="rounded-lg border bg-slate-50 px-3 py-3 text-sm">
                  <p className="text-muted-foreground">Username</p>
                  <p className="font-semibold">{profileIdentity.username}</p>
                </div>
                {next !== defaultReturnPath ? (
                  <Button asChild className="w-full">
                    <Link href={next}>Continue to Contest Entry</Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              <form action={completeProfile} className="space-y-3">
                <input type="hidden" name="next" value={next} />
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Username</span>
                  <input
                    required
                    type="text"
                    name="username"
                    placeholder="rankbuilder"
                    className="w-full rounded-lg border bg-slate-50 px-3 py-3 text-sm text-foreground outline-none ring-0 transition focus:border-slate-950"
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  Use 3-20 lowercase letters, numbers, or underscores. This is the public name shown for your account.
                </p>
                <Button type="submit" className="w-full">
                  Save Username
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
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
          {[
            {
              label: 'Email verification',
              value: user ? (profileIdentity.emailVerified ? 'Verified' : 'Pending') : 'Sign in required',
            },
            {
              label: 'Age and location review',
              value: 'Not wired',
            },
            {
              label: 'Responsible play controls',
              value: 'Not wired',
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
              <span>{row.label}</span>
              <span className="text-muted-foreground">{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
