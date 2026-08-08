import { describe, expect, it } from 'vitest';
import { buildInSeasonLiveValidationContest, inSeasonLiveValidationContestId } from '../../lib/in-season-live-validation-prep';
import { contestPlayerPoolSize } from '../../lib/contest-rules';

describe('in-season live validation prep', () => {
  it('rebuilds the source slate with live schedule score ids, current qb1 names, and truthful matchup updates', () => {
    const prepared = buildInSeasonLiveValidationContest({
      sourceContestId: 'week-1-qb-passing-yards',
      sourceContestTitle: 'Week 1 QB Passing Yards',
      season: 2026,
      week: 1,
      sourceSlatePlayers: [
        {
          playerId: 'qb-josh-allen',
          providerPlayerId: 'placeholder-allen',
          providerGameId: 'placeholder-buf',
          displayName: 'Josh Allen',
          teamAbbreviation: 'BUF',
          opponentAbbreviation: 'BAL',
          homeAway: 'home',
          gameStartTime: '2026-09-04T00:20:00.000Z',
          position: 'QB',
          activeStatus: 'active',
          sortOrderInternal: 1,
        },
        {
          playerId: 'qb-derek-carr',
          providerPlayerId: 'placeholder-carr',
          providerGameId: 'placeholder-no',
          displayName: 'Derek Carr',
          teamAbbreviation: 'NO',
          opponentAbbreviation: 'ATL',
          homeAway: 'home',
          gameStartTime: '2026-09-07T17:00:00.000Z',
          position: 'QB',
          activeStatus: 'active',
          sortOrderInternal: 2,
        },
      ],
      scheduleGames: [
        {
          scoreId: '19461',
          awayTeam: 'BUF',
          homeTeam: 'HOU',
          date: '2026-09-13T13:00:00.000Z',
        },
        {
          scoreId: '19460',
          awayTeam: 'NO',
          homeTeam: 'DET',
          date: '2026-09-13T13:00:00.000Z',
        },
      ],
      quarterbacks: [
        {
          teamAbbreviation: 'BUF',
          playerId: '19801',
          name: 'Josh Allen',
          depthOrder: 1,
        },
        {
          teamAbbreviation: 'NO',
          playerId: '27001',
          name: 'Tyler Shough',
          depthOrder: 1,
        },
      ],
    });

    expect(prepared.id).toBe(inSeasonLiveValidationContestId);
    expect(prepared.lineupPlayers).toEqual(['Josh Allen', 'Tyler Shough']);
    expect(prepared.slatePlayers).toEqual([
      expect.objectContaining({
        playerId: 'qb-josh-allen',
        providerPlayerId: '19801',
        providerGameId: '19461',
        displayName: 'Josh Allen',
        teamAbbreviation: 'BUF',
        opponentAbbreviation: 'HOU',
        homeAway: 'away',
      }),
      expect.objectContaining({
        playerId: 'qb-derek-carr',
        providerPlayerId: '27001',
        providerGameId: '19460',
        displayName: 'Tyler Shough',
        teamAbbreviation: 'NO',
        opponentAbbreviation: 'DET',
        homeAway: 'away',
      }),
    ]);
    expect(prepared.replacements).toEqual([
      {
        sourcePlayerName: 'Derek Carr',
        replacementPlayerName: 'Tyler Shough',
        teamAbbreviation: 'NO',
      },
    ]);
    expect(prepared.matchupChanges).toEqual([
      {
        teamAbbreviation: 'BUF',
        fromOpponentAbbreviation: 'BAL',
        toOpponentAbbreviation: 'HOU',
        fromHomeAway: 'home',
        toHomeAway: 'away',
      },
      {
        teamAbbreviation: 'NO',
        fromOpponentAbbreviation: 'ATL',
        toOpponentAbbreviation: 'DET',
        fromHomeAway: 'home',
        toHomeAway: 'away',
      },
    ]);
    expect(prepared.warning).toContain('Derek Carr -> Tyler Shough');
  });

  it('keeps the expanded 20-player source pool ready for hidden live validation', () => {
    const sourceSlatePlayers = buildTwentyPlayerSourceSlate();
    const prepared = buildInSeasonLiveValidationContest({
      sourceContestId: 'week-1-qb-passing-yards',
      sourceContestTitle: 'Week 1 QB Passing Yards',
      season: 2026,
      week: 1,
      sourceSlatePlayers,
      scheduleGames: sourceSlatePlayers.map((player, index) => ({
        scoreId: String(6000 + index),
        awayTeam: player.homeAway === 'away' ? player.teamAbbreviation : player.opponentAbbreviation,
        homeTeam: player.homeAway === 'home' ? player.teamAbbreviation : player.opponentAbbreviation,
        date: player.gameStartTime,
      })),
      quarterbacks: sourceSlatePlayers.map((player, index) => ({
        teamAbbreviation: player.teamAbbreviation,
        playerId: String(20000 + index),
        name: player.displayName,
        depthOrder: 1,
      })),
    });

    expect(prepared.slatePlayers).toHaveLength(contestPlayerPoolSize);
    expect(prepared.lineupPlayers).toHaveLength(10);
    expect(prepared.replacements).toEqual([]);
    expect(prepared.slatePlayers.slice(-5)).toEqual([
      expect.objectContaining({ displayName: 'Baker Mayfield', teamAbbreviation: 'TB' }),
      expect.objectContaining({ displayName: 'Trevor Lawrence', teamAbbreviation: 'JAX' }),
      expect.objectContaining({ displayName: 'Kyler Murray', teamAbbreviation: 'ARI' }),
      expect.objectContaining({ displayName: 'Sam Darnold', teamAbbreviation: 'SEA' }),
      expect.objectContaining({ displayName: 'Russell Wilson', teamAbbreviation: 'NYG' }),
    ]);
  });
});

