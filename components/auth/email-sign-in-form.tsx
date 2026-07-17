import { Button } from '@/components/ui/button';

export function EmailSignInForm({
  action,
  next,
}: {
  action: (formData: FormData) => Promise<void>;
  next: string;
}) {
  return (
    <form className="space-y-3" action={action}>
      <label className="block space-y-2 text-sm font-medium text-foreground">
        <span>Email address</span>
        <input
          required
          type="email"
          name="email"
          placeholder="you@example.com"
          className="w-full rounded-lg border bg-slate-50 px-3 py-3 text-base text-foreground outline-none ring-0 transition-[border-color] focus:border-slate-950 sm:text-sm"
        />
      </label>
      <input type="hidden" name="next" value={next} />
      <Button className="w-full" type="submit">
        Email Me a Sign-In Link
      </Button>
    </form>
  );
}
