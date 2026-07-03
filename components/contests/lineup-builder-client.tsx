'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  GripVertical,
  Plus,
  X,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    lockTime: string;
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

  const hasUnsavedChanges = hasUnsavedLineupChanges(lineupState.selectedOrder, lineupState.savedSelectedOrder);
  const needsMoreSelections = lineupState.selectedOrder.length < 10;

  useEffect(() => {
    setLineupState(initialLineupState);
  }, [initialLineupState]);

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
  }, [hasUnsavedChanges]);

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

  return (
    <>
      <div className="space-y-5 pb-24">
        <Button asChild variant="ghost" size="sm" className="-ml-3 justify-start">
          <Link href={`/contests/${contest.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Contest Details
          </Link>
        </Button>

        <div className="screen-header space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Lineup Builder</p>
              <h1 className="text-3xl font-black leading-tight">Build Your Lineup</h1>
            </div>
            <span className="status-pill">{contest.entryFee} Entry</span>
          </div>
          <p className="text-muted-foreground">
            Step 4 is where lineup editing actually happens. Choose 10 quarterbacks from the full slate, rank them, and save one lineup for your single contest entry until lock.
          </p>
        </div>

        {showSavedBanner ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" aria-hidden="true" />
              <div>
                <p className="font-semibold">Lineup Saved</p>
                <p className="text-emerald-800">Lineup saved. You can edit your rankings until lock.</p>
              </div>
            </div>
          </div>
        ) : null}

        {saveError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-red-700" aria-hidden="true" />
              <div>
                <p className="font-semibold">Lineup Not Saved</p>
                <p className="text-red-800">{saveError}</p>
              </div>
            </div>
          </div>
        ) : null}

        {!isEditable ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 text-amber-700" aria-hidden="true" />
              <div>
                <p className="font-semibold">Lineup Locked</p>
                <p className="text-amber-800">This contest is no longer open, so your saved lineup is now read-only.</p>
              </div>
            </div>
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{stateCopy.title}</CardTitle>
                <CardDescription>{stateCopy.description}</CardDescription>
              </div>
              <span className="status-pill shrink-0">{stateCopy.badge}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {flowSteps.map((step) => (
              <div key={step.key} className="rounded-lg border bg-white px-3 py-3 text-sm">
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

        <Card>
          <CardHeader>
            <CardTitle>{contest.title}</CardTitle>
            <CardDescription>
              {isEditable
                ? 'Choose and rank your top 10 quarterbacks by passing yards, then use Save Lineup before contest lock.'
                : 'This is your saved lineup for the current entry. Rankings are read-only because the contest is locked.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" aria-hidden="true" />
                <span className="font-bold uppercase tracking-[0.02em] text-red-700">Lineups Lock</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-600" aria-hidden="true" />
                <span className="text-base font-black">{contest.lockTime.replace('Locks ', '')}</span>
              </div>
            </div>
            <div className="soft-panel text-sm">
              <p className="font-medium">{isEditable ? 'Before you save' : 'Saved lineup status'}</p>
              <p className="text-muted-foreground">
                {isEditable
                  ? 'Add quarterbacks from the available slate until you have 10, then press and hold the drag handle to rank them before saving.'
                  : 'This lineup reflects the saved order on your entry when the contest locked.'}
              </p>
            </div>
            <div className="rounded-lg border bg-slate-50 px-3 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Your Ranked 10</p>
                  <p className="text-muted-foreground">
                    {needsMoreSelections
                      ? `${10 - lineupState.selectedOrder.length} more quarterback${10 - lineupState.selectedOrder.length === 1 ? '' : 's'} needed before you can save.`
                      : 'All 10 lineup spots are filled and ready to rank.'}
                  </p>
                </div>
                <span className="status-pill shrink-0">{lineupState.selectedOrder.length}/10 Selected</span>
              </div>
            </div>
            <div className="space-y-2">
              {lineupState.selectedOrder.map((name, index) => (
                <div
                  key={name}
                  data-lineup-player={name}
                  className={`flex items-center justify-between rounded-lg border bg-white px-3 py-3 text-sm shadow-sm transition ${
                    draggingPlayer === name ? 'border-primary bg-blue-50 shadow-md' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {index + 1}. {name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {draggingPlayer === name
                        ? 'Move into place, then release to drop'
                        : lineupState.savedSelectedOrder[index] === name
                          ? 'Saved position'
                          : 'Unsaved position change'}
                    </p>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    {isEditable ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 rounded-full px-0"
                        onClick={() => handleRemovePlayer(name)}
                        aria-label={`Remove ${name} from your ranked lineup`}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className={`h-11 w-11 shrink-0 rounded-full px-0 touch-none ${
                        draggingPlayer === name ? 'cursor-grabbing' : 'cursor-grab'
                      }`}
                      onPointerDown={(event) => handleDragStart(name, event)}
                      disabled={!isEditable}
                      aria-label={isEditable ? `Press and hold to drag ${name}` : `${name} lineup position is locked`}
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Available Quarterbacks</p>
                  <p className="text-xs text-muted-foreground">Use the full 15-player slate to fill any open lineup spots.</p>
                </div>
                <span className="text-xs text-muted-foreground">{lineupState.availablePlayers.length} Remaining</span>
              </div>
              <div className="space-y-2">
                {lineupState.availablePlayers.map((name) => (
                  <div key={name} className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">
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
                      className="gap-1"
                      onClick={() => handleAddPlayer(name)}
                      disabled={!isEditable || lineupState.selectedOrder.length >= 10}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
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

        <div className="sticky bottom-20 rounded-lg border bg-white p-3 shadow-lg">
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
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-black">Unsaved lineup changes</h2>
            <p className="mt-2 text-sm text-muted-foreground">Save before leaving?</p>
            <div className="mt-4 space-y-2">
              <Button className="w-full" onClick={handleSaveAndLeave}>
                Save Lineup
              </Button>
              <Button className="w-full" variant="secondary" onClick={handleDiscardChanges}>
                Discard Changes
              </Button>
              <Button
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
