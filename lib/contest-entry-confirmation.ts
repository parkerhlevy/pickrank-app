export function isNonProductionE2eEntryMode() {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.PICKRANK_E2E_AUTH === '1' &&
    process.env.PICKRANK_E2E_USE_FILE_STORE === '1'
  );
}

export function canConfirmContestEntry(entryFeeCents: number) {
  return entryFeeCents === 0 || isNonProductionE2eEntryMode();
}

export function getContestEntryConfirmationError(entryFeeCents: number) {
  if (canConfirmContestEntry(entryFeeCents)) {
    return null;
  }

  return 'Paid contest entry is unavailable until verified payment infrastructure is connected.';
}
