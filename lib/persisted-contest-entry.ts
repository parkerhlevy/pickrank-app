import { randomUUID } from 'node:crypto';

export const persistedContestEntryCookieName = 'pickrank_demo_entry_data';

export type PersistedContestEntrySource = 'default_assigned' | 'user_saved';

export type PersistedContestEntry = {
  entryId: string;
  contestId: string;
  lineupOrder: string[];
  lastSavedAt: string | null;
  source: PersistedContestEntrySource;
  createdAt: string;
  updatedAt: string;
};

type PersistedContestEntryCookiePayload = Record<string, PersistedContestEntry>;

export function getPersistedContestEntry(
  contestId: string,
  cookieValue: string | undefined,
  players: string[],
) {
  const payload = parsePersistedContestEntryCookie(cookieValue, players);

  return payload[contestId] ?? null;
}

export function ensurePersistedContestEntry({
  contestId,
  cookieValue,
  players,
  now = new Date().toISOString(),
}: {
  contestId: string;
  cookieValue: string | undefined;
  players: string[];
  now?: string;
}) {
  const payload = parsePersistedContestEntryCookie(cookieValue, players);
  const existingEntry = payload[contestId];

  if (existingEntry) {
    return {
      entry: existingEntry,
      cookieValue: JSON.stringify(payload),
      created: false,
    };
  }

  const entry: PersistedContestEntry = {
    entryId: `demo-entry-${randomUUID()}`,
    contestId,
    lineupOrder: [...players],
    lastSavedAt: null,
    source: 'default_assigned',
    createdAt: now,
    updatedAt: now,
  };

  payload[contestId] = entry;

  return {
    entry,
    cookieValue: JSON.stringify(payload),
    created: true,
  };
}

export function removePersistedContestEntry({
  contestId,
  cookieValue,
  players,
}: {
  contestId: string;
  cookieValue: string | undefined;
  players: string[];
}) {
  const payload = parsePersistedContestEntryCookie(cookieValue, players);

  delete payload[contestId];

  return JSON.stringify(payload);
}

export function savePersistedContestEntryLineup({
  contestId,
  cookieValue,
  players,
  order,
  now = new Date().toISOString(),
}: {
  contestId: string;
  cookieValue: string | undefined;
  players: string[];
  order: string[];
  now?: string;
}) {
  const payload = parsePersistedContestEntryCookie(cookieValue, players);
  const existingEntry = payload[contestId];

  if (!existingEntry) {
    throw new Error('No persisted entry exists for this contest.');
  }

  const normalizedOrder = normalizeLineupOrder(order, players);

  if (normalizedOrder.length !== order.length || normalizedOrder.some((player, index) => player !== order[index])) {
    throw new Error('Submitted lineup order is invalid.');
  }

  const updatedEntry: PersistedContestEntry = {
    ...existingEntry,
    lineupOrder: normalizedOrder,
    lastSavedAt: now,
    source: 'user_saved',
    updatedAt: now,
  };

  payload[contestId] = updatedEntry;

  return {
    entry: updatedEntry,
    cookieValue: JSON.stringify(payload),
  };
}

function parsePersistedContestEntryCookie(cookieValue: string | undefined, players: string[]) {
  if (!cookieValue) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(cookieValue) as Record<string, unknown>;

    return Object.fromEntries(
      Object.entries(parsedValue)
        .map(([contestId, entry]) => [contestId, normalizePersistedContestEntry(contestId, entry, players)] as const)
        .filter(([, entry]) => entry !== null),
    ) as PersistedContestEntryCookiePayload;
  } catch {
    return {};
  }
}

function normalizePersistedContestEntry(contestId: string, value: unknown, players: string[]) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const entry = value as Record<string, unknown>;
  const entryId = typeof entry.entryId === 'string' ? entry.entryId : null;
  const createdAt = typeof entry.createdAt === 'string' ? entry.createdAt : null;
  const updatedAt = typeof entry.updatedAt === 'string' ? entry.updatedAt : createdAt;

  if (!entryId || !createdAt || !updatedAt) {
    return null;
  }

  return {
    entryId,
    contestId,
    lineupOrder: normalizeLineupOrder(entry.lineupOrder, players),
    lastSavedAt: typeof entry.lastSavedAt === 'string' ? entry.lastSavedAt : null,
    source: entry.source === 'user_saved' ? 'user_saved' : 'default_assigned',
    createdAt,
    updatedAt,
  } satisfies PersistedContestEntry;
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
