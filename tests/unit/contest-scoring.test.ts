import { describe, expect, it } from 'vitest';
import {
  buildContestPlayerResults,
  compareLeaderboardTiebreakers,
  entriesRemainTiedAfterTiebreakers,
  scoreContestEntries,
} from '../../lib/contest-scoring';
import type { ContestSlatePlayer } from '../../lib/contest-data';

const contestId = 'week-1-qb-passing-yards';
const finalizedAt = '2026-09-09T00:00:00.000Z';

const slatePlayers = [
  ['qb-allen', 'provider-allen', 'game-1', 'Josh Allen', 'BUF', 'MIA'],
  ['qb-burrow', 'provider-burrow', 'game-2', 'Joe Burrow', 'CIN', 'CLE'],
  ['qb-carr', 'provider-carr', 'game-3', 'Derek Carr', 'NO', 'ATL'],
  ['qb-cousins', 'provider-cousins', 'game-4', 'Kirk Cousins', 'ATL', 'NO'],
  ['qb-herbert', 'provider-herbert', 'game-5', 'Justin Herbert', 'LAC', 'LV'],
  ['qb-hurts', 'provider-hurts', 'game-6', 'Jalen Hurts', 'PHI', 'DAL'],
  ['qb-jackson', 'provider-jackson', 'game-7', 'Lamar Jackson', 'BAL', 'PIT'],
  ['qb-love', 'provider-love', 'game-8', 'Jordan Love', 'GB', 'MIN'],
  ['qb-prescott', 'provider-prescott', 'game-9', 'Dak Prescott', 'DAL', 'PHI'],
  ['qb-purdy', 'provider-purdy', 'game-10', 'Brock Purdy', 'SF', 'SEA'],
  ['qb-stroud', 'provider-stroud', 'game-11', 'C.J. Stroud', 'HOU', 'IND'],
  ['qb-mahomes', 'provider-mahomes', 'game-12', 'Patrick Mahomes', 'KC', 'DEN'],
  ['qb-goff', 'provider-goff', 'game-13', 'Jared Goff', 'DET', 'CHI'],
  ['qb-tua', 'provider-tua', 'game-14', 'Tua Tagovailoa', 'MIA', 'BUF'],
  ['qb-stafford', 'provider-stafford', 'game-15', 'Matthew Stafford', 'LAR', 'ARI'],
].map(
  ([playerId, providerPlayerId, providerGameId, displayName, teamAbbreviation, opponentAbbreviation], index) =>
    ({
      playerId,
      providerPlayerId,
      providerGameId,
      displayName,
      teamAbbreviation,
      opponentAbbreviation,
      homeAway: index % 2 === 0 ? 'home' : 'away',
      gameStartTime: '2026-09-07T17:00:00.000Z',
      position: 'QB',
      activeStatus: 'active',
      sortOrderInternal: index + 1,
    }) satisfies ContestSlatePlayer,
);

const finalStats = [
  { playerId: 'qb-allen', finalStat: 325, passingTouchdowns: 3 },
  { playerId: 'qb-burrow', finalStat: 300, passingTouchdowns: 2 },
  { playerId: 'qb-carr', finalStat: 250, passingTouchdowns: 1 },
  { playerId: 'qb-cousins', finalStat: 220, passingTouchdowns: 1 },
  { playerId: 'qb-herbert', finalStat: 295, passingTouchdowns: 2 },
  { playerId: 'qb-hurts', finalStat: 280, passingTouchdowns: 2 },
  { playerId: 'qb-jackson', finalStat: 330, passingTouchdowns: 4 },
  { playerId: 'qb-love', finalStat: 270, passingTouchdowns: 2 },
  { playerId: 'qb-prescott', finalStat: 260, passingTouchdowns: 1 },
  { playerId: 'qb-purdy', finalStat: 240, passingTouchdowns: 1 },
  { playerId: 'qb-stroud', finalStat: 230, passingTouchdowns: 1 },
  { playerId: 'qb-mahomes', finalStat: 305, passingTouchdowns: 3 },
  { playerId: 'qb-goff', finalStat: 290, passingTouchdowns: 2 },
  { playerId: 'qb-tua', finalStat: 210, passingTouchdowns: 1 },
  { playerId: 'qb-stafford', finalStat: 205, passingTouchdowns: 1 },
];