function buildTwentyPlayerSourceSlate() {
  return [
    ['qb-josh-allen', 'Josh Allen', 'BUF', 'BAL', 'home'],
    ['qb-joe-burrow', 'Joe Burrow', 'CIN', 'CLE', 'home'],
    ['qb-derek-carr', 'Derek Carr', 'NO', 'ATL', 'home'],
    ['qb-kirk-cousins', 'Kirk Cousins', 'ATL', 'NO', 'away'],
    ['qb-justin-herbert', 'Justin Herbert', 'LAC', 'LV', 'home'],
    ['qb-jalen-hurts', 'Jalen Hurts', 'PHI', 'DAL', 'home'],
    ['qb-lamar-jackson', 'Lamar Jackson', 'BAL', 'BUF', 'away'],
    ['qb-jordan-love', 'Jordan Love', 'GB', 'MIN', 'home'],
    ['qb-dak-prescott', 'Dak Prescott', 'DAL', 'PHI', 'away'],
    ['qb-brock-purdy', 'Brock Purdy', 'SF', 'SEA', 'home'],
    ['qb-cj-stroud', 'C.J. Stroud', 'HOU', 'IND', 'home'],
    ['qb-patrick-mahomes', 'Patrick Mahomes', 'KC', 'DEN', 'home'],
    ['qb-jared-goff', 'Jared Goff', 'DET', 'CHI', 'home'],
    ['qb-tua-tagovailoa', 'Tua Tagovailoa', 'MIA', 'NYJ', 'home'],
    ['qb-matthew-stafford', 'Matthew Stafford', 'LAR', 'ARI', 'home'],
    ['qb-baker-mayfield', 'Baker Mayfield', 'TB', 'ATL', 'away'],
    ['qb-trevor-lawrence', 'Trevor Lawrence', 'JAX', 'CAR', 'home'],
    ['qb-kyler-murray', 'Kyler Murray', 'ARI', 'LAR', 'away'],
    ['qb-sam-darnold', 'Sam Darnold', 'SEA', 'SF', 'away'],
    ['qb-russell-wilson', 'Russell Wilson', 'NYG', 'WAS', 'away'],
  ].map(([playerId, displayName, teamAbbreviation, opponentAbbreviation, homeAway], index) => ({
    playerId,
    providerPlayerId: `provider-${playerId}`,
    providerGameId: `${teamAbbreviation.toLowerCase()}-${opponentAbbreviation.toLowerCase()}-2026-wk1`,
    displayName,
    teamAbbreviation,
    opponentAbbreviation,
    homeAway: homeAway as 'home' | 'away',
    gameStartTime: '2026-09-07T17:00:00.000Z',
    position: 'QB' as const,
    activeStatus: 'active',
    sortOrderInternal: index + 1,
  }));
}
