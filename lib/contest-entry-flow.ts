import { buildAuthHref, buildProfileHref } from '@/lib/auth-profile';

export const contestEntryStages = ['not-entered', 'payment-review', 'entered', 'lineup'] as const;
export const contestEntryCookieName = 'pickrank_demo_entry_state';

export type ContestEntryStage = (typeof contestEntryStages)[number];
export type ContestEntryRoute = 'detail' | 'payment' | 'success' | 'lineup';

type ContestEntryStateCopy = {
  badge: string;
  title: string;
  description: string;
};

type ContestEntryStepCopy = {
  key: ContestEntryStage;
  label: string;
  summary: string;
};

const routeStageMap: Record<ContestEntryRoute, ContestEntryStage> = {
  detail: 'not-entered',
  payment: 'payment-review',
  success: 'entered',
  lineup: 'lineup',
};

const stageCopyMap: Record<ContestEntryStage, ContestEntryStateCopy> = {
  'not-entered': {
    badge: 'Step 1 of 4',
    title: 'Review the contest before you enter',
    description: 'Check the contest details, review your payment, then build your lineup before lock.',
  },
  'payment-review': {
    badge: 'Step 2 of 4',
    title: 'Review your entry before you confirm',
    description: 'Check your fee breakdown, then confirm your entry and head to your lineup.',
  },
  entered: {
    badge: 'Step 3 of 4',
    title: "You're in",
    description: 'Your entry is confirmed. Next up: Build Your Lineup before lock.',
  },
  lineup: {
    badge: 'Step 4 of 4',
    title: 'Build Your Lineup',
    description: 'Rank your players and save changes until the contest locks.',
  },
};

const contestEntryStepCopy: ContestEntryStepCopy[] = [
  {
    key: 'not-entered',
    label: 'Contest Detail',
    summary: 'Check the contest details, lock time, and payout overview before you enter.',
  },
  {
    key: 'payment-review',
    label: 'Payment Review',
    summary: 'Review your entry fee, applied balances, and amount due today.',
  },
  {
    key: 'entered',
    label: 'Entry Success',
    summary: 'See your confirmed entry and head straight into your lineup.',
  },
  {
    key: 'lineup',
    label: 'Build Your Lineup',
    summary: 'Rank your players and save your order until lock.',
  },
];

export function getContestEntryStage(
  entryParam: string | string[] | undefined,
  fallbackStage: ContestEntryStage,
): ContestEntryStage {
  const value = Array.isArray(entryParam) ? entryParam[0] : entryParam;

  if (value && contestEntryStages.includes(value as ContestEntryStage)) {
    return value as ContestEntryStage;
  }

  return fallbackStage;
}

export function getContestEntryStateCopy(stage: ContestEntryStage) {
  return stageCopyMap[stage];
}

export function getContestEntryHref(contestId: string, stage: ContestEntryStage) {
  const basePath = `/contests/${contestId}`;

  switch (stage) {
    case 'not-entered':
      return basePath;
    case 'payment-review':
      return `${basePath}/payment`;
    case 'entered':
      return `${basePath}/success`;
    case 'lineup':
      return `${basePath}/lineup`;
  }
}

export function getContestEntryProgressHref(contestId: string, stage: ContestEntryStage) {
  return `/contests/${contestId}/progress?stage=${stage}`;
}

export function getPersistedContestEntryStage(
  contestId: string,
  cookieValue: string | undefined,
): ContestEntryStage {
  if (!cookieValue) {
    return 'not-entered';
  }

  try {
    const parsedValue = JSON.parse(cookieValue) as Record<string, unknown>;
    const storedStage = parsedValue[contestId];

    if (typeof storedStage === 'string' && contestEntryStages.includes(storedStage as ContestEntryStage)) {
      return storedStage as ContestEntryStage;
    }
  } catch {
    return 'not-entered';
  }

  return 'not-entered';
}

export function getUpdatedContestEntryCookieValue({
  contestId,
  currentCookieValue,
  stage,
}: {
  contestId: string;
  currentCookieValue: string | undefined;
  stage: ContestEntryStage;
}) {
  let parsedValue: Record<string, ContestEntryStage> = {};

  if (currentCookieValue) {
    try {
      const existingValue = JSON.parse(currentCookieValue) as Record<string, unknown>;

      parsedValue = Object.fromEntries(
        Object.entries(existingValue).filter(([, value]) => typeof value === 'string' && contestEntryStages.includes(value as ContestEntryStage)),
      ) as Record<string, ContestEntryStage>;
    } catch {
      parsedValue = {};
    }
  }

  parsedValue[contestId] = stage;

  return JSON.stringify(parsedValue);
}

export function getContestDetailPrimaryAction({
  contestId,
  entryFee,
  hasEntry,
  isAuthenticated,
  isContestOpen,
  isProfileComplete,
}: {
  contestId: string;
  entryFee: string;
  hasEntry: boolean;
  isAuthenticated: boolean;
  isContestOpen: boolean;
  isProfileComplete: boolean;
}) {
  if (hasEntry) {
    return {
      label: isContestOpen ? 'Edit Lineup' : 'View Lineup',
      href: getContestEntryProgressHref(contestId, 'lineup'),
      disabled: false,
    };
  }

  if (!isContestOpen) {
    return {
      label: 'Contest Locked',
      href: null,
      disabled: true,
    };
  }

  const next = getContestEntryProgressHref(contestId, 'payment-review');

  if (!isAuthenticated) {
    return {
      label: 'Sign Up / Log In to Enter',
      href: buildAuthHref(next),
      disabled: false,
    };
  }

  if (!isProfileComplete) {
    return {
      label: 'Complete Profile to Enter',
      href: buildProfileHref(next),
      disabled: false,
    };
  }

  if (isContestOpen) {
    return {
      label: `Enter Contest - ${entryFee}`,
      href: next,
      disabled: false,
    };
  }

  return {
    label: 'Contest Locked',
    href: null,
    disabled: true,
  };
}

export function getContestEntrySteps(stage: ContestEntryStage) {
  const currentStageIndex = contestEntryStages.indexOf(stage);

  return contestEntryStepCopy.map((step, index) => {
    const stepIndex = contestEntryStages.indexOf(step.key);

    return {
      ...step,
      stepNumber: index + 1,
      status: stepIndex < currentStageIndex ? 'complete' : stepIndex === currentStageIndex ? 'current' : 'upcoming',
    };
  });
}

export function getContestEntryRouteState({
  contestId,
  persistedStage,
  route,
}: {
  contestId: string;
  persistedStage: ContestEntryStage;
  route: ContestEntryRoute;
}) {
  const fallbackStage = routeStageMap[route];
  const stage = persistedStage;
  const shouldRedirect = route !== 'detail' && stage !== fallbackStage;

  return {
    stage,
    shouldRedirect,
    redirectHref: shouldRedirect ? getContestEntryHref(contestId, stage) : null,
  };
}
