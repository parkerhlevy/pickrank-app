export type LineupSource = 'default_assigned' | 'user_saved';

export type LineupState = {
  order: string[];
  savedOrder: string[];
  source: LineupSource;
  lastSavedAt: string | null;
};

export function createDefaultLineupState(players: string[]): LineupState {
  return {
    order: [...players],
    savedOrder: [...players],
    source: 'default_assigned',
    lastSavedAt: null,
  };
}

export function createLineupStateFromSavedOrder({
  players,
  savedOrder,
  source,
  lastSavedAt,
}: {
  players: string[];
  savedOrder: string[];
  source: LineupSource;
  lastSavedAt: string | null;
}): LineupState {
  const normalizedSavedOrder = normalizeLineupOrder(savedOrder, players);

  return {
    order: normalizedSavedOrder,
    savedOrder: normalizedSavedOrder,
    source,
    lastSavedAt,
  };
}

export function moveLineupPlayer(order: string[], fromIndex: number, toIndex: number) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= order.length ||
    toIndex >= order.length ||
    fromIndex === toIndex
  ) {
    return order;
  }

  const nextOrder = [...order];
  const [movedPlayer] = nextOrder.splice(fromIndex, 1);

  nextOrder.splice(toIndex, 0, movedPlayer);

  return nextOrder;
}

export function hasUnsavedLineupChanges(order: string[], savedOrder: string[]) {
  if (order.length !== savedOrder.length) {
    return true;
  }

  return order.some((player, index) => player !== savedOrder[index]);
}

function normalizeLineupOrder(value: unknown, players: string[]) {
  if (!Array.isArray(value)) {
    return [...players];
  }

  const filteredPlayers = value.filter((item): item is string => typeof item === 'string' && players.includes(item));

  if (filteredPlayers.length !== players.length || new Set(filteredPlayers).size !== players.length) {
    return [...players];
  }

  return filteredPlayers;
}
