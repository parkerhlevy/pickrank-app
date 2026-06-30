export type PickRankLaunchVideoProps = {
  meta: {
    compositionId: "PickRankLandingVideo";
    fps: number;
    durationInFrames: number;
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
      player: string;
      pickedRank: number;
      actualRank: number;
      distance: number;
      scoreSummary: string;
      supportingLine: string;
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
