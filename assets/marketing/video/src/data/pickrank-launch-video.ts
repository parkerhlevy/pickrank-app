import { pickRankTimeline } from "../compositions/PickRankLandingVideo/timeline";
import { type PickRankLaunchVideoProps } from "../compositions/PickRankLandingVideo/schema";

export const pickRankLaunchVideoData: PickRankLaunchVideoProps = {
  meta: {
    compositionId: "PickRankLandingVideo",
    fps: 30,
    durationInFrames: pickRankTimeline.totalDuration,
  },
  brand: {
    wordmarkText: "PickRank",
    accentColor: "#2563eb",
    ctaLabel: "Join the waitlist",
  },
  scenes: {
    hook: {
      lines: ["15 NFL QBs.", "Pick 10.", "Rank them."],
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
      player: "Patrick Mahomes",
      pickedRank: 1,
      actualRank: 6,
      distance: 5,
      scoreSummary: "5 spots off",
      supportingLine: "Every spot away adds distance.",
    },
    differentiator: {
      headline: "No full roster. No long season.",
      lines: ["One slate.", "One ranking.", "One weekly result."],
    },
    national: {
      headline: "Beat the field.",
      supportingLine: "Every entry lands on one nationwide leaderboard.",
      leaderboardRows: [
        { name: "Texas Tate", region: "TX", valueLabel: "Top finish" },
        { name: "Philly Phil", region: "PA", valueLabel: "Right behind" },
        { name: "Miami Max", region: "FL", valueLabel: "Still live" },
        { name: "You", region: "CA", valueLabel: "Climbing" },
      ],
      highlightedUser: "You",
    },
    cta: {
      headline: "PickRank",
      supportingLines: ["Rank the slate", "Beat the field", "Join the waitlist"],
      ctaLabel: "Join the waitlist",
      ctaUrlLabel: "pickrankgames.com",
    },
  },
};
