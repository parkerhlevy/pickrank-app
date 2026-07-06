import { describe, expect, it, vi } from 'vitest';
import {
  buildInSeasonLiveRefreshMessage,
  loadInSeasonLiveValidationContestInput,
  refreshInSeasonLiveContestSnapshot,
} from '../../lib/in-season-live-validation';

describe('in-season live validation helper', () => {
  it('loads an existing contest slug plus saved slate rows into the live validation input shape', async () => {
    const supabase = {
      from(table: string) {
        return {
          select: (_columns: string) => ({
            eq: (_column: string, _value: string) => {
              if (table === 'contests') {
                return {
                  single: async () => ({
                    data: {
                      id: 'contest-row-id',
                      slug: 'week-2-qb-passing-yards-live-2026',
                      title: 'Week 2 QB Passing Yards Live Validation',
                      season: 2026,
                      week: 2,
                    },
                    error: null,
                  }),
                };
              }

              return Promise.resolve({
                data: [
                  {
                    player_id: 'qb-josh-allen',
                    provider_player_id: '19801',
                    provider_game_id: '5001',
                    display_name: 'Josh Allen',
                    player_name: 'Josh Allen',
                    team_abbreviation: 'BUF',
                    opponent_abbreviation: 'MIA',
                    home_away: 'home',
                    sort_order_internal: 2,
                  },
                  {
                    player_id: 'qb-joe-burrow',
                    provider_player_id: '21693',
                    provider_game_id: '5000',
                    display_name: 'Joe Burrow',
                    player_name: 'Joe Burrow',
                    team_abbreviation: 'CIN',
                    opponent_abbreviation: 'BAL',
                    home_away: 'away',
                    sort_order_internal: 1,
                  },
                ],
                error: null,
              });
            },
          }),
        };
      },
    };

    await expect(
      loadInSeasonLiveValidationContestInput('week-2-qb-passing-yards-live-2026', async () => supabase as never),
    ).resolves.toEqual({
      id: 'week-2-qb-passing-yards-live-2026',
      title: 'Week 2 QB Passing Yards Live Validation',
      season: 2026,
      week: 2,
      slatePlayers: [
        expect.objectContaining({
          playerId: 'qb-joe-burrow',
          providerPlayerId: '21693',
        }),
        expect.objectContaining({
          playerId: 'qb-josh-allen',
          providerPlayerId: '19801',
        }),
      ],
    });
  });

  it('loads the contest before fetching a live provisional snapshot', async () => {
    const supabase = {
      from(table: string) {
        return {
          select: (_columns: string) => ({
            eq: (_column: string, _value: string) => {
              if (table === 'contests') {
                return {
                  single: async () => ({
                    data: {
                      id: 'contest-row-id',
                      slug: 'week-2-qb-passing-yards-live-2026',
                      title: 'Week 2 QB Passing Yards Live Validation',
                      season: 2026,
                      week: 2,
                    },
                    error: null,
                  }),
                };
              }

              return Promise.resolve({
                data: [
                  {
                    player_id: 'qb-josh-allen',
                    provider_player_id: '19801',
                    provider_game_id: '5001',
                    display_name: 'Josh Allen',
                    player_name: 'Josh Allen',
                    team_abbreviation: 'BUF',
                    opponent_abbreviation: 'MIA',
                    home_away: 'home',
                    sort_order_internal: 1,
                  },
                ],
                error: null,
              });
            },
          }),
        };
      },
    };

    const fetchSnapshot = vi.fn(async (contest) => ({
      snapshotId: 'snapshot-2',
      snapshotKind: 'provisional_order' as const,
      contestId: contest.id,
      providerKey: 'sportsdataio_live',
      providerName: 'SportsDataIO Live',
      providerSnapshotTime: '2026-09-10T22:00:00.000Z',
      createdAt: '2026-09-10T22:00:00.000Z',
      status: 'validated' as const,
      gamesTotal: 1,
      gamesScheduled: 0,
      gamesInProgress: 1,
      gamesFinal: 0,
      allGamesFinal: false,
      metadata: null,
      rows: [],
    }));

    await expect(
      refreshInSeasonLiveContestSnapshot('week-2-qb-passing-yards-live-2026', {
        createSupabaseClient: async () => supabase as never,
        fetchSnapshot,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        snapshotId: 'snapshot-2',
        providerKey: 'sportsdataio_live',
      }),
    );

    expect(fetchSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'week-2-qb-passing-yards-live-2026',
        season: 2026,
        week: 2,
      }),
    );
  });

  it('builds a concise live refresh success message', () => {
    expect(
      buildInSeasonLiveRefreshMessage('Week 2 QB Passing Yards Live Validation', {
        snapshotId: 'snapshot-2',
        snapshotKind: 'provisional_order',
        contestId: 'week-2-qb-passing-yards-live-2026',
        providerKey: 'sportsdataio_live',
        providerName: 'SportsDataIO Live',
        providerSnapshotTime: '2026-09-10T22:00:00.000Z',
        createdAt: '2026-09-10T22:00:00.000Z',
        status: 'validated',
        gamesTotal: 10,
        gamesScheduled: 4,
        gamesInProgress: 3,
        gamesFinal: 3,
        allGamesFinal: false,
        metadata: null,
        rows: [],
      }),
    ).toBe(
      'Saved SportsDataIO live provisional snapshot for Week 2 QB Passing Yards Live Validation: 4 scheduled, 3 in progress, 3 final.',
    );
  });
});
