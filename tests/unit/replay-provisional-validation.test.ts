import { describe, expect, it, vi } from 'vitest';
import {
  buildReplayValidationContestInput,
  buildReplayValidationRefreshMessage,
  refreshReplayValidationContestSnapshot,
  replayValidationContestId,
} from '../../lib/replay-provisional-validation';

describe('replay provisional validation helper', () => {
  it('builds the hidden 2025 validation contest with the aligned slate', () => {
    const contest = buildReplayValidationContestInput();

    expect(contest).toEqual(
      expect.objectContaining({
        id: replayValidationContestId,
        title: 'Week 1 QB Passing Yards Replay Validation',
        season: 2025,
        week: 1,
      }),
    );
    expect(contest.slatePlayers).toHaveLength(15);
    expect(contest.slatePlayers[2]).toEqual(
      expect.objectContaining({
        playerId: 'qb-kyler-murray',
        displayName: 'Kyler Murray',
      }),
    );
    expect(contest.slatePlayers.map((player) => player.displayName)).not.toContain('Derek Carr');
  });

  it('upserts the hidden validation contest before fetching a fresh provisional snapshot', async () => {
    const calls: Array<{ table: string; kind: string; payload?: unknown }> = [];
    const supabase = {
      from(table: string) {
        return {
          upsert: async (payload: unknown) => {
            calls.push({ table, kind: 'upsert', payload });
            return { error: null };
          },
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { id: 'contest-row-id' }, error: null }),
            }),
          }),
          delete: () => ({
            eq: async () => {
              calls.push({ table, kind: 'delete' });
              return { error: null };
            },
          }),
          insert: async (payload: unknown) => {
            calls.push({ table, kind: 'insert', payload });
            return { error: null };
          },
        };
      },
    };
    const fetchSnapshot = vi.fn(async (contest) => ({
      snapshotId: 'snapshot-1',
      snapshotKind: 'provisional_order' as const,
      contestId: contest.id,
      providerKey: 'sportsdataio_replay',
      providerName: 'SportsDataIO Replay',
      providerSnapshotTime: '2026-07-04T22:00:00.000Z',
      createdAt: '2026-07-04T22:00:00.000Z',
      status: 'validated' as const,
      gamesTotal: 10,
      gamesScheduled: 0,
      gamesInProgress: 0,
      gamesFinal: 10,
      allGamesFinal: true,
      metadata: null,
      rows: [],
    }));

    await expect(
      refreshReplayValidationContestSnapshot({
        createSupabaseClient: async () => supabase as never,
        fetchSnapshot,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        snapshotId: 'snapshot-1',
        contestId: replayValidationContestId,
      }),
    );

    expect(fetchSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        id: replayValidationContestId,
        season: 2025,
        week: 1,
        slatePlayers: expect.arrayContaining([
          expect.objectContaining({ playerId: 'qb-josh-allen', providerPlayerId: '19801' }),
        ]),
      }),
    );
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: 'contests', kind: 'upsert' }),
        expect.objectContaining({ table: 'contest_slate_players', kind: 'delete' }),
        expect.objectContaining({ table: 'contest_slate_players', kind: 'insert' }),
        expect.objectContaining({ table: 'contest_validation_results', kind: 'upsert' }),
      ]),
    );
  });

  it('builds a concise admin refresh success message', () => {
    expect(
      buildReplayValidationRefreshMessage({
        snapshotId: 'snapshot-1',
        snapshotKind: 'provisional_order',
        contestId: replayValidationContestId,
        providerKey: 'sportsdataio_replay',
        providerName: 'SportsDataIO Replay',
        providerSnapshotTime: '2026-07-04T22:00:00.000Z',
        createdAt: '2026-07-04T22:00:00.000Z',
        status: 'validated',
        gamesTotal: 10,
        gamesScheduled: 1,
        gamesInProgress: 2,
        gamesFinal: 7,
        allGamesFinal: false,
        metadata: null,
        rows: [],
      }),
    ).toBe(
      'Saved Replay provisional snapshot for Week 1 QB Passing Yards Replay Validation: 1 scheduled, 2 in progress, 7 final.',
    );
  });
});
