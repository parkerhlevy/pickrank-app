import {
  buildAuthHref,
  buildProfileHref,
  eligibilityToEnterContestsMessage,
  type EligibilityStatus,
  verifyEmailToEnterContestsMessage,
} from '@/lib/auth-profile';
import { getEntryReviewLabel, isBetaFreeEntryContest, launchMode } from '@/lib/launch-mode';

export const contestEntryStages = ['not-entered', 'payment-review', 'entered', 'lineup'] as const;
export const contestEntryCookieName = 'pickrank_demo_entry_state';

export type ContestEntryStage = (typeof contestEntryStages)[number];
export type ContestEntryRoute = 'detail' | 'payment' | 'success' | 'lineup';

type ContestEntryStateCopy = {
  badge: string;
  stepLabel: string;
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
    stepLabel: 'Step 1: Contest detail',
    title: 'Review the contest before you enter',
    description: 'Check the contest details, review your beta entry, then build your board before lock.',
  },
  'payment-review': {
    badge: 'Step 2 of 4',
    stepLabel: 'Step 2: Entry review',
    title: 'Review your beta entry before you confirm',
    description: 'Confirm your Beta Pass entry, then head to your board.',
  },
  entered: {
    badge: 'Step 3 of 4',
    stepLabel: 'Step 3: Entry success',
    title: "You're in",
    description: 'Your entry is confirmed. Next up: build your board before lock.',
  },
  lineup: {
    badge: 'Step 4 of 4',
    stepLabel: 'Step 4: Build your board',
    title: 'Build your board',
    description: 'Rank your players and save your board until the contest locks.',
  },
};

const directEntryLineupStateCopy: ContestEntryStateCopy = {
  badge: 'Step 2 of 2',
  stepLabel: 'Step 2: Build your board',
  title: 'Build your board',
  description: 'Your free beta entry is confirmed. Rank your players and save your board until the contest locks.',
};

