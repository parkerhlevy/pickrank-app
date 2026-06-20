import { describe, expect, it } from 'vitest';
import {
  createDefaultLineupState,
  createLineupStateFromSavedOrder,
  hasUnsavedLineupChanges,
  moveLineupPlayer,
} from '../../lib/lineup-builder-state';

const demoPlayers = ['Josh Allen', 'Joe Burrow', 'Derek Carr'];

describe('lineup builder state', () => {
  it('starts with a complete default lineup and default_assigned source metadata', () => {
    expect(createDefaultLineupState(demoPlayers)).toEqual({
      order: demoPlayers,
      savedOrder: demoPlayers,
      source: 'default_assigned',
      lastSavedAt: null,
    });
  });

  it('moves players into a new placeholder order', () => {
    expect(moveLineupPlayer(demoPlayers, 0, 2)).toEqual(['Joe Burrow', 'Derek Carr', 'Josh Allen']);
  });

  it('detects unsaved changes from the saved order', () => {
    expect(hasUnsavedLineupChanges(demoPlayers, ['Joe Burrow', 'Josh Allen', 'Derek Carr'])).toBe(true);
    expect(hasUnsavedLineupChanges(demoPlayers, demoPlayers)).toBe(false);
  });

  it('builds the client state from a saved entry order', () => {
    expect(
      createLineupStateFromSavedOrder({
        players: demoPlayers,
        savedOrder: ['Joe Burrow', 'Josh Allen', 'Derek Carr'],
        source: 'user_saved',
        lastSavedAt: '2026-06-18T15:00:00.000Z',
      }),
    ).toEqual({
      order: ['Joe Burrow', 'Josh Allen', 'Derek Carr'],
      savedOrder: ['Joe Burrow', 'Josh Allen', 'Derek Carr'],
      source: 'user_saved',
      lastSavedAt: '2026-06-18T15:00:00.000Z',
    });
  });
});
