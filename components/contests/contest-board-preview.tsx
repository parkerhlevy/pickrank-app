import { ArrowRight, CheckCircle2, Circle, Clock, Flag, GripVertical, ListOrdered, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

type ContestBoardPreviewVariant = 'compact' | 'feature' | 'detail';
type ContestJourneyStage = 'slate' | 'entry-review' | 'entry-confirmed' | 'build' | 'lock' | 'final-results';

type ContestBoardPreviewProps = {
  title: string;
  slateLabel: string;
  statCategory: string;
  lockTimeLabel?: string;
  rankedPlayers: string[];
  slatePlayers?: string[];
  playerContexts?: PlayerContext[];
  variant?: ContestBoardPreviewVariant;
  className?: string;
};

type PlayerContext = {
  displayName: string;
  teamAbbreviation: string;
  opponentAbbreviation: string;
  homeAway: 'home' | 'away';
};

type PlayerDisplayContext = {
  nameLabel: string;
  matchupLabel: string;
};

type ContestBoardStagePanelProps = {
  title: string;
  description: string;
  slateLabel: string;
  statCategory: string;
  lockTimeLabel: string;
  rankedCountLabel: string;
  stateLabel: string;
  rankedLabel?: string;
  rankedDetail?: string;
  timingLabel?: string;
  timingDetail?: string;
  className?: string;
};

type ContestJourneyRailProps = {
  currentStage: ContestJourneyStage;
  className?: string;
};

const contestJourneyStages: {
  key: ContestJourneyStage;
  label: string;
  detail: string;
}[] = [
  {
    key: 'slate',
    label: 'Player Pool',
    detail: 'Review the pool',
  },
  {
    key: 'entry-review',
    label: 'Entry Review',
    detail: 'Confirm the contest',
  },
  {
    key: 'entry-confirmed',
    label: 'Entry Confirmed',
    detail: 'Your board is ready',
  },
  {
    key: 'build',
    label: 'Build Board',
    detail: 'Rank your 10',
  },
  {
    key: 'lock',
    label: 'Lock',
    detail: 'Rankings close',
  },
  {
    key: 'final-results',
    label: 'Final Results',
    detail: 'Saved standings',
  },
];

const previewLimits: Record<ContestBoardPreviewVariant, number> = {
  compact: 4,
  feature: 5,
  detail: 10,
};

export function ContestBoardPreview({
  title,
  slateLabel,
  statCategory,
  lockTimeLabel,
  rankedPlayers,
  slatePlayers = [],
  playerContexts = [],
  variant = 'compact',
  className,
}: ContestBoardPreviewProps) {
  const rankLimit = previewLimits[variant];
  const rankedPreview = rankedPlayers.slice(0, rankLimit);
  const slatePreview = variant === 'detail' ? slatePlayers : getSlatePreview(slatePlayers, rankedPlayers, 3);
  const isCompact = variant === 'compact';
  const playerPoolLabel = formatPlayerPoolLabel(slateLabel);
  const playerContextByName = new Map(
    playerContexts.map((player) => [player.displayName, formatPlayerDisplayContext(player)]),
  );

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm',
        variant === 'feature' && 'bg-gradient-to-br from-white via-slate-50 to-blue-50/60',
        className,
      )}
    >
      <div className="border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-bold uppercase text-blue-200">Contest Board</p>
            <h3
              className={cn(
                'font-black leading-tight',
                isCompact ? 'text-base' : 'text-xl',
                variant === 'detail' && 'sm:whitespace-nowrap',
              )}
            >
              {title}
            </h3>
          </div>
          {lockTimeLabel ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-blue-100">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {lockTimeLabel}
            </span>
          ) : null}
        </div>
        {variant !== 'detail' ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold uppercase text-slate-300 sm:grid-cols-4">
            <span className="rounded-md bg-white/10 px-2 py-1">{playerPoolLabel}</span>
            <span className="rounded-md bg-white/10 px-2 py-1">Your board</span>
            <span className="rounded-md bg-white/10 px-2 py-1">Final order</span>
            <span className="rounded-md bg-white/10 px-2 py-1">Lower score wins</span>
          </div>
        ) : null}
      </div>

      <div className={cn('grid gap-3 p-3', variant === 'feature' && 'sm:grid-cols-[0.9fr_1.1fr]')}>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <p className="text-sm font-black">Player Pool</p>
            </div>
            <span className="numeric text-xs font-bold text-slate-500">{statCategory}</span>
          </div>
          <div className={cn('space-y-2', variant === 'detail' && 'grid gap-2 space-y-0 sm:grid-cols-2')}>
            {slatePreview.map((player) => {
              const playerContext = playerContextByName.get(player);

              return (
                <div
                  key={player}
                  className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{playerContext?.nameLabel ?? player}</span>
                    {playerContext ? (
                      <span className="numeric block truncate text-xs text-slate-500">
                        {playerContext.matchupLabel}
                      </span>
                    ) : null}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                </div>
              );
            })}
          </div>
        </div>

        {variant !== 'detail' ? (
          <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <p className="text-sm font-black">Your Board</p>
              </div>
              <span className="numeric text-xs font-bold text-blue-700">{rankedPlayers.length}/10 ranked</span>
            </div>
            <div className="grid gap-2">
              {rankedPreview.map((player, index) => {
                const playerContext = playerContextByName.get(player);

                return (
                  <div
                    key={`${player}-${index}`}
                    className="flex items-center gap-2 rounded-md border border-blue-100 bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <span className="numeric flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-950 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{playerContext?.nameLabel ?? player}</span>
                      {playerContext ? (
                        <span className="numeric block truncate text-xs text-slate-500">
                          {playerContext.matchupLabel}
                        </span>
                      ) : null}
                    </span>
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                  </div>
                );
              })}
            </div>
            {variant !== 'compact' ? (
              <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold leading-5 text-emerald-900">
                Scoring compares your board with the final {statCategory.toLowerCase()} order. Lowest total miss wins.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ContestJourneyRail({ currentStage, className }: ContestJourneyRailProps) {
  const currentStageIndex = contestJourneyStages.findIndex((stage) => stage.key === currentStage);

  return (
    <div className={cn('section-card overflow-hidden', className)}>
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="eyebrow">Contest Progression</p>
        <p className="mt-1 text-sm text-muted-foreground">
          One skill contest moves from player-pool review to your board, lock, and saved final results.
        </p>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[44rem] grid-cols-6 gap-2 p-3">
          {contestJourneyStages.map((stage, index) => {
            const isCurrent = stage.key === currentStage;
            const isComplete = index < currentStageIndex;
            const Icon = isComplete ? CheckCircle2 : isCurrent ? Flag : Circle;

            return (
              <div
                key={stage.key}
                className={cn(
                  'min-h-[6.25rem] rounded-lg border px-3 py-3 text-sm',
                  isCurrent
                    ? 'border-primary bg-blue-50 text-slate-950 shadow-sm'
                    : isComplete
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                      : 'border-slate-200 bg-slate-50 text-slate-700',
                )}
              >
                <div
                  className={cn(
                    'mb-2 flex h-8 w-8 items-center justify-center rounded-full',
                    isCurrent
                      ? 'bg-primary text-white'
                      : isComplete
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-white text-slate-500',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="font-black leading-tight">{stage.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{stage.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ContestBoardStagePanel({
  title,
  description,
  slateLabel,
  statCategory,
  lockTimeLabel,
  rankedCountLabel,
  stateLabel,
  rankedLabel = 'Ranked 10',
  rankedDetail = 'Your board',
  timingLabel = 'Lock Time',
  timingDetail = 'Save before lock',
  className,
}: ContestBoardStagePanelProps) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm', className)}>
      <div className="border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-bold uppercase text-blue-200">Contest Board</p>
            <h2 className="text-xl font-black leading-tight">{title}</h2>
          </div>
          <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-blue-100">
            {stateLabel}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
      </div>

      <div className="grid gap-2 p-3 sm:grid-cols-2">
        <BoardStageTile
          icon={Target}
          label="Player Pool"
          value={formatPlayerPoolLabel(slateLabel)}
          detail={statCategory}
        />
        <BoardStageTile icon={ListOrdered} label={rankedLabel} value={rankedCountLabel} detail={rankedDetail} />
        <BoardStageTile icon={Clock} label={timingLabel} value={lockTimeLabel} detail={timingDetail} />
      </div>
    </div>
  );
}

function getSlatePreview(slatePlayers: string[], rankedPlayers: string[], limit: number) {
  const rankedPlayerSet = new Set(rankedPlayers);
  const availableSlatePlayers = slatePlayers.filter((player) => !rankedPlayerSet.has(player));
  const sourcePlayers = availableSlatePlayers.length > 0 ? availableSlatePlayers : slatePlayers;

  return sourcePlayers.slice(0, limit);
}

function formatPlayerPoolLabel(label: string) {
  return label.replace(/\bslate\b/gi, 'player pool');
}

function formatPlayerDisplayContext(player: PlayerContext): PlayerDisplayContext {
  return {
    nameLabel: `${player.displayName} (${player.teamAbbreviation})`,
    matchupLabel: `${player.homeAway === 'home' ? 'vs.' : '@'} ${player.opponentAbbreviation}`,
  };
}

function BoardStageTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
        {label}
      </div>
      <p className="numeric text-sm font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
