import { describe, expect, it } from 'vitest';
import { buildInSeasonLiveValidationContest, inSeasonLiveValidationContestId } from '../../lib/in-season-live-validation-prep';

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
});