const contestEntryStepCopy: ContestEntryStepCopy[] = [
  {
    key: 'not-entered',
    label: 'Contest detail',
    summary: 'Check the contest details, lock time, and beta results overview before you enter.',
  },
  {
    key: 'payment-review',
    label: getEntryReviewLabel(),
    summary: 'Review your free beta entry and Beta Pass status.',
  },
  {
    key: 'entered',
    label: 'Entry success',
    summary: 'See your confirmed entry and head straight into your board.',
  },
  {
    key: 'lineup',
    label: 'Build your board',
    summary: 'Rank your players and save your board until lock.',
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

export function getContestEntryStateCopy(
  stage: ContestEntryStage,
  { usesDirectEntryFlow = false }: { usesDirectEntryFlow?: boolean } = {},
) {
  if (usesDirectEntryFlow && stage === 'lineup') {
    return directEntryLineupStateCopy;
  }

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
  entryFeeCents,
  hasEntry,
  isAuthenticated,
  isContestOpen,
  isProfileComplete,
  isEmailVerified,
  isEligibilityComplete = true,
  isEligibleForPaidEntry = true,
  eligibilityStatus = 'eligible',
  contestStatus = 'open',
}: {
  contestId: string;
  entryFee: string;
  entryFeeCents?: number;
  hasEntry: boolean;
  isAuthenticated: boolean;
  isContestOpen: boolean;
  isProfileComplete: boolean;
  isEmailVerified: boolean;
  isEligibilityComplete?: boolean;
  isEligibleForPaidEntry?: boolean;
  eligibilityStatus?: EligibilityStatus;
  contestStatus?: 'draft' | 'scheduled' | 'open' | 'locked' | 'canceled' | 'live' | 'finalizing' | 'final' | 'paid_out' | 'error_review';
}) {
  const isFreeBetaEntryContest = isBetaFreeEntryContest(entryFeeCents ?? -1);

  if (contestStatus === 'final' || contestStatus === 'paid_out') {
    return {
      label: 'View results',
      href: hasEntry ? `/contests/${contestId}/results` : `/leaderboard?contest=${contestId}`,
      disabled: false,
      tone: 'default' as const,
    };
  }

  if (hasEntry) {
    return {
      label: isContestOpen ? 'Edit your board' : 'View your board',
      href: getContestEntryProgressHref(contestId, 'lineup'),
      disabled: false,
      tone: 'default' as const,
    };
  }

  if (!isContestOpen) {
    return {
      label: 'Contest locked',
      href: null,
      disabled: true,
      tone: 'default' as const,
    };
  }

  const next = isFreeBetaEntryContest
    ? getContestEntryHref(contestId, 'not-entered')
    : getContestEntryProgressHref(contestId, 'payment-review');

  if (!isAuthenticated) {
    return {
      label: 'Sign up / log in to enter',
      href: buildAuthHref(next),
      disabled: false,
      tone: 'default' as const,
    };
  }

  if (!isProfileComplete) {
    return {
      label: 'Complete profile to enter',
      href: buildProfileHref(next),
      disabled: false,
      tone: 'default' as const,
    };
  }

  if (!isEmailVerified) {
    return {
      label: 'Verify email to enter',
      href: buildProfileHref(next, {
        status: 'error',
        message: verifyEmailToEnterContestsMessage,
      }),
      disabled: false,
      tone: 'default' as const,
    };
  }

  if (!isEligibilityComplete) {
    return {
      label: 'Complete eligibility to enter',
      href: buildProfileHref(next, {
        status: 'error',
        message: eligibilityToEnterContestsMessage,
      }),
      disabled: false,
      tone: 'default' as const,
    };
  }

  if (!isFreeBetaEntryContest && !isEligibleForPaidEntry) {
    const isBlocked = eligibilityStatus === 'blocked';

    return {
      label: isBlocked ? 'Paid entry unavailable' : 'Eligibility pending review',
      href: null,
      disabled: true,
      tone: isBlocked ? 'error' as const : 'warning' as const,
    };
  }

  if (!isFreeBetaEntryContest && !launchMode.paidEntryEnabled) {
    return {
      label: 'Paid entry coming later',
      href: null,
      disabled: true,
      tone: 'warning' as const,
    };
  }

  if (isContestOpen) {
    if (isFreeBetaEntryContest) {
      return {
        label: 'Enter free beta contest',
        href: null,
        disabled: false,
        tone: 'default' as const,
        submitsEntry: true as const,
      };
    }

    return {
      label: `Enter contest - ${entryFee}`,
      href: next,
      disabled: false,
      tone: 'default' as const,
    };
  }

  return {
    label: 'Contest locked',
    href: null,
    disabled: true,
    tone: 'default' as const,
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
  hasPersistedEntry = false,
  usesDirectEntryFlow = false,
}: {
  contestId: string;
  persistedStage: ContestEntryStage;
  route: ContestEntryRoute;
  hasPersistedEntry?: boolean;
  usesDirectEntryFlow?: boolean;
}) {
  if (usesDirectEntryFlow) {
    const stage: ContestEntryStage = hasPersistedEntry ? 'lineup' : 'not-entered';
    const expectedRoute: ContestEntryRoute = hasPersistedEntry ? 'lineup' : 'detail';
    const shouldRedirect = route !== expectedRoute;

    return {
      stage,
      shouldRedirect,
      redirectHref: shouldRedirect ? getContestEntryHref(contestId, stage) : null,
    };
  }

  const fallbackStage = routeStageMap[route];
  const stage = hasPersistedEntry
    ? route === 'lineup'
      ? 'lineup'
      : persistedStage === 'lineup'
        ? 'lineup'
        : 'entered'
    : persistedStage;
  const shouldRedirect = route !== 'detail' && stage !== fallbackStage;

  return {
    stage,
    shouldRedirect,
    redirectHref: shouldRedirect ? getContestEntryHref(contestId, stage) : null,
  };
}
