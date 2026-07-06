import { pickRankTimeline } from "../compositions/PickRankLandingVideo/timeline";
import { type PickRankLaunchVideoProps } from "../compositions/PickRankLandingVideo/schema";

export const pickRankLaunchVideoData: PickRankLaunchVideoProps = {
  meta: {
    compositionId: "PickRankLandingVideo",
    fps: 30,
    durationInFrames: pickRankTimeline.totalDuration,
  },
  audio: {
    bedFile: "audio/locked-in-final.wav",
    trimBeforeFrames: 75,
  },
  brand: {
    wordmarkText: "PickRank",
    accentColor: "#2563eb",
    ctaLabel: "Join the waitlist",
  },
  scenes: {
    hook: {
      lines: ["15 NFL Players.", "Pick 10.", "Rank them."],
      backgroundVariant: "texture-grid",
    },
    intro: {
      headline: "15-player slate.",
      subhead: "One stat. One board.",
      featureCards: ["Pick 10", "Drag to rank", "Beat the field"],
    },
    selection: {
      statCategory: "QB Passing Yards",
      allPlayers: [
        "Josh Allen",
        "Joe Burrow",
        "Derek Carr",
        "Sam Darnold",
        "Justin Fields",
        "Jared Goff",
        "Geno Smith",
        "Jalen Hurts",
        "Justin Herbert",
        "Jordan Love",
        "Patrick Mahomes",
        "Brock Purdy",
        "C.J. Stroud",
        "Tua Tagovailoa",
        "Caleb Williams",
      ],
      selectedPlayers: [
        "Patrick Mahomes",
        "Jalen Hurts",
        "Justin Herbert",
        "Jordan Love",
        "Brock Purdy",
        "C.J. Stroud",
        "Tua Tagovailoa",
        "Caleb Williams",
        "Josh Allen",
        "Joe Burrow",
      ],
    },
    ranking: {
      rankedPlayers: [
        "Jalen Hurts",
        "Justin Herbert",
        "Jordan Love",
        "Patrick Mahomes",
        "Brock Purdy",
        "C.J. Stroud",
        "Tua Tagovailoa",
        "Caleb Williams",
        "Josh Allen",
        "Joe Burrow",
      ],
      draggedPlayer: "Patrick Mahomes",
      draggedFrom: 4,
      draggedTo: 1,
    },
    scoring: {
      headline: "Lowest total wins.",
      supportingLine: "Every spot away adds points.",
      examples: [
        {
          player: "Patrick Mahomes",
          pickedRank: 1,
          actualRank: 6,
          points: 5,
        },
        {
          player: "Jalen Hurts",
          pickedRank: 3,
          actualRank: 2,
          points: 1,
        },
      ],
      totalPoints: 6,
    },
    differentiator: {
      headline: "No full roster.|No long season.|A new game every week.",
      lines: ["One slate.", "One ranking.", "One weekly result."],
    },
    national: {
      headline: "Beat the field.",
      supportingLine: "More entries = bigger prize pool.",
      leaderboardRows: [
        { name: "Texas Tate", region: "TX", valueLabel: "4 pts" },
        { name: "Philly Phil", region: "PA", valueLabel: "6 pts" },
        { name: "Miami Max", region: "FL", valueLabel: "8 pts" },
        { name: "You", region: "CA", valueLabel: "11 pts" },
      ],
      highlightedUser: "You",
    },
    cta: {
      headline: "PickRank",
      supportingLines: ["Rank the slate.", "Beat the field.", "Win cash."],
      ctaLabel: "Join the waitlist",
      ctaUrlLabel: "pickrankgames.com",
    },
  },
};
