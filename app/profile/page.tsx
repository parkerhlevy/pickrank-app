import { ArrowRight, CheckCircle2, MapPin, ShieldCheck, UserCircle, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/app/auth/actions';
import { AccountAccessCard } from '@/components/auth/account-access-card';
import { ProfileSetupForm } from '@/components/profile/profile-setup-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HowItWorksButton } from '@/components/ui/how-it-works-button';
import { Notice } from '@/components/ui/notice';
import {
  betaMinimumAgeRequirementMessage,
  defaultReturnPath,
  getReturnStepCopy,
  normalizeReturnPath,
} from '@/lib/auth-profile';
import { legalSupportEmail } from '@/lib/legal';
import { launchMode } from '@/lib/launch-mode';
import { getViewerIdentity } from '@/lib/viewer-identity';

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
  const status = resolvedSearchParams.status;
  const message = resolvedSearchParams.message;
  const identity = await getViewerIdentity();
  const user = identity.isAuthenticated;
  const isAgeBlocked = Boolean(user && identity.eligibility.ageGateStatus === 'blocked');
  const isAccountRestricted = Boolean(
    user &&
      !isAgeBlocked &&
      (identity.eligibility.accountStatus !== 'active' || identity.eligibility.eligibilityStatus === 'blocked'),
  );
  const isAccountUnavailable = isAgeBlocked || isAccountRestricted;
  const needsUsername = Boolean(user && !isAccountUnavailable && !identity.isProfileComplete);
  const needsEligibility = Boolean(user && !isAccountUnavailable && !identity.eligibility.isEligibilityComplete);
  const needsProfileSetup = needsUsername || needsEligibility;
  const todayDateInput = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-black leading-tight">
            {user ? 'Profile' : 'Create your account or sign in'}
          </h1>
          <HowItWorksButton returnTo="/profile" />
        </div>
        {!user ? (
          <p className="text-muted-foreground">
            You need an account to play. After sign-in, finish your Profile, then enter a free contest.
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Need help?{' '}
          <a className="inline-link" href={`mailto:${legalSupportEmail}`}>
            Contact support
          </a>
          .
        </p>
      </section>

      {isAccountUnavailable ? (
        <Card className="section-card border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-700" aria-hidden="true" />
              <CardTitle>Account restricted</CardTitle>
            </div>
            <CardDescription className="text-amber-900">
              {isAgeBlocked
                ? betaMinimumAgeRequirementMessage
                : 'This account is restricted from PickRank use or beta entry.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-amber-950">
            {isAgeBlocked ? (
              <>
                <p>This account cannot enter Early Access Beta while this restriction is active.</p>
                <p>
                  PickRank may route an identified under-18 account for review. The review may result in maintaining
                  the restriction, closing the account, or deleting or de-identifying account data when appropriate.
                  If you or a parent or guardian need support, contact{' '}
                  <a className="inline-link" href={`mailto:${legalSupportEmail}`}>
                    {legalSupportEmail}
                  </a>
                  .
                </p>
              </>
            ) : (
              <p>
                This account cannot enter beta contests while this restriction is active. If this is incorrect,
                contact{' '}
                <a className="inline-link" href={`mailto:${legalSupportEmail}`}>
                  {legalSupportEmail}
                </a>
                .
              </p>
            )}
            <form action={signOut}>
              <Button className="w-full" type="submit" variant="secondary">
                Sign out
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {!user ? <AccountAccessCard message={message} next={next} status={status} surface="profile" /> : null}

      {user && needsProfileSetup ? (
        <Card className="section-card overflow-hidden">
          <CardHeader className="section-card-header">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-300" aria-hidden="true" />
              <CardTitle>Finish your Profile</CardTitle>
            </div>
            <CardDescription className="text-slate-300">
              Complete the missing fields once, then continue to {returnStep.detail}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            {status === 'error' ? (
              <Notice
                variant="warning"
                icon={ShieldCheck}
                title="Profile needs attention"
                description={message || 'Profile setup is not ready yet.'}
                badge="Action needed"
              />
            ) : null}
            <div className="detail-row bg-white text-sm">
              <span>Signed in as {identity.email}</span>
              <span className={identity.isEmailVerified ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'}>
                {identity.isEmailVerified ? 'Verified' : 'Verification pending'}
              </span>
            </div>
            <ProfileSetupForm
              initialDateOfBirth={identity.eligibility.dateOfBirth || ''}
              initialJurisdiction={identity.eligibility.jurisdiction}
              initialPrivacyAccepted={Boolean(identity.eligibility.privacyPolicyAcceptedAt)}
              initialTermsAccepted={Boolean(identity.eligibility.termsAcceptedAt)}
              initialUsername={identity.username}
              needsEligibility={needsEligibility}
              needsUsername={needsUsername}
              next={next}
              todayDateInput={todayDateInput}
            />
            <form action={signOut}>
              <Button className="w-full" type="submit" variant="secondary">
                Sign out
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {user && !isAccountUnavailable && !needsProfileSetup ? (
        <Card className="section-card overflow-hidden">
          <CardHeader className="section-card-header">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-blue-300" aria-hidden="true" />
              <CardTitle>Profile information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {status === 'profile-saved' ? (
              <Notice
                variant="info"
                icon={UserCircle}
                title="Profile saved"
                description="Your Profile has been updated."
                badge="Saved"
              />
            ) : null}
            <div className="section-card-muted flex items-center justify-between gap-3 px-3 py-3 text-sm">
              <div>
                <p className="text-muted-foreground">Username</p>
                <p className="text-lg font-bold">{identity.displayName || identity.username}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            </div>
            <div className="soft-panel space-y-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">Signed in as {identity.email}</p>
                <span className="status-pill-muted">Active</span>
              </div>
              <form action={signOut}>
                <Button className="w-full" type="submit" variant="secondary">
                  Sign out
                </Button>
              </form>
            </div>
          </CardContent>
          <div className="space-y-3 border-t border-slate-200 px-6 py-5 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">Entry status</p>
                <p className="text-muted-foreground">Your required beta-entry details are saved.</p>
              </div>
            </div>
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
              <ReadinessRow
                label="DOB / 18+ check"
                value={identity.eligibility.ageGateStatus === 'confirmed' ? 'Confirmed' : 'Pending'}
              />
              {launchMode.paidPreviewVisible ? (
                <>
                  <ReadinessRow
                    label="Paid-entry status"
                    value={formatEligibilityStatus(identity.eligibility.eligibilityStatus)}
                  />
                  <ReadinessRow
                    label="KYC placeholder"
                    value={formatEligibilityStatus(identity.eligibility.kycStatus)}
                  />
                </>
              ) : null}
            </div>
            <Notice
              variant="success"
              icon={ShieldCheck}
              title="Entry status"
              description="Your entry details are saved."
              badge="Ready"
            />
            {next !== defaultReturnPath ? (
              <Button asChild className="w-full">
                <Link href={next}>{returnStep.actionLabel}</Link>
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {!isAccountUnavailable && launchMode.paidPreviewVisible ? (
        <Card className="section-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <WalletCards className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle>Profile wallet</CardTitle>
            </div>
            <CardDescription>
              Profile keeps the wallet one tap away while {launchMode.betaPassLabel} and future paid balances stay
              separated.
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

function formatEligibilityStatus(value: string) {
  return value
    .split('_')
    .map((segment) => `${segment[0]?.toUpperCase() || ''}${segment.slice(1)}`)
    .join(' ');
}
