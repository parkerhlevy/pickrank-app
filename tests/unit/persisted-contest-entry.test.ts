import { describe, expect, it } from 'vitest';
import {
  ensurePersistedContestEntry,
  getPersistedContestEntry,
  removePersistedContestEntry,
  savePersistedContestEntryLineup,
} from '../../lib/persisted-contest-entry';

const demoPlayers = ['Josh Allen', 'Joe Burrow', 'Derek Carr'];

describe('persisted contest entry store', () => {
  it('creates a new entry with a saved default lineup order', () => {
    const result = ensurePersistedContestEntry({
      contestId: 'week-1',
      cookieValue: undefined,
      players: demoPlayers,
      now: '2026-06-19T10:00:00.000Z',
    });

    expect(result.created).toBe(true);
    expect(result.entry.contestId).toBe('week-1');
    expect(result.entry.lineupOrder).toEqual(demoPlayers);
    expect(result.entry.source).toBe('default_assigned');
  });

  it('reuses an existing entry and saved lineup order', () => {
    const created = ensurePersistedContestEntry({
      contestId: 'week-1',
      cookieValue: undefined,
      players: demoPlayers,
      now: '2026-06-19T10:00:00.000Z',
    });

    const reused = ensurePersistedContestEntry({
      contestId: 'week-1',
      cookieValue: created.cookieValue,
      players: demoPlayers,
      now: '2026-06-19T11:00:00.000Z',
    });

    expect(reused.created).toBe(false);
    expect(reused.entry.entryId).toBe(created.entry.entryId);
    expect(reused.entry.lineupOrder).toEqual(demoPlayers);
  });

  it('updates the saved lineup order for the current entry', () => {
    const created = ensurePersistedContestEntry({
      contestId: 'week-1',
      cookieValue: undefined,
      players: demoPlayers,
      now: '2026-06-19T10:00:00.000Z',
    });

    const saved = savePersistedContestEntryLineup({
      contestId: 'week-1',
      cookieValue: created.cookieValue,
      players: demoPlayers,
      order: ['Joe Burrow', 'Josh Allen', 'Derek Carr'],
      now: '2026-06-19T10:05:00.000Z',
    });

    expect(saved.entry.lineupOrder).toEqual(['Joe Burrow', 'Josh Allen', 'Derek Carr']);
    expect(saved.entry.source).toBe('user_saved');
    expect(saved.entry.lastSavedAt).toBe('2026-06-19T10:05:00.000Z');
  });

  it('removes an entry when the placeholder flow resets', () => {
    const created = ensurePersistedContestEntry({
      contestId: 'week-1',
      cookieValue: undefined,
      players: demoPlayers,
    });

    const clearedCookieValue = removePersistedContestEntry({
      contestId: 'week-1',
      cookieValue: created.cookieValue,
      players: demoPlayers,
    });

    expect(getPersistedContestEntry('week-1', clearedCookieValue, demoPlayers)).toBeNull();
  });
});
