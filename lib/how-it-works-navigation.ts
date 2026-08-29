type HowItWorksReturn = {
  href: string;
  label: string;
};

const exactReturnLabels = new Map<string, string>([
  ['/', 'Home'],
  ['/auth', 'Account access'],
  ['/contests', 'Contests'],
  ['/legal/beta-rules', 'Beta Rules'],
  ['/profile', 'Profile'],
  ['/wallet', 'Beta Pass'],
]);
const boardBuilderReturnPattern = /^\/contests\/[^/]+\/lineup$/;
const contestDetailReturnPattern = /^\/contests\/[^/]+$/;

export function getHowItWorksHref(returnTo?: string) {
  if (!returnTo) {
    return '/how-it-works';
  }

  return `/how-it-works?${new URLSearchParams({ returnTo }).toString()}`;
}

export function getHowItWorksReturn(value: string | null | undefined): HowItWorksReturn | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('?') || value.includes('#')) {
    return null;
  }

  const exactLabel = exactReturnLabels.get(value);

  if (exactLabel) {
    return {
      href: value,
      label: exactLabel,
    };
  }

  if (boardBuilderReturnPattern.test(value)) {
    return {
      href: value,
      label: 'Board builder',
    };
  }

  if (contestDetailReturnPattern.test(value)) {
    return {
      href: value,
      label: 'Contest details',
    };
  }

  return null;
}
