import { contestRankedPlayerCount } from '@/lib/contest-rules';

export type LineupSource = 'entry_created' | 'default_assigned' | 'user_saved';

export type LineupState = {
  selectedOrder: string[];
  savedSelectedOrder: string[];
  availablePlayers: string[];
  source: LineupSource;
  lastSavedAt: string | null;
};

export function createDefaultLineupState({
  players,
  defaultSelectedOrder,
}: {
  players: string[];
  defaultSelectedOrder: string[];
}): LineupState {
  const normalizedSelectedOrder = normalizeSelectedOrder(defaultSelectedOrder, players);

  return {
    selectedOrder: normalizedSelectedOrder,
    savedSelectedOrder: normalizedSelectedOrder,
    availablePlayers: getAvailablePlayers(players, normalizedSelectedOrder),
    source: 'default_assigned',
    lastSavedAt: null,
  };
}

export function createLineupStateFromSavedOrder({
  players,
  savedOrder,
  defaultSelectedOrder,
  source,
  lastSavedAt,
}: {
  players: string[];
  savedOrder: string[];
  defaultSelectedOrder: string[];
  source: LineupSource;
  lastSavedAt: string | null;
}): LineupState {
  const normalizedSavedOrder = normalizeSelectedOrder(savedOrder, players, defaultSelectedOrder);

  return {
    selectedOrder: normalizedSavedOrder,
    savedSelectedOrder: normalizedSavedOrder,
    availablePlayers: getAvailablePlayers(players, normalizedSavedOrder),
    source,
    lastSavedAt,
  };
}

export function moveLineupPlayer(selectedOrder: string[], fromIndex: number, toIndex: number) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= selectedOrder.length ||
    toIndex >= selectedOrder.length ||
    fromIndex === toIndex
  ) {
    return selectedOrder;
  }

  const nextOrder = [...selectedOrder];
  const [movedPlayer] = nextOrder.splice(fromIndex, 1);

  nextOrder.splice(toIndex, 0, movedPlayer);

  return nextOrder;
}

export function addLineupPlayer(selectedOrder: string[], player: string) {
  if (selectedOrder.includes(player) || selectedOrder.length >= contestRankedPlayerCount) {
    return selectedOrder;
  }

  return [...selectedOrder, player];
}

export function removeLineupPlayer(selectedOrder: string[], player: string) {
  if (!selectedOrder.includes(player)) {
    return selectedOrder;
  }

  return selectedOrder.filter((currentPlayer) => currentPlayer !== player);
}

export function hasUnsavedLineupChanges(selectedOrder: string[], savedSelectedOrder: string[]) {
  if (selectedOrder.length !== savedSelectedOrder.length) {
    return true;
  }

  return selectedOrder.some((player, index) => player !== savedSelectedOrder[index]);
}

export function getAvailablePlayers(players: string[], selectedOrder: string[]) {
  return players.filter((player) => !selectedOrder.includes(player));
}

function normalizeSelectedOrder(value: unknown, players: string[], fallbackOrder?: string[]) {
  const fallbackSelectedOrder = Array.isArray(fallbackOrder)
    ? fallbackOrder
        .filter((player, index, allPlayers) => players.includes(player) && allPlayers.indexOf(player) === index)
        .slice(0, contestRankedPlayerCount)
    : players.slice(0, contestRankedPlayerCount);

  if (!Array.isArray(value)) {
    return fallbackSelectedOrder;
  }

  // New contest entries intentionally start with an empty board.
  if (value.length === 0) {
    return [];
  }

  const filteredPlayers = value.filter((item): item is string => typeof item === 'string' && players.includes(item));

  if (filteredPlayers.length !== contestRankedPlayerCount || new Set(filteredPlayers).size !== contestRankedPlayerCount) {
    return fallbackSelectedOrder;
  }

  return filteredPlayers;
}
