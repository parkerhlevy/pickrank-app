import { describe, expect, it } from 'vitest';
import {
  addLineupPlayer,
  createDefaultLineupState,
  createLineupStateFromSavedOrder,
  getAvailablePlayers,
  hasUnsavedLineupChanges,
  moveLineupPlayer,
  removeLineupPlayer,
} from '../../lib/lineup-builder-state';

const demoPlayers = ['Josh Allen', 'Joe Burrow', 'Derek Carr', 'Lamar Jackson', 'Jalen Hurts'];
const demoDefaultOrder = ['Josh Allen', 'Joe Burrow', 'Derek Carr', 'Lamar Jackson', 'Jalen Hurts'];

describe('lineup builder state', () => {
  it('starts with the provided default ranked order and the remaining available players', () => {
    expect(
      createDefaultLineupState({
        players: [...demoPlayers, 'Patrick Mahomes', 'Jared Goff', 'Dak Prescott', 'Brock Purdy', 'Tua Tagovailoa'],
        defaultSelectedOrder: [...demoDefaultOrder, 'Patrick Mahomes', 'Jared Goff', 'Dak Prescott', 'Brock Purdy', 'Tua Tagovailoa'],
      }),
    ).toEqual({
      selectedOrder: ['Josh Allen', 'Joe Burrow', 'Derek Carr', 'Lamar Jackson', 'Jalen Hurts', 'Patrick Mahomes', 'Jared Goff', 'Dak Prescott', 'Brock Purdy', 'Tua Tagovailoa'],
      savedSelectedOrder: ['Josh Allen', 'Joe Burrow', 'Derek Carr', 'Lamar Jackson', 'Jalen Hurts', 'Patrick Mahomes', 'Jared Goff', 'Dak Prescott', 'Brock Purdy', 'Tua Tagovailoa'],
      availablePlayers: [],
      source: 'default_assigned',
      lastSavedAt: null,
    });
  });

  it('moves players into a new placeholder order', () => {
    expect(moveLineupPlayer(demoPlayers, 0, 2)).toEqual([
      'Joe Burrow',
      'Derek Carr',
      'Josh Allen',
      'Lamar Jackson',
      'Jalen Hurts',
    ]);
  });

  it('detects unsaved changes from the saved order', () => {
    expect(hasUnsavedLineupChanges(demoPlayers, ['Joe Burrow', 'Josh Allen', 'Derek Carr'])).toBe(true);
    expect(hasUnsavedLineupChanges(demoPlayers, demoPlayers)).toBe(false);
  });

  it('builds the client state from a saved entry order', () => {
    expect(
      createLineupStateFromSavedOrder({
        players: [...demoPlayers, 'Patrick Mahomes', 'Jared Goff', 'Dak Prescott', 'Brock Purdy', 'Tua Tagovailoa'],
        savedOrder: ['Joe Burrow', 'Josh Allen', 'Derek Carr', 'Lamar Jackson', 'Jalen Hurts', 'Patrick Mahomes', 'Jared Goff', 'Dak Prescott', 'Brock Purdy', 'Tua Tagovailoa'],
        defaultSelectedOrder: ['Josh Allen', 'Joe Burrow', 'Derek Carr', 'Lamar Jackson', 'Jalen Hurts', 'Patrick Mahomes', 'Jared Goff', 'Dak Prescott', 'Brock Purdy', 'Tua Tagovailoa'],
        source: 'user_saved',
        lastSavedAt: '2026-06-18T15:00:00.000Z',
      }),
    ).toEqual({
      selectedOrder: ['Joe Burrow', 'Josh Allen', 'Derek Carr', 'Lamar Jackson', 'Jalen Hurts', 'Patrick Mahomes', 'Jared Goff', 'Dak Prescott', 'Brock Purdy', 'Tua Tagovailoa'],
      savedSelectedOrder: ['Joe Burrow', 'Josh Allen', 'Derek Carr', 'Lamar Jackson', 'Jalen Hurts', 'Patrick Mahomes', 'Jared Goff', 'Dak Prescott', 'Brock Purdy', 'Tua Tagovailoa'],
      availablePlayers: [],
      source: 'user_saved',
      lastSavedAt: '2026-06-18T15:00:00.000Z',
    });
  });

  it('builds an empty client board for a newly created entry', () => {
    expect(
      createLineupStateFromSavedOrder({
        players: [...demoPlayers, 'Patrick Mahomes'],
        savedOrder: [],
        defaultSelectedOrder: demoDefaultOrder,
        source: 'entry_created',
        lastSavedAt: null,
      }),
    ).toEqual({
      selectedOrder: [],
      savedSelectedOrder: [],
      availablePlayers: [...demoPlayers, 'Patrick Mahomes'],
      source: 'entry_created',
      lastSavedAt: null,
    });
  });

  it('adds and removes players from the ranked lineup', () => {
    expect(addLineupPlayer(['Josh Allen'], 'Joe Burrow')).toEqual(['Josh Allen', 'Joe Burrow']);
    expect(removeLineupPlayer(['Josh Allen', 'Joe Burrow'], 'Josh Allen')).toEqual(['Joe Burrow']);
  });

  it('derives the remaining available players from the full slate', () => {
    expect(getAvailablePlayers(['Josh Allen', 'Joe Burrow', 'Derek Carr'], ['Joe Burrow'])).toEqual([
      'Josh Allen',
      'Derek Carr',
    ]);
  });
});
