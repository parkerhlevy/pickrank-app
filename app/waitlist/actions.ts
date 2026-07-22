'use server';

import { joinWaitlist, type WaitlistActionState } from '@/lib/waitlist';

export async function joinWaitlistAction(
  _previousState: WaitlistActionState,
  formData: FormData,
): Promise<WaitlistActionState> {
  return joinWaitlist({
    email: formData.get('email'),
    consent: formData.get('consent'),
    sourcePath: formData.get('sourcePath'),
    honeypot: formData.get('company'),
    utm_source: formData.get('utm_source'),
    utm_medium: formData.get('utm_medium'),
    utm_campaign: formData.get('utm_campaign'),
    utm_content: formData.get('utm_content'),
    utm_term: formData.get('utm_term'),
  });
}
