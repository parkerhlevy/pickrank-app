'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Clock,
  GripVertical,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Presence } from '@/components/ui/presence';
import {
  type LineupState,
  addLineupPlayer,
  getAvailablePlayers,
  hasUnsavedLineupChanges,
  moveLineupPlayer,
  removeLineupPlayer,
} from '@/lib/lineup-builder-state';

type LineupBuilderClientProps = {
  contest: {
    id: string;
    title: string;
    entryFee: string;
    entryFeeCents: number;
    lockTime: string;
    slate: string;
    statCategory: string;
    status: string;
    slatePlayers: PlayerContext[];
  };
  entryId: string;
  initialLineupState: LineupState;
  isEditable: boolean;
};

type DragSession = {
  pointerId: number;
  player: string;
  moveHandler: (event: PointerEvent) => void;
  endHandler: (event: PointerEvent) => void;
};

type PlayerContext = {
  displayName: string;
  teamAbbreviation: string;
  opponentAbbreviation: string;
  homeAway: 'home' | 'away';
};

type PlayerDisplayContext = {
  nameLabel: string;
  matchupLabel: string;
};

export function LineupBuilderClient({
  contest,
  entryId,
  initialLineupState,
  isEditable,
}: LineupBuilderClientProps) {
  const router = useRouter();
  const [lineupState, setLineupState] = useState<LineupState>(initialLineupState);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [draggingPlayer, setDraggingPlayer] = useState<string | null>(null);
  const pendingSaveAndLeaveHref = useRef<string | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const cancelLeaveButtonRef = useRef<HTMLButtonElement | null>(null);
  const pageRootRef = useRef<HTMLDivElement | null>(null);
  const initialLineupStateKey = JSON.stringify(initialLineupState);
  const previousInitialLineupStateKey = useRef(initialLineupStateKey);
  const lockTimeLabel = contest.lockTime.replace('Locks ', '');
  const playerContextByName = new Map(
    contest.slatePlayers.map((player) => [player.displayName, formatPlayerDisplayContext(player)]),
  );

  const hasUnsavedChanges = hasUnsavedLineupChanges(lineupState.selectedOrder, lineupState.savedSelectedOrder);
  const needsMoreSelections = lineupState.selectedOrder.length < 10;
  const saveStateLabel = !isEditable
    ? 'Read only'
    : hasUnsavedChanges
      ? 'Unsaved changes'
      : lineupState.source === 'user_saved'
        ? 'Saved'
        : 'Selected order';
  const saveStateDescription = !isEditable
    ? 'This saved board is locked for review.'
    : hasUnsavedChanges
      ? 'Review the ranked order below, then save before leaving.'
      : lineupState.source === 'user_saved'
        ? 'Your saved board is current.'
        : 'Your board is current until you make a change.';
  const savePanelClassName = hasUnsavedChanges
    ? 'action-panel sticky bottom-24 z-20 sm:bottom-20'
    : 'action-panel';

  useEffect(() => {
    if (previousInitialLineupStateKey.current === initialLineupStateKey) {
      return;
    }

    previousInitialLineupStateKey.current = initialLineupStateKey;
    setLineupState(initialLineupState);
  }, [initialLineupState, initialLineupStateKey]);

  useEffect(() => {
    pageRootRef.current?.setAttribute('data-lineup-client-ready', 'true');
  }, []);

  useEffect(() => {
    if (!showSavedBanner) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSavedBanner(false);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [showSavedBanner]);

  useEffect(() => {
    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (!isEditable || !hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);

    return () => window.removeEventListener('beforeunload', beforeUnloadHandler);
  }, [hasUnsavedChanges, isEditable]);

  useEffect(() => {
    const clickHandler = (event: MouseEvent) => {
      if (!hasUnsavedChanges) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest('a[href]');

      if (!link) {
        return;
      }

      const href = link.getAttribute('href');

      if (!href || href.startsWith('#') || href === window.location.pathname) {
        return;
      }

      if (href.startsWith('http') && !href.startsWith(window.location.origin)) {
        return;
      }

      event.preventDefault();
      setPendingHref(href.startsWith('http') ? new URL(href).pathname : href);
      setShowLeaveModal(true);
    };

    document.addEventListener('click', clickHandler, true);

    return () => document.removeEventListener('click', clickHandler, true);
  }, [hasUnsavedChanges, isEditable]);

  useEffect(() => () => clearDragSession(), []);

  useEffect(() => {
    if (!showLeaveModal) {
      return;
    }

    cancelLeaveButtonRef.current?.focus();

    const keydownHandler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      setPendingHref(null);
      setShowLeaveModal(false);
    };

    document.addEventListener('keydown', keydownHandler);

    return () => document.removeEventListener('keydown', keydownHandler);
  }, [showLeaveModal]);

  function clearDragSession() {
    const session = dragSessionRef.current;

    if (!session) {
      return;
    }

    window.removeEventListener('pointermove', session.moveHandler);
    window.removeEventListener('pointerup', session.endHandler);
    window.removeEventListener('pointercancel', session.endHandler);
    document.body.style.userSelect = '';
    document.body.style.touchAction = '';
    dragSessionRef.current = null;
    setDraggingPlayer(null);
  }

  function handleDragStart(player: string, event: React.PointerEvent<HTMLButtonElement>) {
    if (!isEditable || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    event.preventDefault();
    clearDragSession();
    setDraggingPlayer(player);
    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none';

    const moveHandler = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== event.pointerId) {
        return;
      }

      moveEvent.preventDefault();

      const target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const targetRow = target instanceof Element ? target.closest<HTMLElement>('[data-lineup-player]') : null;
      const targetPlayer = targetRow?.dataset.lineupPlayer;

      if (!targetPlayer || targetPlayer === player) {
        return;
      }

      setLineupState((currentState) => {
        const fromIndex = currentState.selectedOrder.indexOf(player);
        const toIndex = currentState.selectedOrder.indexOf(targetPlayer);

        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
          return currentState;
        }

        return {
          ...currentState,
          selectedOrder: moveLineupPlayer(currentState.selectedOrder, fromIndex, toIndex),
        };
      });
    };

    const endHandler = (endEvent: PointerEvent) => {
      if (endEvent.pointerId !== event.pointerId) {
        return;
      }

      clearDragSession();
    };

    dragSessionRef.current = {
      pointerId: event.pointerId,
      player,
      moveHandler,
      endHandler,
    };

    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', endHandler);
    window.addEventListener('pointercancel', endHandler);
  }

  async function handleSaveLineup() {
    if (!isEditable || !hasUnsavedChanges || isSaving) {
      return;
    }

    if (needsMoreSelections) {
      setSaveError('Choose and rank 10 quarterbacks before saving your board.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/contests/${contest.id}/lineup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId,
          order: lineupState.selectedOrder,
        }),
      });
      const payload = (await response.json()) as {
        savedOrder?: string[];
        source?: LineupState['source'];
        lastSavedAt?: string | null;
        message?: string;
      };

      if (!response.ok || !payload.savedOrder || !payload.source) {
        throw new Error(payload.message ?? 'Unable to save your board right now.');
      }

      const nextState: LineupState = {
        selectedOrder: [...payload.savedOrder],
        savedSelectedOrder: [...payload.savedOrder],
        availablePlayers: getAvailablePlayers(
          lineupState.selectedOrder.concat(lineupState.availablePlayers),
          payload.savedOrder,
        ),
        source: payload.source,
        lastSavedAt: payload.lastSavedAt ?? null,
      };

      setLineupState(nextState);
      setShowSavedBanner(true);

      if (pendingSaveAndLeaveHref.current) {
        const nextHref = pendingSaveAndLeaveHref.current;

        pendingSaveAndLeaveHref.current = null;
        setShowLeaveModal(false);
        setPendingHref(null);
        router.push(nextHref);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save your board right now.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscardChanges() {
    setLineupState((currentState) => ({
      ...currentState,
      selectedOrder: [...currentState.savedSelectedOrder],
      availablePlayers: getAvailablePlayers(
        currentState.selectedOrder.concat(currentState.availablePlayers),
        currentState.savedSelectedOrder,
      ),
    }));

    if (pendingHref) {
      const nextHref = pendingHref;

      setPendingHref(null);
      setShowLeaveModal(false);
      router.push(nextHref);
      return;
    }

    setShowLeaveModal(false);
  }

  function handleSaveAndLeave() {
    if (!pendingHref) {
      return;
    }

    pendingSaveAndLeaveHref.current = pendingHref;
    handleSaveLineup();
  }

  function handleAddPlayer(player: string) {
    if (!isEditable) {
      return;
    }

    setSaveError(null);
    setLineupState((currentState) => {
      const nextSelectedOrder = addLineupPlayer(currentState.selectedOrder, player);

      return {
        ...currentState,
        selectedOrder: nextSelectedOrder,
        availablePlayers: getAvailablePlayers(
          currentState.selectedOrder.concat(currentState.availablePlayers),
          nextSelectedOrder,
        ),
      };
    });
  }

  function handleRemovePlayer(player: string) {
    if (!isEditable) {
      return;
    }

    setSaveError(null);
    setLineupState((currentState) => {
      const nextSelectedOrder = removeLineupPlayer(currentState.selectedOrder, player);

      return {
        ...currentState,
        selectedOrder: nextSelectedOrder,
        availablePlayers: getAvailablePlayers(
          currentState.selectedOrder.concat(currentState.availablePlayers),
          nextSelectedOrder,
        ),
      };
    });
  }

  function handleMovePlayer(player: string, direction: -1 | 1) {
    if (!isEditable) {
      return;
    }

    setSaveError(null);
    setLineupState((currentState) => {
      const fromIndex = currentState.selectedOrder.indexOf(player);
      const toIndex = fromIndex + direction;

      if (fromIndex === -1 || toIndex < 0 || toIndex >= currentState.selectedOrder.length) {
        return currentState;
      }

      return {
        ...currentState,
        selectedOrder: moveLineupPlayer(currentState.selectedOrder, fromIndex, toIndex),
      };
    });
  }

  return (
    <>
      <div ref={pageRootRef} className="space-y-4 pb-32 sm:space-y-6 sm:pb-36" data-lineup-client-ready="false">
        <Button asChild variant="ghost" size="sm" className="-ml-3 justify-start">
          <Link href={`/contests/${contest.id}`} transitionTypes={['nav-back']}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Contest details
          </Link>
        </Button>

        <div className="screen-header space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow">Board builder</p>
                <span className="status-pill status-pill-muted shrink-0">One entry per person</span>
              </div>
              <h1 className="text-2xl font-black leading-tight sm:text-3xl">Build your board</h1>
            </div>
            <Link href="/how-it-works" className="inline-link shrink-0">
              How it works
            </Link>
          </div>
          <p className="text-muted-foreground">
            Choose your top 10 quarterbacks from the player pool, rank them, and save your board before the contest locks.
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="metric-tile">
              <p className="text-xs text-muted-foreground">Ranked</p>
              <p className="numeric mt-1 font-black">{lineupState.selectedOrder.length}/10</p>
            </div>
            <div className="metric-tile">
              <p className="text-xs text-muted-foreground">Pool left</p>
              <p className="numeric mt-1 font-black">{lineupState.availablePlayers.length}</p>
            </div>
            <div className="metric-tile">
              <p className="text-xs text-muted-foreground">Board state</p>
              <p className="mt-1 font-black">{saveStateLabel}</p>
            </div>
            <div className="metric-tile">
              <p className="text-xs text-muted-foreground">Lock time</p>
              <p className="numeric mt-1 font-black">{lockTimeLabel}</p>
            </div>
          </div>
        </div>

        <Presence present={showSavedBanner} className="ui-presence-inline">
          <Notice
            variant="success"
            icon={CheckCircle2}
            title="Board saved"
            description="Board saved. You can edit your rankings until lock."
            badge="Saved"
          />
        </Presence>

        <Presence present={Boolean(saveError)} className="ui-presence-inline">
          <Notice
            variant="error"
            icon={AlertTriangle}
            title="Board not saved"
            description={saveError || ''}
            badge="Action needed"
          />
        </Presence>

        {!isEditable ? (
          <Notice
            variant="warning"
            icon={Clock}
            title="Board locked"
            description="This contest is no longer open, so your saved board is now read-only."
            badge="Read only"
          />
        ) : null}

        <Card className="section-card">
          <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
            <div className="grid gap-2 sm:flex sm:items-start sm:justify-between sm:gap-3">
              <div>
                <CardTitle>{isEditable ? 'Your board' : 'Locked board'}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="section-card-muted px-3 py-2.5 text-sm sm:py-3">
              <div className="grid gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3">
                <div>
                  <p className="font-semibold">{isEditable ? 'Board progress' : 'Saved board status'}</p>
                  <p className="text-muted-foreground">
                    {isEditable && needsMoreSelections
                      ? `${10 - lineupState.selectedOrder.length} more quarterback${10 - lineupState.selectedOrder.length === 1 ? '' : 's'} needed before you can save.`
                      : isEditable
                        ? 'All 10 board spots are filled and ready to rank.'
                        : 'All 10 saved board spots are locked in for this entry.'}
                  </p>
                </div>
                <span className="numeric status-pill shrink-0">{lineupState.selectedOrder.length}/10 ranked</span>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                {lineupState.selectedOrder.map((name, index) => {
                  const savedIndex = lineupState.savedSelectedOrder.indexOf(name);
                  const isSavedRank = savedIndex === index;
                  const wasPreviouslySaved = savedIndex !== -1;
                  const rankStateLabel = draggingPlayer === name
                    ? 'Moving'
                    : isSavedRank
                      ? 'Saved'
                      : wasPreviouslySaved
                        ? `Moved #${savedIndex + 1}`
                        : 'New';
                  const rankStateClass = isSavedRank
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800';
                  const playerContext = playerContextByName.get(name);

                  return (
                    <div
                      key={name}
                      data-lineup-player={name}
                      className={`section-card grid gap-2 border-l-4 border-l-primary px-2.5 py-2.5 text-sm transition-[background-color,border-color,box-shadow,scale] ${
                        draggingPlayer === name ? 'scale-[0.99] border-primary bg-blue-50 shadow-md' : ''
                      }`}
                    >
                      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2">
                        <div className="numeric flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-sm font-black text-white">
                          #{index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold leading-5">{playerContext?.nameLabel ?? name}</p>
                          {playerContext ? (
                            <p className="numeric mt-0.5 truncate text-xs text-muted-foreground">{playerContext.matchupLabel}</p>
                          ) : null}
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.6875rem] font-black ${rankStateClass}`}>
                          {rankStateLabel}
                        </span>
                      </div>
                      <div
                        className={`grid gap-1.5 border-t border-slate-100 pt-2 ${
                          isEditable ? 'grid-cols-4' : 'grid-cols-1'
                        }`}
                      >
                        {isEditable ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-11 min-h-11 w-full min-w-11 rounded-md px-0"
                            onClick={() => handleRemovePlayer(name)}
                            aria-label={`Remove ${name} from your board`}
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        ) : null}
                        {isEditable ? (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-11 min-h-11 w-full min-w-11 rounded-md px-0"
                              onClick={() => handleMovePlayer(name, -1)}
                              disabled={index === 0}
                              aria-label={`Move ${name} up one rank`}
                            >
                              <ArrowUp className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-11 min-h-11 w-full min-w-11 rounded-md px-0"
                              onClick={() => handleMovePlayer(name, 1)}
                              disabled={index === lineupState.selectedOrder.length - 1}
                              aria-label={`Move ${name} down one rank`}
                            >
                              <ArrowDown className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </>
                        ) : null}
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className={`h-11 min-h-11 w-full min-w-11 shrink-0 touch-none rounded-md border px-0 shadow-sm ${
                            draggingPlayer === name
                              ? 'cursor-grabbing border-primary bg-blue-100'
                              : 'cursor-grab border-slate-300 bg-white hover:border-primary hover:bg-blue-50'
                          }`}
                          onPointerDown={(event) => handleDragStart(name, event)}
                          disabled={!isEditable}
                          aria-label={isEditable ? `Press and hold to drag ${name}` : `${name} board position is locked`}
                        >
                          <GripVertical className="h-4 w-4 text-slate-700" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2 border-t pt-3">
                <div className="grid gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3">
                  <div>
                    <p className="font-semibold">Available quarterbacks</p>
                    <p className="text-xs text-muted-foreground">Fill any open board spots from the player pool.</p>
                  </div>
                  <span className="numeric status-pill status-pill-muted shrink-0">{lineupState.selectedOrder.length}/10 ranked</span>
                </div>
                {lineupState.availablePlayers.length > 0 ? (
                  <div className="grid gap-2">
                    {lineupState.availablePlayers.map((name) => {
                      const playerContext = playerContextByName.get(name);

                      return (
                        <div key={name} className="detail-row items-center px-3 py-2.5 text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{playerContext?.nameLabel ?? name}</p>
                            {playerContext ? (
                              <p className="numeric mt-1 truncate text-xs text-muted-foreground">{playerContext.matchupLabel}</p>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-10 shrink-0 gap-1 px-3 sm:h-9"
                            onClick={() => handleAddPlayer(name)}
                            disabled={!isEditable || lineupState.selectedOrder.length >= 10}
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Add
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state-card text-sm text-muted-foreground">
                    All 10 board spots are filled. Reorder your board or remove someone to open a spot.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className={savePanelClassName}>
          <div className="mb-3 grid gap-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  hasUnsavedChanges ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {hasUnsavedChanges ? (
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-black">{saveStateLabel}</p>
                <p className="text-xs text-muted-foreground">{showSavedBanner ? 'Board saved just now.' : saveStateDescription}</p>
              </div>
            </div>
            <div className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="numeric">Lock: {lockTimeLabel}</span>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={handleSaveLineup}
            disabled={!isEditable || !hasUnsavedChanges || isSaving || needsMoreSelections}
          >
            {isEditable ? (isSaving ? 'Saving board...' : 'Save board') : `${contest.status} - Read only`}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {!isEditable
              ? 'This contest is no longer editable.'
              : hasUnsavedChanges
                ? needsMoreSelections
                  ? 'Choose all 10 quarterbacks before saving your board.'
                  : 'Save your current board before leaving this screen.'
                : 'Add, change, or reorder players to save your board.'}
          </p>
        </div>
      </div>

      <Presence present={showLeaveModal} className="ui-presence-modal">
        <div className="modal-backdrop fixed inset-0 z-50 flex items-end bg-slate-950/50 p-4 sm:items-center sm:justify-center">
          <div
            className="modal-panel w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-lineup-dialog-title"
            aria-describedby="unsaved-lineup-dialog-description"
          >
            <h2 id="unsaved-lineup-dialog-title" className="text-lg font-black">
              Unsaved board changes
            </h2>
            <p id="unsaved-lineup-dialog-description" className="mt-2 text-sm text-muted-foreground">
              Save before leaving?
            </p>
            <div className="mt-4 space-y-2">
              <Button className="w-full" onClick={handleSaveAndLeave}>
                Save board
              </Button>
              <Button className="w-full" variant="secondary" onClick={handleDiscardChanges}>
                Discard changes
              </Button>
              <Button
                ref={cancelLeaveButtonRef}
                className="w-full"
                variant="ghost"
                onClick={() => {
                  setPendingHref(null);
                  setShowLeaveModal(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Presence>
    </>
  );
}

function formatPlayerDisplayContext(player: PlayerContext): PlayerDisplayContext {
  return {
    nameLabel: `${player.displayName} (${player.teamAbbreviation})`,
    matchupLabel: `${player.homeAway === 'home' ? 'vs.' : '@'} ${player.opponentAbbreviation}`,
  };
}
