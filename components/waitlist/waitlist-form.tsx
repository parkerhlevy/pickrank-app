'use client';

import { useActionState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { joinWaitlistAction } from '@/app/waitlist/actions';
import type { WaitlistActionState } from '@/lib/waitlist';

type WaitlistFormProps = {
  sourcePath?: string;
  utm?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
  variant?: 'hero' | 'section';
};

const initialState: WaitlistActionState = {
  status: 'idle',
};

export function WaitlistForm({ sourcePath = '/', utm = {}, variant = 'section' }: WaitlistFormProps) {
  const [state, formAction, pending] = useActionState(joinWaitlistAction, initialState);
  const inputId = variant === 'hero' ? 'hero-waitlist-email' : 'final-waitlist-email';
  const consentId = `${inputId}-consent`;
  const statusId = `${inputId}-status`;
  const errorId = `${inputId}-error`;
  const consentErrorId = `${inputId}-consent-error`;

  if (state.status === 'success') {
    return (
      <div
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-left text-emerald-950"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-black">You’re on the list.</p>
            <p className="text-sm leading-6">{state.message ?? 'We’ll email you with PickRank launch updates.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3" aria-describedby={statusId}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="sr-only" htmlFor={inputId}>
          Email address
        </label>
        <input
          id={inputId}
          required
          type="email"
          name="email"
          maxLength={254}
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={state.fieldErrors?.email ? 'true' : 'false'}
          aria-describedby={state.fieldErrors?.email ? `${statusId} ${errorId}` : statusId}
          className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
        />
        <Button type="submit" size="lg" className="text-sm font-bold" disabled={pending}>
          {pending ? 'Joining...' : 'Join the waitlist'}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <input type="hidden" name="sourcePath" value={sourcePath} />
      <input type="hidden" name="utm_source" value={utm.utm_source ?? ''} />
      <input type="hidden" name="utm_medium" value={utm.utm_medium ?? ''} />
      <input type="hidden" name="utm_campaign" value={utm.utm_campaign ?? ''} />
      <input type="hidden" name="utm_content" value={utm.utm_content ?? ''} />
      <input type="hidden" name="utm_term" value={utm.utm_term ?? ''} />
      <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
        Company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      <p id={statusId} className={variant === 'hero' ? 'text-sm leading-6 text-slate-200' : 'text-sm leading-6 text-muted-foreground'}>
        Enter your email and we’ll send launch updates before account signup opens.
      </p>
      <label
        htmlFor={consentId}
        className={
          variant === 'hero'
            ? 'flex items-start gap-2 text-xs leading-5 text-slate-300'
            : 'flex items-start gap-2 text-xs leading-5 text-muted-foreground'
        }
      >
        <input
          id={consentId}
          required
          type="checkbox"
          name="consent"
          aria-invalid={state.fieldErrors?.consent ? 'true' : 'false'}
          aria-describedby={state.fieldErrors?.consent ? consentErrorId : undefined}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600"
        />
        <span>I agree to receive PickRank launch and product update emails. I can unsubscribe anytime.</span>
      </label>
      {state.fieldErrors?.email ? (
        <p id={errorId} className="text-sm font-medium text-red-600" role="alert">
          {state.fieldErrors.email}
        </p>
      ) : null}
      {state.fieldErrors?.consent ? (
        <p id={consentErrorId} className="text-sm font-medium text-red-600" role="alert">
          {state.fieldErrors.consent}
        </p>
      ) : null}
      {state.status === 'error' && !state.fieldErrors?.email ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
