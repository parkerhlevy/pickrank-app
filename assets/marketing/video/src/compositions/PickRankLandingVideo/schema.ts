export type PickRankLaunchVideoProps = {
  meta: {
    compositionId: "PickRankLandingVideo";
    fps: number;
    durationInFrames: number;
  };
  audio?: {
    bedFile: string;
    trimBeforeFrames?: number;
  };
  brand: {
    wordmarkText: string;
    accentColor: string;
    ctaLabel: string;
  };
  scenes: {
    hook: {
      eyebrow: string;
      lines: string[];
      supportLine: string;
      cards: Array<{title: string; value: string}>;
      backgroundVariant: "texture-grid" | "soft-glow";
    };
    intro: {
      headline: string;
      subhead: string;
      featureCards: string[];
    };
    selection: {
      headlineLines: [string, string];
      poolLabel: string;
      boardLabel: string;
      statCategory: string;
      allPlayers: string[];
      selectedPlayers: string[];
    };
    ranking: {
      supportingLine: string;
      rankedPlayers: string[];
      draggedPlayer: string;
      draggedFrom: number;
      draggedTo: number;
    };
    scoring: {
      headline: string;
      supportingLine: string;
      rulePills: [string, string];
      examples: Array<{
        player: string;
        pickedRank: number;
        actualRank: number;
        points: number;
      }>;
      totalPoints: number;
    };
    differentiator: {
      headline: string;
      lines: string[];
    };
    national: {
      eyebrow: string;
      headline: string;
      supportingLine?: string;
      boardTitle: string;
      boardChip: string;
      leaderboardRows: Array<{name: string; region: string; valueLabel?: string}>;
      highlightedUser: string;
    };
    cta: {
      headline: string;
      supportingLines: string[];
      ctaLabel: string;
      ctaUrlLabel: string;
    };
  };
};
