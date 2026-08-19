import { ArrowRight, CheckCircle2, MapPin, ShieldCheck, UserCircle, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/app/auth/actions';
import {
  betaMinimumAgeRequirementMessage,
  buildAuthHref,
  defaultReturnPath,
  getProfileIdentity,
  getReturnStepCopy,
  jurisdictionOptions,
  normalizeReturnPath,
} from '@/lib/auth-profile';
import { getMissingBrowserSupabaseKeys, hasBrowserSupabaseConfig } from '@/lib/env';
import { legalSupportEmail } from '@/lib/legal';
import { launchMode } from '@/lib/launch-mode';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { completeEligibilityProfile, completeProfile } from './actions';

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
  const isAgeBlocked = Boolean(user && identity.eligibility.ageGateStatus === 'blocked');
  const isAccountRestricted = Boolean(
    user &&
      !isAgeBlocked &&
      (identity.eligibility.accountStatus !== 'active' || identity.eligibility.eligibilityStatus === 'blocked'),
  );
  const isAccountUnavailable = isAgeBlocked || isAccountRestricted;
  const needsUsername = Boolean(user && !isAccountUnavailable && !identity.isProfileComplete);
  const needsEligibility = Boolean(user && !isAccountUnavailable && !identity.eligibility.isEligibilityComplete);
  const needsAccountSetup = needsUsername || needsEligibility;
  const todayDateInput = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Profile</p>
            <h1 className="text-3xl font-black leading-tight">
              {user ? 'Account settings' : 'Create your PickRank account'}
            </h1>
          </div>
        </div>
        {!user ? (
          <p className="text-muted-foreground">
            Browse contests without signing in. Create an account to enter free beta contests, save your board, and keep your place in the flow.
          </p>
        ) : null}
        <Link href="/how-it-works" className="inline-link inline-flex items-center gap-1">
          How it works
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </section>

      {isAccountUnavailable ? (
        <Card className="section-card border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-700" aria-hidden="true" />
              <CardTitle>Account unavailable</CardTitle>
            </div>
            <CardDescription className="text-amber-900">
              {isAgeBlocked
                ? betaMinimumAgeRequirementMessage
                : 'This account is restricted from PickRank account use or beta entry.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-amber-950">
            <p>
              This account cannot use PickRank or enter beta contests. If this is incorrect, contact{' '}
              <a className="inline-link" href={`mailto:${legalSupportEmail}`}>
                {legalSupportEmail}
              </a>
              .
            </p>
            <form action={signOut}>
              <Button className="w-full" type="submit" variant="secondary">
                Sign out
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {user && needsAccountSetup ? (
        <Card className="section-card overflow-hidden">
          <CardHeader className="section-card-header">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-300" aria-hidden="true" />
              <CardTitle>Finish account setup</CardTitle>
            </div>
            <CardDescription className="text-slate-300">
              Google sign-in verifies your email. PickRank still needs your public username and entry details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5 text-sm">
            <div className="grid gap-2">
              <SetupRow label="Email verified through sign-in" value={identity.isEmailVerified ? 'Complete' : 'Pending'} />
              <SetupRow label="Public username" value={identity.isProfileComplete ? 'Complete' : 'Required'} />
              <SetupRow
                label="DOB, state, Beta Terms, and Privacy"
                value={identity.eligibility.isEligibilityComplete ? 'Captured' : 'Required'}
              />
            </div>
            <Notice
              variant="warning"
              icon={ShieldCheck}
              title="Entry details required"
              description="Google does not provide the date of birth, state, Beta Terms acceptance, or Privacy acceptance PickRank needs before beta contests."
              badge="Action needed"
            />
            {needsUsername ? (
              <Button asChild className="w-full">
                <a href="#profile-identity">Choose username</a>
              </Button>
            ) : null}
            {!needsUsername && needsEligibility ? (
              <Button asChild className="w-full">
                <a href="#eligibility-details">Complete entry details</a>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {next !== defaultReturnPath && !isAccountUnavailable ? (
        <Card className="section-card">
          <CardHeader>
            <CardTitle>One quick step left</CardTitle>
            <CardDescription>
              Finish any missing Profile setup here, then continue to {returnStep.detail}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="detail-row bg-white">
              <span>Signed in</span>
              <span className={user ? 'text-emerald-700' : 'font-medium text-foreground'}>{user ? 'Complete' : 'Required'}</span>
            </div>
            <div className="detail-row">
              <span>Choose public username</span>
              <span className="font-medium text-foreground">{identity.isProfileComplete ? 'Complete' : 'Current'}</span>
            </div>
            <div className="detail-row">
              <span>Complete entry details</span>
              <span>{identity.eligibility.isEligibilityComplete ? 'Complete' : 'Current'}</span>
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
            <CardTitle>{user ? 'Profile information' : 'Account settings'}</CardTitle>
          </div>
          {!user ? (
            <CardDescription className="text-slate-300">
              {launchMode.paidPreviewVisible
                ? 'Create an account or log in to move from contest browsing into entry, board, and wallet views.'
                : 'Create an account or log in to move from contest browsing into entry and board views.'}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {status === 'profile-saved' ? (
            <Notice
              variant="success"
              icon={UserCircle}
              title="Profile saved"
              description="Your PickRank account profile is updated for contest-entry flow."
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
                {next !== defaultReturnPath ? 'Create account or log in to continue' : 'Create account or log in'}
              </Link>
            </Button>
          ) : null}
          {user ? (
            <>
              {identity.isProfileComplete ? (
                <div className="section-card-muted flex items-center justify-between gap-3 px-3 py-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Username</p>
                    <p className="text-lg font-bold">{identity.displayName || identity.username}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                </div>
              ) : null}
              <div className="soft-panel space-y-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-foreground">Signed in as {identity.email}</p>
                  <span className="status-pill-muted">{isAccountUnavailable ? 'Unavailable' : 'Active'}</span>
                </div>
                <form action={signOut}>
                  <Button className="w-full" type="submit" variant="secondary">
                    Sign out
                  </Button>
                </form>
              </div>
            </>
          ) : null}
        </CardContent>
        {user && !isAccountUnavailable ? (
          <div id="eligibility-details" className="space-y-3 border-t border-slate-200 px-6 py-5 text-sm scroll-mt-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">Entry status</p>
                <p className="text-muted-foreground">Complete the details PickRank needs before beta entry.</p>
              </div>
            </div>
            {identity.eligibility.isEligibilityComplete ? (
              <div className="space-y-3">
                <div className="section-card-muted grid gap-3 px-3 py-3 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">State / jurisdiction</p>
                    <p className="font-bold">{identity.eligibility.jurisdiction}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Entry status</p>
                    <p className="font-bold">Ready</p>
                  </div>
                </div>
                <div className="grid gap-2">
                  <ReadinessRow label="DOB / 18+ check" value={identity.eligibility.ageGateStatus === 'confirmed' ? 'Confirmed' : 'Pending'} />
                  {launchMode.paidPreviewVisible ? (
                    <>
                      <ReadinessRow label="Paid-entry status" value={formatEligibilityStatus(identity.eligibility.eligibilityStatus)} />
                      <ReadinessRow label="KYC placeholder" value={formatEligibilityStatus(identity.eligibility.kycStatus)} />
                    </>
                  ) : null}
                </div>
                {identity.eligibility.eligibilityStatus !== 'eligible' ? (
                  <Notice
                    variant="warning"
                    icon={ShieldCheck}
                    title="Entry status"
                    description="Your entry details are saved. Beta Pass has no cash value, no payouts, and no cash prizes."
                    badge="Ready"
                  />
                ) : null}
              </div>
            ) : (
              <form className="space-y-3" action={completeEligibilityProfile}>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>State / jurisdiction</span>
                  <select
                    required
                    name="jurisdiction"
                    defaultValue={identity.eligibility.jurisdiction}
                    className="w-full rounded-lg border bg-slate-50 px-3 py-3 text-base text-foreground outline-none ring-0 transition-[border-color] focus:border-slate-950 sm:text-sm"
                  >
                    <option value="">Choose state</option>
                    {jurisdictionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Date of birth</span>
                  <input
                    required
                    type="date"
                    name="dateOfBirth"
                    max={todayDateInput}
                    defaultValue={identity.eligibility.dateOfBirth || ''}
                    className="w-full rounded-lg border bg-slate-50 px-3 py-3 text-base text-foreground outline-none ring-0 transition-[border-color] focus:border-slate-950 sm:text-sm"
                  />
                  <span className="block text-xs font-normal text-muted-foreground">
                    PickRank uses this to confirm you are at least 18 before beta entry.
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-foreground">
                  <input className="mt-1 h-4 w-4" type="checkbox" name="termsAccepted" />
                  <span>
                    I accept the{' '}
                    <Link className="inline-link" href="/legal/terms">
                      PickRank Beta Terms
                    </Link>{' '}
                    before entering beta contests.
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-foreground">
                  <input className="mt-1 h-4 w-4" type="checkbox" name="privacyPolicyAccepted" />
                  <span>
                    I accept the{' '}
                    <Link className="inline-link" href="/legal/privacy">
                      PickRank Privacy Policy
                    </Link>{' '}
                    before entering beta contests.
                  </span>
                </label>
                <input type="hidden" name="next" value={next} />
                <Button className="w-full" type="submit">
                  Save entry details
                </Button>
              </form>
            )}
            {!identity.isEmailVerified && next !== defaultReturnPath ? (
              <Notice
                variant="warning"
                icon={ShieldCheck}
                title="Verify your email to enter contests"
                description={`After you confirm your email, come back here and continue to ${returnStep.shortLabel.toLowerCase()}.`}
                badge="Pending"
              />
            ) : null}
            {identity.isEmailVerified && next !== defaultReturnPath && identity.eligibility.isEligibilityComplete ? (
              <Button asChild className="w-full">
                <Link href={next}>{returnStep.actionLabel}</Link>
              </Button>
            ) : null}
            {identity.isEmailVerified && next !== defaultReturnPath && !identity.eligibility.isEligibilityComplete ? (
              <Button asChild className="w-full">
                <a href="#eligibility-details">Complete entry details</a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>

      {user && !isAccountUnavailable && !identity.isProfileComplete ? (
          <Card id="profile-identity" className="section-card scroll-mt-6">
            <CardHeader>
              <CardTitle>Complete your profile</CardTitle>
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
                    className="w-full rounded-lg border bg-slate-50 px-3 py-3 text-base text-foreground outline-none ring-0 transition-[border-color] focus:border-slate-950 sm:text-sm"
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
                  Save username
                </Button>
              </form>
            </CardContent>
          </Card>
      ) : null}

      {!isAccountUnavailable ? (
        <>
          {launchMode.paidPreviewVisible ? (
            <Card className="section-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <WalletCards className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle>Account wallet</CardTitle>
                </div>
                <CardDescription>
                  Profile keeps the wallet one tap away while {launchMode.betaPassLabel} and future paid balances stay separated.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="metric-tile">
                    <p className="text-sm text-muted-foreground">{launchMode.betaPassLabel}</p>
                    <p className="numeric text-xl font-bold">Active</p>
                    <p className="mt-1 text-xs text-muted-foreground">Free beta entries. No cash value.</p>
                  </div>
                  <div className="metric-tile">
                    <p className="text-sm text-muted-foreground">Future paid balances</p>
                    <p className="numeric text-xl font-bold">$0.00</p>
                    <p className="mt-1 text-xs text-muted-foreground">Not live during beta.</p>
                  </div>
                </div>
                <div className="detail-row">
                  <span>Wallet route</span>
                  <span className="font-medium text-foreground">Available from Profile</span>
                </div>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/wallet" className="gap-2">
                    View wallet details
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ReadinessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}

function SetupRow({ label, value }: { label: string; value: string }) {
  const isComplete = value === 'Complete' || value === 'Captured';

  return (
    <div className="detail-row bg-white">
      <span>{label}</span>
      <span className={isComplete ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'}>{value}</span>
    </div>
  );
}

function formatEligibilityStatus(value: string) {
  return value
    .split('_')
    .map((segment) => `${segment[0]?.toUpperCase() || ''}${segment.slice(1)}`)
    .join(' ');
}
