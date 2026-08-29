import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getHowItWorksHref } from '@/lib/how-it-works-navigation';
import { cn } from '@/lib/utils';
import { Button } from './button';

type HowItWorksButtonProps = {
  className?: string;
  returnTo?: string;
};

export function HowItWorksButton({ className, returnTo }: HowItWorksButtonProps) {
  return (
    <Button asChild variant="secondary" size="sm" className={cn('shrink-0 gap-2', className)}>
      <Link href={getHowItWorksHref(returnTo)}>
        How it works
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </Button>
  );
}
