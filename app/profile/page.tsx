import { ArrowRight, CheckCircle2, MapPin, ShieldCheck, UserCircle, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/app/auth/actions';
import {
  buildAuthHref,
  defaultReturnPath,
  getProfileIdentity,
  getReturnStepCopy,
  jurisdictionOptions,
  normalizeReturnPath,
} from '@/lib/auth-profile';
import { getMissingBrowserSupabaseKeys, hasBrowserSupabaseConfig } from '@/lib/env';
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
  const needsUsername = Boolean(user && !identity.isProfileComplete);
  const needsEligibility = Boolean(user && !identity.eligibility.isEligibilityComplete);
  const needsAccountSetup = needsUsername || needsEligibility;
  const todayDateInput = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Profile</p>
            <h1 className="text-3xl font-black leading-tight">
              {user ? 'PickRank Account' : 'Create Your PickRank Account'}
            </h1>
          </div>
        </div>
        <p className="text-muted-foreground">
          {user
            ? 'Your profile connects public contest identity, beta entry readiness, and wallet access in one account surface.'
            : 'Browse contests without signing in. Create an account to enter free beta contests, save your board, and keep your place in the flow.'}
        </p>
      </section>

      {user && needsAccountSetup ? (
        <Card className="section-card overflow-hidden">
          <CardHeader className="section-card-header">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-300" aria-hidden="true" />
              <CardTitle>Finish Account Setup</CardTitle>
            </div>
            <CardDescription className="text-slate-300">
              Google sign-in verifies your email. PickRank still needs your contest identity and beta acknowledgements.
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
              title="Beta acknowledgements required"
              description="Google does not provide the date of birth, state, Beta Terms acceptance, or Privacy acceptance PickRank needs before beta contests."
              badge="Action needed"
            />
            {needsUsername ? (
              <Button asChild className="w-full">
                <a href="#profile-identity">Choose Username</a>
              </Button>
            ) : null}
            {!needsUsername && needsEligibility ? (
              <Button asChild className="w-full">
                <a href="#eligibility-details">Complete Beta Acknowledgements</a>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {next !== defaultReturnPath ? (
        <Card className="section-card">
          <CardHeader>
            <CardTitle>One Quick Step Left</CardTitle>
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
              <span>Capture beta acknowledgements</span>
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
            <CardTitle>{user ? 'Account Session' : 'Account Access'}</CardTitle>
          </div>
            <CardDescription className="text-slate-300">
              {user
              ? 'Your PickRank session is active for profile, board, and wallet surfaces.'
              : 'Create an account or log in to move from contest browsing into entry, board, and wallet views.'}
            </CardDescription>
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
                {next !== defaultReturnPath ? 'Create Account or Log In to Continue' : 'Create Account or Log In'}
              </Link>
            </Button>
          ) : null}
          {user ? (
            <div className="soft-panel space-y-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">Signed in as {identity.email}</p>
                <span className="status-pill-muted">Active</span>
              </div>
              <form action={signOut}>
                <Button className="w-full" type="submit" variant="secondary">
                  Sign Out
                </Button>
              </form>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {user ? (
        <Card id="eligibility-details" className="section-card scroll-mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle>Beta Entry Readiness</CardTitle>
            </div>
            <CardDescription>
              Complete the secondary PickRank check that Google sign-in does not provide.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {identity.eligibility.isEligibilityComplete ? (
              <div className="space-y-3">
                <div className="section-card-muted grid gap-3 px-3 py-3 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">State / jurisdiction</p>
                    <p className="font-bold">{identity.eligibility.jurisdiction}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Paid-entry status</p>
                    <p className="font-bold">{formatEligibilityStatus(identity.eligibility.eligibilityStatus)}</p>
                  </div>
                </div>
                <div className="grid gap-2">
                  <ReadinessRow label="DOB / 13+ check" value={identity.eligibility.ageGateStatus === 'confirmed' ? 'Confirmed' : 'Pending'} />
                  <ReadinessRow label="Terms accepted" value={identity.eligibility.termsAcceptedAt ? 'Captured' : 'Pending'} />
                  <ReadinessRow label="Privacy accepted" value={identity.eligibility.privacyPolicyAcceptedAt ? 'Captured' : 'Pending'} />
                  <ReadinessRow label="KYC placeholder" value={formatEligibilityStatus(identity.eligibility.kycStatus)} />
                  <ReadinessRow label="Responsible play status" value={formatEligibilityStatus(identity.eligibility.selfExclusionStatus)} />
                </div>
                {identity.eligibility.eligibilityStatus !== 'eligible' ? (
                  <Notice
                    variant="warning"
                    icon={ShieldCheck}
                    title="Beta entry ready. Paid entry still pending."
                    description="Your beta acknowledgements are saved. Paid contests stay blocked until legal, provider, payment, withdrawal, and compliance gates are complete."
                    badge="Pending"
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
                    PickRank uses this to confirm you are at least 13 before beta entry.
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
                  Save Beta Acknowledgements
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      ) : null}

      {user ? (
        identity.isProfileComplete ? (
          <Card className="section-card">
            <CardHeader>
              <CardTitle>Contest Identity</CardTitle>
              <CardDescription>This public username is what PickRank can show in contest and results surfaces.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="section-card-muted flex items-center justify-between gap-3 px-3 py-3">
                <div>
                  <p className="text-muted-foreground">Public username</p>
                  <p className="text-lg font-bold">{identity.displayName || identity.username}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
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
              {identity.isEmailVerified && next !== defaultReturnPath && identity.eligibility.isEligibilityComplete ? (
                <Button asChild className="w-full">
                  <Link href={next}>{returnStep.actionLabel}</Link>
                </Button>
              ) : null}
              {identity.isEmailVerified && next !== defaultReturnPath && !identity.eligibility.isEligibilityComplete ? (
                <Button asChild className="w-full">
                  <a href="#eligibility-details">Complete Beta Acknowledgements</a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card id="profile-identity" className="section-card scroll-mt-6">
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
            <CardTitle>Account Wallet</CardTitle>
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
              <p className="text-sm text-muted-foreground">Future Paid Balances</p>
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
              View Wallet Details
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Entry Readiness</CardTitle>
          </div>
          <CardDescription>
            These checks show what PickRank needs before beta entry and future paid wallet actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="detail-row">
            <span>Email verification</span>
            <span className="text-muted-foreground">{identity.isEmailVerified ? 'Verified' : 'Pending'}</span>
          </div>
          <ReadinessRow
            label="Age and location capture"
            value={identity.eligibility.isEligibilityComplete ? 'Captured' : 'Needed before beta entry'}
          />
          <ReadinessRow
            label="Eligibility status"
            value={formatEligibilityStatus(identity.eligibility.eligibilityStatus)}
          />
          <ReadinessRow
            label="Responsible play controls"
            value={formatEligibilityStatus(identity.eligibility.selfExclusionStatus)}
          />
          <ReadinessRow label="Withdrawal verification" value="Provider review needed" />
        </CardContent>
      </Card>
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
