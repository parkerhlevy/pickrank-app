'use client';

import Link from 'next/link';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { completeProfileSetup, type ProfileSetupActionState } from '@/app/profile/actions';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { jurisdictionOptions } from '@/lib/auth-profile';
import { cn } from '@/lib/utils';

const initialActionState: ProfileSetupActionState = { status: 'idle' };

type ProfileSetupFormProps = {
  initialDateOfBirth: string;
  initialJurisdiction: string;
  initialPrivacyAccepted: boolean;
  initialTermsAccepted: boolean;
  initialUsername: string;
  needsEligibility: boolean;
  needsUsername: boolean;
  next: string;
  todayDateInput: string;
};

export function ProfileSetupForm({
  initialDateOfBirth,
  initialJurisdiction,
  initialPrivacyAccepted,
  initialTermsAccepted,
  initialUsername,
  needsEligibility,
  needsUsername,
  next,
  todayDateInput,
}: ProfileSetupFormProps) {
  const [state, formAction] = useActionState(completeProfileSetup, initialActionState);
  const [username, setUsername] = useState(initialUsername);
  const [jurisdiction, setJurisdiction] = useState(initialJurisdiction);
  const [dateOfBirth, setDateOfBirth] = useState(initialDateOfBirth);
  const [termsAccepted, setTermsAccepted] = useState(initialTermsAccepted);
  const [privacyAccepted, setPrivacyAccepted] = useState(initialPrivacyAccepted);
  const errors = state.fieldErrors || {};

  return (
    <form className="space-y-5" action={formAction} noValidate>
      {state.status === 'error' && state.message ? (
        <div role="alert" aria-live="polite">
          <Notice
            variant="error"
            icon={AlertTriangle}
            title="Profile needs attention"
            description={state.message}
            badge="Check the form"
          />
        </div>
      ) : null}

      {needsUsername ? (
        <fieldset className="space-y-3">
          <legend className="font-semibold text-foreground">Public Profile</legend>
          <label className="block space-y-2 text-sm font-medium text-foreground">
            <span>Username</span>
            <input
              required
              type="text"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="pickrank_user"
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? 'username-error username-help' : 'username-help'}
              className={cn(
                'w-full rounded-lg border bg-slate-50 px-3 py-3 text-base text-foreground outline-none ring-0 transition-[border-color] focus:border-slate-950 sm:text-sm',
                errors.username && 'border-red-400 bg-red-50 focus:border-red-600',
              )}
            />
          </label>
          <p id="username-help" className="text-sm text-muted-foreground">
            Use 3-20 lowercase letters, numbers, or underscores. This is your public PickRank name.
          </p>
          <FieldError id="username-error" message={errors.username} />
        </fieldset>
      ) : null}

      {needsEligibility ? (
        <fieldset className="space-y-4 border-t border-slate-200 pt-5">
          <legend className="font-semibold text-foreground">Entry details</legend>
          <label className="block space-y-2 text-sm font-medium text-foreground">
            <span>State / jurisdiction</span>
            <select
              required
              name="jurisdiction"
              value={jurisdiction}
              onChange={(event) => setJurisdiction(event.target.value)}
              aria-invalid={Boolean(errors.jurisdiction)}
              aria-describedby={
                errors.jurisdiction
                  ? 'jurisdiction-error jurisdiction-purpose'
                  : 'jurisdiction-purpose'
              }
              className={cn(
                'w-full rounded-lg border bg-slate-50 px-3 py-3 text-base text-foreground outline-none ring-0 transition-[border-color] focus:border-slate-950 sm:text-sm',
                errors.jurisdiction && 'border-red-400 bg-red-50 focus:border-red-600',
              )}
            >
              <option value="">Choose state</option>
              {jurisdictionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span
              id="jurisdiction-purpose"
              className="flex items-start gap-2 rounded-md bg-slate-50 px-3 py-2.5 text-xs font-normal leading-5 text-muted-foreground"
            >
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>PickRank uses your state to determine which contest rules apply to you.</span>
            </span>
          </label>
          <FieldError id="jurisdiction-error" message={errors.jurisdiction} />

          <label className="block space-y-2 text-sm font-medium text-foreground">
            <span>Date of birth</span>
            <input
              required
              type="date"
              name="dateOfBirth"
              max={todayDateInput}
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
              aria-invalid={Boolean(errors.dateOfBirth)}
              aria-describedby={errors.dateOfBirth ? 'date-of-birth-error date-of-birth-help' : 'date-of-birth-help'}
              className={cn(
                'w-full rounded-lg border bg-slate-50 px-3 py-3 text-base text-foreground outline-none ring-0 transition-[border-color] focus:border-slate-950 sm:text-sm',
                errors.dateOfBirth && 'border-red-400 bg-red-50 focus:border-red-600',
              )}
            />
            <span id="date-of-birth-help" className="block text-xs font-normal text-muted-foreground">
              PickRank uses this to confirm you are at least 18 before beta entry.
            </span>
          </label>
          <FieldError id="date-of-birth-error" message={errors.dateOfBirth} />

          <AcknowledgementField
            checked={termsAccepted}
            error={errors.termsAccepted}
            errorId="terms-error"
            name="termsAccepted"
            onChange={setTermsAccepted}
          >
            I accept the{' '}
            <Link className="inline-link" href="/legal/terms" target="_blank" rel="noopener noreferrer">
              PickRank Beta Terms
              <span className="sr-only"> (opens in a new tab)</span>
            </Link>{' '}
            before entering beta contests.
          </AcknowledgementField>

          <AcknowledgementField
            checked={privacyAccepted}
            error={errors.privacyPolicyAccepted}
            errorId="privacy-error"
            name="privacyPolicyAccepted"
            onChange={setPrivacyAccepted}
          >
            I accept the{' '}
            <Link className="inline-link" href="/legal/privacy" target="_blank" rel="noopener noreferrer">
              PickRank Privacy Policy
              <span className="sr-only"> (opens in a new tab)</span>
            </Link>{' '}
            before entering beta contests.
          </AcknowledgementField>
        </fieldset>
      ) : null}

      <input type="hidden" name="next" value={next} />
      <SubmitButton />
    </form>
  );
}

function AcknowledgementField({
  checked,
  children,
  error,
  errorId,
  name,
  onChange,
}: {
  checked: boolean;
  children: React.ReactNode;
  error?: string;
  errorId: string;
  name: 'termsAccepted' | 'privacyPolicyAccepted';
  onChange: (checked: boolean) => void;
}) {
  return (
    <div>
      <label
        className={cn(
          'flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-foreground',
          error && 'border-red-400 bg-red-50',
        )}
      >
        <input
          className="mt-1 h-4 w-4"
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <span>{children}</span>
      </label>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="mt-1 text-sm font-medium text-red-700">
      {message}
    </p>
  ) : null;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? 'Saving Profile...' : 'Complete Profile'}
    </Button>
  );
}
