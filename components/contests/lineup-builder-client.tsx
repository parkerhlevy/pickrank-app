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
  Save,
} from 'lucide-react';
import { ContestBoardStagePanel, ContestJourneyRail } from '@/components/contests/contest-board-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import {
  type LineupState,
  addLineupPlayer,
  getAvailablePlayers,
  hasUnsavedLineupChanges,
  moveLineupPlayer,
  removeLineupPlayer,
} from '@/lib/lineup-builder-state';
import { getContestEntrySteps } from '@/lib/contest-entry-flow';

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
  };
  entryId: string;
  initialLineupState: LineupState;
  isEditable: boolean;
  stateCopy: {
    badge: string;
    title: string;
    description: string;
  };
  flowSteps: ReturnType<typeof getContestEntrySteps>;
};

type DragSession = {
  pointerId: number;
  player: string;
  moveHandler: (event: PointerEvent) => void;
  endHandler: (event: PointerEvent) => void;
};

export function LineupBuilderClient({
  contest,
  entryId,
  initialLineupState,
  isEditable,
  stateCopy,
  flowSteps,
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

  const hasUnsavedChanges = hasUnsavedLineupChanges(lineupState.selectedOrder, lineupState.savedSelectedOrder);
  const needsMoreSelections = lineupState.selectedOrder.length < 10;
  const saveStateLabel = !isEditable
    ? 'Read only'
    : hasUnsavedChanges
      ? 'Unsaved changes'
      : lineupState.source === 'user_saved'
        ? 'Saved'
        : 'Assigned order';
  const saveStateDescription = !isEditable
    ? 'This saved lineup is locked for review.'
    : hasUnsavedChanges
      ? 'Review the ranked order below, then save before leaving.'
      : lineupState.source === 'user_saved'
        ? 'Your saved lineup is current.'
        : 'This assigned lineup is current until you make a change.';

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
      setSaveError('Choose and rank 10 quarterbacks before saving this lineup.');
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
        throw new Error(payload.message ?? 'Unable to save this lineup right now.');
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
      setSaveError(error instanceof Error ? error.message : 'Unable to save this lineup right now.');
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
      <div ref={pageRootRef} className="space-y-6 pb-28" data-lineup-client-ready="false">
        <Button asChild variant="ghost" size="sm" className="-ml-3 justify-start">
          <Link href={`/contests/${contest.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Contest Details
          </Link>
        </Button>

        <div className="screen-header space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow">Lineup Builder</p>
                <span className="status-pill status-pill-muted shrink-0">Single Entry</span>
                <span className={`status-pill shrink-0 ${hasUnsavedChanges ? 'border-amber-200 bg-amber-50 text-amber-800' : ''}`}>
                  {saveStateLabel}
                </span>
              </div>
              <h1 className="text-3xl font-black leading-tight">Build Your Lineup</h1>
            </div>
            <Link href="/how-it-works" className="inline-link shrink-0">
              How It Works
            </Link>
          </div>
          <p className="text-muted-foreground">
            Choose your top 10 quarterbacks from the full slate, rank them, and save one lineup for this single contest entry before lock.
          </p>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div className="metric-tile">
              <p className="text-xs text-muted-foreground">Ranked</p>
              <p className="numeric mt-1 font-black">{lineupState.selectedOrder.length}/10</p>
            </div>
            <div className="metric-tile">
              <p className="text-xs text-muted-foreground">Slate Left</p>
              <p className="numeric mt-1 font-black">{lineupState.availablePlayers.length}</p>
            </div>
            <div className="metric-tile">
              <p className="text-xs text-muted-foreground">Save State</p>
              <p className="mt-1 font-black">{saveStateLabel}</p>
            </div>
          </div>
        </div>

        {showSavedBanner ? (
          <Notice
            variant="success"
            icon={CheckCircle2}
            title="Lineup Saved"
            description="Lineup saved. You can edit your rankings until lock."
            badge="Saved"
          />
        ) : null}

        {saveError ? (
          <Notice
            variant="error"
            icon={AlertTriangle}
            title="Lineup Not Saved"
            description={saveError}
            badge="Action needed"
          />
        ) : null}

        {!isEditable ? (
          <Notice
            variant="warning"
            icon={Clock}
            title="Lineup Locked"
            description="This contest is no longer open, so your saved lineup is now read-only."
            badge="Read only"
          />
        ) : null}

        <ContestBoardStagePanel
          title={contest.title}
          description={
            isEditable
              ? 'This is the active board for your saved entry. Build the ranked 10 from the full slate, then save before lock.'
              : 'This contest board is locked for review. Your saved ranking is shown below without editing controls.'
          }
          slateLabel={contest.slate}
          statCategory={contest.statCategory}
          lockTimeLabel={contest.lockTime.replace('Locks ', '')}
          rankedCountLabel={`${lineupState.selectedOrder.length}/10 ranked`}
          stateLabel={isEditable ? 'Editing open' : 'Read only'}
        />

        <ContestJourneyRail currentStage={isEditable ? 'build' : 'lock'} />

        <Card className="section-card overflow-hidden">
          <CardHeader className="section-card-header">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>{contest.title}</CardTitle>
                <CardDescription className="text-slate-300">
                  {isEditable
                    ? 'This saved entry is ready for lineup edits until contest lock.'
                    : 'This saved entry is now locked and available for read-only review.'}
                </CardDescription>
              </div>
              <span className="status-pill shrink-0 bg-white/10 border-white/15 text-white">{contest.status}</span>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 pt-5 text-sm">
            <ContextTile label="Lock Time" value={contest.lockTime.replace('Locks ', '')} />
            <ContextTile label="Beta Entry Cost" value={contest.entryFeeCents === 0 ? '$0.00' : contest.entryFee} />
            <ContextTile label="Lineup State" value={isEditable ? 'Editing open' : 'Locked for review'} />
            <ContextTile label="Saved Entry" value={lineupState.source === 'user_saved' ? 'User saved' : 'Assigned order'} />
          </CardContent>
        </Card>

        <Card className="section-card overflow-hidden">
          <CardHeader className="section-card-header">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Entry Progress</CardTitle>
                <CardDescription className="text-slate-300">{stateCopy.description}</CardDescription>
              </div>
              <span className="status-pill status-pill-muted shrink-0 bg-white/10 text-white border-white/15">{stateCopy.badge}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {flowSteps.map((step) => (
              <div key={step.key} className="detail-row items-start text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">
                    Step {step.stepNumber}: {step.label}
                  </span>
                  <span
                    className={
                      step.status === 'current'
                        ? 'font-bold text-primary'
                        : step.status === 'complete'
                          ? 'text-emerald-700'
                          : 'text-muted-foreground'
                    }
                  >
                    {step.status === 'current' ? 'Current' : step.status === 'complete' ? 'Complete' : 'Next'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{step.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="section-card">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{isEditable ? 'Your Ranked 10' : 'Locked Lineup'}</CardTitle>
                <CardDescription>
                  {isEditable
                    ? 'Choose and rank your top 10 quarterbacks by passing yards, then use Save Lineup before contest lock.'
                    : 'This is your saved lineup for the current entry. Rankings are read-only because the contest is locked.'}
                </CardDescription>
              </div>
              <span className="numeric status-pill shrink-0">
                {isEditable ? `${lineupState.selectedOrder.length}/10 Ranked` : 'Read Only'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Notice
              variant={isEditable ? 'warning' : 'muted'}
              icon={isEditable ? AlertTriangle : Clock}
              title={isEditable ? 'Lineups Lock' : 'Locked lineup'}
              description={
                isEditable
                  ? `Save all changes before ${contest.lockTime.replace('Locks ', '')}.`
                  : `This lineup is locked and available for review after ${contest.lockTime.replace('Locks ', '')}.`
              }
              badge={contest.lockTime.replace('Locks ', '')}
            />
            <div className="soft-panel text-sm">
              <p className="font-medium">{isEditable ? 'Before you save' : 'Saved lineup status'}</p>
              <p className="text-muted-foreground">
                {isEditable
                  ? 'Add quarterbacks from the available slate until you have 10, then press and hold the drag handle to rank them before saving.'
                  : 'This lineup reflects the saved order on your entry when the contest locked.'}
              </p>
            </div>
            <div className="section-card-muted px-3 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{isEditable ? 'Lineup Progress' : 'Saved Lineup Status'}</p>
                  <p className="text-muted-foreground">
                    {isEditable && needsMoreSelections
                      ? `${10 - lineupState.selectedOrder.length} more quarterback${10 - lineupState.selectedOrder.length === 1 ? '' : 's'} needed before you can save.`
                      : isEditable
                        ? 'All 10 lineup spots are filled and ready to rank.'
                        : 'All 10 saved lineup spots are locked in for this entry.'}
                  </p>
                </div>
                <span className="numeric status-pill shrink-0">{lineupState.selectedOrder.length}/10 Ranked</span>
              </div>
            </div>
            <div className="space-y-2">
              {lineupState.selectedOrder.map((name, index) => {
                const savedIndex = lineupState.savedSelectedOrder.indexOf(name);
                const isSavedRank = savedIndex === index;
                const wasPreviouslySaved = savedIndex !== -1;
                const rankStateLabel = draggingPlayer === name
                  ? 'Drop target'
                  : isSavedRank
                    ? 'Saved rank'
                    : wasPreviouslySaved
                      ? `Moved from #${savedIndex + 1}`
                      : 'New selection';
                const rankStateClass = isSavedRank
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800';

                return (
                  <div
                    key={name}
                    data-lineup-player={name}
                    className={`section-card flex items-center gap-3 border-l-4 border-l-primary px-3 py-3 text-sm transition-[background-color,border-color,box-shadow,scale] ${
                      draggingPlayer === name ? 'scale-[0.99] border-primary bg-blue-50 shadow-md' : ''
                    }`}
                  >
                    <div className="numeric flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-base font-black text-white">
                      #{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{name}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[0.6875rem] font-black uppercase tracking-[0.04em] ${rankStateClass}`}>
                          {rankStateLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {draggingPlayer === name
                          ? 'Move into place, then release to drop.'
                          : isEditable
                            ? 'Hold the grip, drag through the ranked list, and release to reorder.'
                            : 'Saved rank is locked for this contest.'}
                      </p>
                    </div>
                    <div className="ml-auto grid shrink-0 grid-cols-2 gap-1">
                      {isEditable ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-11 w-11 min-h-11 min-w-11 rounded-full px-0"
                          onClick={() => handleRemovePlayer(name)}
                          aria-label={`Remove ${name} from your ranked lineup`}
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
                            className="h-11 w-11 min-h-11 min-w-11 rounded-full px-0"
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
                            className="h-11 w-11 min-h-11 min-w-11 rounded-full px-0"
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
                        className={`h-11 w-11 min-h-11 min-w-11 shrink-0 rounded-full border-2 px-0 shadow-sm touch-none ${
                          draggingPlayer === name
                            ? 'cursor-grabbing border-primary bg-blue-100'
                            : 'cursor-grab border-slate-300 bg-white hover:border-primary hover:bg-blue-50'
                        }`}
                        onPointerDown={(event) => handleDragStart(name, event)}
                        disabled={!isEditable}
                        aria-label={isEditable ? `Press and hold to drag ${name}` : `${name} lineup position is locked`}
                      >
                        <GripVertical className="h-5 w-5 text-slate-700" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Available Quarterbacks</p>
                  <p className="text-xs text-muted-foreground">Use the full 15-player slate to fill any open lineup spots.</p>
                </div>
                <span className="numeric status-pill status-pill-muted shrink-0">{lineupState.availablePlayers.length} Left in Slate</span>
              </div>
              {lineupState.availablePlayers.length > 0 ? (
                <div className="grid gap-2">
                  {lineupState.availablePlayers.map((name) => (
                    <div key={name} className="detail-row items-center text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {isEditable
                            ? needsMoreSelections
                              ? 'Available to add to your ranked 10.'
                              : 'Remove someone from your ranked 10 before adding another.'
                            : 'Not included in the saved lineup.'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="shrink-0 gap-1"
                        onClick={() => handleAddPlayer(name)}
                        disabled={!isEditable || lineupState.selectedOrder.length >= 10}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-card text-sm text-muted-foreground">
                  All 10 lineup spots are filled. Reorder your saved lineup above or remove someone to open a spot.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="section-card">
          <CardHeader>
            <CardTitle>Lineup Status</CardTitle>
            <CardDescription>
              {isEditable
                ? 'Keep this single-entry flow focused on one saved order that can still be edited until lock.'
                : 'This single-entry lineup is saved and locked for viewing only.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
              <p>
                {isEditable
                  ? hasUnsavedChanges
                    ? 'You have unsaved ranking changes on this entry.'
                    : needsMoreSelections
                      ? 'Finish selecting 10 quarterbacks to create a save-ready lineup.'
                      : 'Your saved order is up to date for this entry.'
                  : 'This contest is locked, so the saved order cannot be edited.'}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Save className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
              <p>
                {lineupState.lastSavedAt
                  ? `Last saved at ${new Date(lineupState.lastSavedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`
                  : isEditable
                    ? 'Save Lineup will create the first saved order for this contest entry.'
                    : 'This lineup was assigned before editing closed for the contest.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="action-panel sticky bottom-20">
          <div className="mb-3 flex items-start gap-3 text-sm">
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
              <p className="text-xs text-muted-foreground">{showSavedBanner ? 'Lineup saved just now.' : saveStateDescription}</p>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={handleSaveLineup}
            disabled={!isEditable || !hasUnsavedChanges || isSaving || needsMoreSelections}
          >
            {isEditable ? (isSaving ? 'Saving Lineup...' : 'Save Lineup') : `${contest.status} - Read Only`}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {!isEditable
              ? 'This contest is no longer editable.'
              : hasUnsavedChanges
                ? needsMoreSelections
                  ? 'Choose all 10 quarterbacks before saving this lineup.'
                  : 'Save your current order before leaving this screen.'
                : 'Add or reorder quarterbacks to activate the next Save Lineup action.'}
          </p>
        </div>
      </div>

      {showLeaveModal ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-4 sm:items-center sm:justify-center">
          <div
            className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-lineup-dialog-title"
            aria-describedby="unsaved-lineup-dialog-description"
          >
            <h2 id="unsaved-lineup-dialog-title" className="text-lg font-black">
              Unsaved lineup changes
            </h2>
            <p id="unsaved-lineup-dialog-description" className="mt-2 text-sm text-muted-foreground">
              Save before leaving?
            </p>
            <div className="mt-4 space-y-2">
              <Button className="w-full" onClick={handleSaveAndLeave}>
                Save Lineup
              </Button>
              <Button className="w-full" variant="secondary" onClick={handleDiscardChanges}>
                Discard Changes
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
      ) : null}
    </>
  );
}

function ContextTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-tile">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="numeric mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