describe('contest scoring', () => {
  it('scores rank distance against the full slate and treats tied player ranges as zero inside the range', () => {
    const playerResults = buildContestPlayerResults({
      slatePlayers: [
        slatePlayers[0]!,
        slatePlayers[1]!,
        slatePlayers[2]!,
        slatePlayers[3]!,
      ],
      finalStats: [
        { playerId: 'qb-allen', finalStat: 325, passingTouchdowns: 3 },
        { playerId: 'qb-burrow', finalStat: 300, passingTouchdowns: 2 },
        { playerId: 'qb-carr', finalStat: 300, passingTouchdowns: 2 },
        { playerId: 'qb-cousins', finalStat: 200, passingTouchdowns: 1 },
      ],
      finalizedAt,
    });

    expect(playerResults.map((playerResult) => [playerResult.playerId, playerResult.actualRankMin, playerResult.actualRankMax, playerResult.actualRankDisplay])).toEqual([
      ['qb-allen', 1, 1, '1'],
      ['qb-carr', 2, 3, 'T-2'],
      ['qb-burrow', 2, 3, 'T-2'],
      ['qb-cousins', 4, 4, '4'],
    ]);

    const scored = scoreContestEntries({
      contestId,
      finalizedAt,
      prizePoolCents: 700,
      playerResults,
      entries: [
        {
          entryId: 'entry-1',
          contestId,
          userId: 'user-1',
          lineupOrder: ['Josh Allen', 'Derek Carr', 'Joe Burrow', 'Kirk Cousins', 'Josh Allen', 'Derek Carr', 'Joe Burrow', 'Kirk Cousins', 'Josh Allen', 'Derek Carr'],
        },
      ],
    });

    expect(scored[0]?.playerScores.slice(0, 4)).toEqual([
      expect.objectContaining({ playerName: 'Josh Allen', distance: 0 }),
      expect.objectContaining({ playerName: 'Derek Carr', distance: 0 }),
      expect.objectContaining({ playerName: 'Joe Burrow', distance: 0 }),
      expect.objectContaining({ playerName: 'Kirk Cousins', distance: 0 }),
    ]);
  });

  it('applies the locked exact, one-off, QB1-distance, and selected-QB1-through-QB5 TD tiebreaker order before declaring a true tie', () => {
    expect(
      compareLeaderboardTiebreakers(
        {
          entryId: 'entry-best-exact',
          totalScore: 6,
          exactPicks: 8,
          oneOffOrBetterPicks: 8,
          actualQb1Distance: 0,
          selectedQb1PassingTouchdowns: 3,
          selectedQb2PassingTouchdowns: 2,
          selectedQb3PassingTouchdowns: 2,
          selectedQb4PassingTouchdowns: 1,
          selectedQb5PassingTouchdowns: 1,
        },
        {
          entryId: 'entry-fewer-exact',
          totalScore: 6,
          exactPicks: 4,
          oneOffOrBetterPicks: 10,
          actualQb1Distance: 0,
          selectedQb1PassingTouchdowns: 4,
          selectedQb2PassingTouchdowns: 2,
          selectedQb3PassingTouchdowns: 2,
          selectedQb4PassingTouchdowns: 1,
          selectedQb5PassingTouchdowns: 1,
        },
      ),
    ).toBeLessThan(0);

    expect(
      compareLeaderboardTiebreakers(
        {
          entryId: 'entry-best-one-off',
          totalScore: 6,
          exactPicks: 6,
          oneOffOrBetterPicks: 9,
          actualQb1Distance: 0,
          selectedQb1PassingTouchdowns: 3,
          selectedQb2PassingTouchdowns: 2,
          selectedQb3PassingTouchdowns: 2,
          selectedQb4PassingTouchdowns: 1,
          selectedQb5PassingTouchdowns: 1,
        },
        {
          entryId: 'entry-fewer-one-off',
          totalScore: 6,
          exactPicks: 6,
          oneOffOrBetterPicks: 8,
          actualQb1Distance: 0,
          selectedQb1PassingTouchdowns: 4,
          selectedQb2PassingTouchdowns: 2,
          selectedQb3PassingTouchdowns: 2,
          selectedQb4PassingTouchdowns: 1,
          selectedQb5PassingTouchdowns: 1,
        },
      ),
    ).toBeLessThan(0);

    expect(
      compareLeaderboardTiebreakers(
        {
          entryId: 'entry-closer-qb1',
          totalScore: 6,
          exactPicks: 6,
          oneOffOrBetterPicks: 8,
          actualQb1Distance: 0,
          selectedQb1PassingTouchdowns: 2,
          selectedQb2PassingTouchdowns: 2,
          selectedQb3PassingTouchdowns: 2,
          selectedQb4PassingTouchdowns: 1,
          selectedQb5PassingTouchdowns: 1,
        },
        {
          entryId: 'entry-farther-qb1',
          totalScore: 6,
          exactPicks: 6,
          oneOffOrBetterPicks: 8,
          actualQb1Distance: 1,
          selectedQb1PassingTouchdowns: 4,
          selectedQb2PassingTouchdowns: 2,
          selectedQb3PassingTouchdowns: 2,
          selectedQb4PassingTouchdowns: 1,
          selectedQb5PassingTouchdowns: 1,
        },
      ),
    ).toBeLessThan(0);

    expect(
      compareLeaderboardTiebreakers(
        {
          entryId: 'entry-more-selected-qb1-tds',
          totalScore: 6,
          exactPicks: 6,
          oneOffOrBetterPicks: 8,
          actualQb1Distance: 1,
          selectedQb1PassingTouchdowns: 4,
          selectedQb2PassingTouchdowns: 2,
          selectedQb3PassingTouchdowns: 2,
          selectedQb4PassingTouchdowns: 1,
          selectedQb5PassingTouchdowns: 1,
        },
        {
          entryId: 'entry-fewer-selected-qb1-tds',
          totalScore: 6,
          exactPicks: 6,
          oneOffOrBetterPicks: 8,
          actualQb1Distance: 1,
          selectedQb1PassingTouchdowns: 2,
          selectedQb2PassingTouchdowns: 2,
          selectedQb3PassingTouchdowns: 2,
          selectedQb4PassingTouchdowns: 1,
          selectedQb5PassingTouchdowns: 1,
        },
      ),
    ).toBeLessThan(0);

    expect(
      compareLeaderboardTiebreakers(
        {
          entryId: 'entry-more-selected-qb4-tds',
          totalScore: 6,
          exactPicks: 6,
          oneOffOrBetterPicks: 8,
          actualQb1Distance: 1,
          selectedQb1PassingTouchdowns: 4,
          selectedQb2PassingTouchdowns: 3,
          selectedQb3PassingTouchdowns: 2,
          selectedQb4PassingTouchdowns: 2,
          selectedQb5PassingTouchdowns: 1,
        },
        {
          entryId: 'entry-fewer-selected-qb4-tds',
          totalScore: 6,
          exactPicks: 6,
          oneOffOrBetterPicks: 8,
          actualQb1Distance: 1,
          selectedQb1PassingTouchdowns: 4,
          selectedQb2PassingTouchdowns: 3,
          selectedQb3PassingTouchdowns: 2,
          selectedQb4PassingTouchdowns: 1,
          selectedQb5PassingTouchdowns: 4,
        },
      ),
    ).toBeLessThan(0);

    expect(
      entriesRemainTiedAfterTiebreakers(
        {
          entryId: 'entry-a',
          totalScore: 6,
          exactPicks: 6,
          oneOffOrBetterPicks: 8,
          actualQb1Distance: 1,
          selectedQb1PassingTouchdowns: 3,
          selectedQb2PassingTouchdowns: 2,
          selectedQb3PassingTouchdowns: 2,
          selectedQb4PassingTouchdowns: 1,
          selectedQb5PassingTouchdowns: 1,
        },
        {
          entryId: 'entry-b',
          totalScore: 6,
          exactPicks: 6,
          oneOffOrBetterPicks: 8,
          actualQb1Distance: 1,
          selectedQb1PassingTouchdowns: 3,
          selectedQb2PassingTouchdowns: 2,
          selectedQb3PassingTouchdowns: 2,
          selectedQb4PassingTouchdowns: 1,
          selectedQb5PassingTouchdowns: 1,
        },
      ),
    ).toBe(true);
  });

  it('keeps entries tied after all tiebreakers and splits the paid slots deterministically by entry id', () => {
    const playerResults = buildContestPlayerResults({
      slatePlayers,
      finalStats,
      finalizedAt,
    });

    const scored = scoreContestEntries({
      contestId,
      finalizedAt,
      prizePoolCents: 500,
      playerResults,
      entries: [
        {
          entryId: 'entry-a',
          contestId,
          userId: 'user-a',
          lineupOrder: ['Lamar Jackson', 'Josh Allen', 'Patrick Mahomes', 'Joe Burrow', 'Justin Herbert', 'Jared Goff', 'Jalen Hurts', 'Jordan Love', 'Dak Prescott', 'Derek Carr'],
        },
        {
          entryId: 'entry-b',
          contestId,
          userId: 'user-b',
          lineupOrder: ['Lamar Jackson', 'Josh Allen', 'Patrick Mahomes', 'Joe Burrow', 'Justin Herbert', 'Jared Goff', 'Jalen Hurts', 'Jordan Love', 'Dak Prescott', 'Derek Carr'],
        },
        {
          entryId: 'entry-c',
          contestId,
          userId: 'user-c',
          lineupOrder: ['Patrick Mahomes', 'Lamar Jackson', 'Josh Allen', 'Joe Burrow', 'Justin Herbert', 'Jared Goff', 'Jalen Hurts', 'Jordan Love', 'Dak Prescott', 'Derek Carr'],
        },
      ],
    });

    expect(scored.slice(0, 2).map((entry) => [entry.entryId, entry.finalRankDisplay, entry.tieGroupSize, entry.payoutAmountCents])).toEqual([
      ['entry-a', 'T-1', 2, 200],
      ['entry-b', 'T-1', 2, 200],
    ]);
    expect(scored[2]).toEqual(expect.objectContaining({ entryId: 'entry-c', finalRankDisplay: '3', payoutAmountCents: 100 }));
  });

  it('splits pooled payout cents by lowest entry id first when the amount does not divide evenly', () => {
    const playerResults = buildContestPlayerResults({
      slatePlayers,
      finalStats,
      finalizedAt,
    });

    const scored = scoreContestEntries({
      contestId,
      finalizedAt,
      prizePoolCents: 334,
      playerResults,
      entries: [
        {
          entryId: 'entry-1',
          contestId,
          userId: 'user-1',
          lineupOrder: ['Lamar Jackson', 'Josh Allen', 'Patrick Mahomes', 'Joe Burrow', 'Justin Herbert', 'Jared Goff', 'Jalen Hurts', 'Jordan Love', 'Dak Prescott', 'Derek Carr'],
        },
        {
          entryId: 'entry-2',
          contestId,
          userId: 'user-2',
          lineupOrder: ['Lamar Jackson', 'Josh Allen', 'Patrick Mahomes', 'Joe Burrow', 'Justin Herbert', 'Jared Goff', 'Jalen Hurts', 'Jordan Love', 'Dak Prescott', 'Derek Carr'],
        },
        {
          entryId: 'entry-3',
          contestId,
          userId: 'user-3',
          lineupOrder: ['Lamar Jackson', 'Josh Allen', 'Patrick Mahomes', 'Joe Burrow', 'Justin Herbert', 'Jared Goff', 'Jalen Hurts', 'Jordan Love', 'Dak Prescott', 'Derek Carr'],
        },
      ],
    });

    expect(scored.map((entry) => [entry.entryId, entry.payoutAmountCents])).toEqual([
      ['entry-1', 112],
      ['entry-2', 111],
      ['entry-3', 111],
    ]);
  });
});
