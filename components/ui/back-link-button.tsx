import Link, { type LinkProps } from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './button';

type BackLinkButtonProps = {
  children: ReactNode;
  href: LinkProps['href'];
  transitionTypes?: string[];
};

export function BackLinkButton({ children, href, transitionTypes }: BackLinkButtonProps) {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="justify-start border border-white/20 bg-white/10 text-white shadow-sm hover:bg-white/15 hover:text-white focus-visible:outline-white"
    >
      <Link href={href} transitionTypes={transitionTypes}>
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        {children}
      </Link>
    </Button>
  );
}
