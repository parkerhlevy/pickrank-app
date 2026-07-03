import { describe, expect, it } from 'vitest';
import { buildFinalStatTemplate, canFinalizeContestStatus, parseFinalStatRows } from '../../lib/contest-finalization';

const contest = {
  title: 'Week 1 QB Passing Yards',
  slateSize: 2,
  slatePlayers: [
    {
      playerId: 'qb-josh-allen',
      providerPlayerId: 'provider-josh-allen',
      providerGameId: 'game-1',
      displayName: 'Josh Allen',
      teamAbbreviation: 'BUF',
      opponentAbbreviation: 'NYJ',
      homeAway: 'home' as const,
      gameStartTime: '2026-09-09T00:00:00.000Z',
      position: 'QB' as const,
      activeStatus: null,
      sortOrderInternal: 1,
    },
    {
      playerId: 'qb-lamar-jackson',
      providerPlayerId: 'provider-lamar-jackson',
      providerGameId: 'game-2',
      displayName: 'Lamar Jackson',
      teamAbbreviation: 'BAL',
      opponentAbbreviation: 'CIN',
      homeAway: 'away' as const,
      gameStartTime: '2026-09-10T00:00:00.000Z',
      position: 'QB' as const,
      activeStatus: null,
      sortOrderInternal: 2,
    },
  ],
};

describe('contest finalization helpers', () => {
  it('builds a prefilled stat template from the saved slate', () => {
    expect(buildFinalStatTemplate(contest)).toBe(
      ['qb-josh-allen|Josh Allen||', 'qb-lamar-jackson|Lamar Jackson||'].join('\n'),
    );
  });

  it('parses confirmed final stat rows against the saved slate', () => {
    expect(
      parseFinalStatRows({
        contest,
        rawRows: ['qb-josh-allen|Josh Allen|325|3', 'qb-lamar-jackson|Lamar Jackson|330|4'].join('\n'),
      }),
    ).toEqual([
      { playerId: 'qb-josh-allen', playerName: 'Josh Allen', finalStat: 325, passingTouchdowns: 3 },
      { playerId: 'qb-lamar-jackson', playerName: 'Lamar Jackson', finalStat: 330, passingTouchdowns: 4 },
    ]);
  });

  it('rejects mismatched player names or missing rows', () => {
    expect(() =>
      parseFinalStatRows({
        contest,
        rawRows: 'qb-josh-allen|Wrong Name|325|3',
      }),
    ).toThrow('Add 2 final stat rows before running results.');

    expect(() =>
      parseFinalStatRows({
        contest,
        rawRows: ['qb-josh-allen|Wrong Name|325|3', 'qb-lamar-jackson|Lamar Jackson|330|4'].join('\n'),
      }),
    ).toThrow('must keep the saved player name');
  });

  it('allows only locked-to-final contest states', () => {
    expect(canFinalizeContestStatus('locked')).toBe(true);
    expect(canFinalizeContestStatus('final')).toBe(true);
    expect(canFinalizeContestStatus('open')).toBe(false);
    expect(canFinalizeContestStatus('paid_out')).toBe(false);
  });
});
