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
      lines: string[];
      backgroundVariant: "texture-grid" | "soft-glow";
    };
    intro: {
      headline: string;
      subhead: string;
      featureCards: string[];
    };
    selection: {
      statCategory: string;
      allPlayers: string[];
      selectedPlayers: string[];
    };
    ranking: {
      rankedPlayers: string[];
      draggedPlayer: string;
      draggedFrom: number;
      draggedTo: number;
    };
    scoring: {
      headline: string;
      supportingLine: string;
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
      headline: string;
      supportingLine: string;
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
