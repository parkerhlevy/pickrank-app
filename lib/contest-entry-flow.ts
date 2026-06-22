export const contestEntryStages = ['not-entered', 'payment-review', 'entered', 'lineup'] as const;
export const contestEntryCookieName = 'pickrank_demo_entry_state';

export type ContestEntryStage = (typeof contestEntryStages)[number];
export type ContestEntryRoute = 'detail' | 'payment' | 'success' | 'lineup';

type ContestEntryStateCopy = {
  badge: string;
  title: string;
  description: string;
};

const routeStageMap: Record<ContestEntryRoute, ContestEntryStage> = {
  detail: 'not-entered',
  payment: 'payment-review',
  success: 'entered',
  lineup: 'lineup',
};

const stageCopyMap: Record<ContestEntryStage, ContestEntryStateCopy> = {
  'not-entered': {
    badge: 'Not Entered',
    title: 'Start your single-entry flow',
    description: 'Review the contest first, then move into payment review before any confirmed entry or lineup access.',
  },
  'payment-review': {
    badge: 'Payment Review',
    title: 'Finish the review step',
    description: 'This stage previews how the single entry would be funded before the success handoff and lineup builder.',
  },
  entered: {
    badge: 'Entered',
    title: 'Entry confirmed state',
    description: 'This is the handoff moment after payment review. The next step is the separate Build Your Lineup screen.',
  },
  lineup: {
    badge: 'Lineup Stage',
    title: 'Ready to edit your lineup',
    description: 'The contest detail page now treats lineup work as its own stage instead of an inline extension of contest entry.',
  },
};

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
  hasEntry,
  isContestOpen,
  isAuthenticated,
  isProfileComplete,
}: {
  contestId: string;
  hasEntry: boolean;
  isContestOpen: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
}) {
  if (hasEntry && isAuthenticated) {
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

  if (!isAuthenticated) {
    return {
      label: 'Sign Up / Log In to Enter',
      href: null,
      disabled: false,
    };
  }

  if (!isProfileComplete) {
    return {
      label: 'Complete Profile to Enter',
      href: null,
      disabled: false,
    };
  }

  if (isContestOpen) {
    return {
      label: 'Enter Contest - Review Payment',
      href: getContestEntryProgressHref(contestId, 'payment-review'),
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

  return [
    { key: 'not-entered', label: 'Contest Detail', hrefStage: 'not-entered' },
    { key: 'payment-review', label: 'Payment Review', hrefStage: 'payment-review' },
    { key: 'entered', label: 'Entry Success', hrefStage: 'entered' },
    { key: 'lineup', label: 'Build Your Lineup', hrefStage: 'lineup' },
  ].map((step) => {
    const stepIndex = contestEntryStages.indexOf(step.hrefStage as ContestEntryStage);

    return {
      ...step,
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
