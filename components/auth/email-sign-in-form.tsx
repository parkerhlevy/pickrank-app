'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? 'Sending Link...' : 'Email Me a Sign-In Link'}
    </Button>
  );
}

export function EmailSignInForm({
  action,
  next,
}: {
  action: (formData: FormData) => Promise<void>;
  next: string;
}) {
  return (
    <form action={action} className="space-y-3">
      <label className="block space-y-2 text-sm font-medium text-foreground">
        <span>Email address</span>
        <input
          required
          type="email"
          name="email"
          placeholder="you@example.com"
          className="w-full rounded-lg border bg-slate-50 px-3 py-3 text-sm text-foreground outline-none ring-0 transition focus:border-slate-950"
        />
      </label>
      <input type="hidden" name="next" value={next} />
      <SubmitButton />
    </form>
  );
}
