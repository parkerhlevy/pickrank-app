import Link from 'next/link';
import { ArrowLeft, GripVertical, Lock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { demoLineupBuilderPlayers, getContestById } from '@/lib/phase-0-demo';

export default async function LineupBuilderPage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = await params;
  const contest = getContestById(contestId);

  return (
    <div className="space-y-5 pb-24">
      <Button asChild variant="ghost" size="sm" className="-ml-3 justify-start">
        <Link href={`/contests/${contest.id}/success`}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Entry Success
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
          Dedicated lineup editing screen for the single-entry MVP flow. This page is visual-only and does not persist rankings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{contest.title}</CardTitle>
          <CardDescription>Rank your top 10 quarterbacks by passing yards, then use Save Lineup before contest lock.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="soft-panel text-sm">
            <p className="font-medium">First-time hint</p>
            <p className="text-muted-foreground">Press and hold the drag handle to move players into your rankings.</p>
          </div>
          <div className="space-y-2">
            {demoLineupBuilderPlayers.map((name, index) => (
              <div key={name} className="flex items-center justify-between rounded-lg border bg-white px-3 py-3 text-sm shadow-sm">
                <div>
                  <p className="font-semibold">
                    {index + 1}. {name}
                  </p>
                  <p className="text-xs text-muted-foreground">Alphabetical default order placeholder</p>
                </div>
                <GripVertical className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Placeholder Guardrails</CardTitle>
          <CardDescription>This route is here to prove the flow shape, not to save or submit a real lineup.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>No lineup persistence, contest submission, scoring, or database writes happen on this screen.</p>
          </div>
          <div className="flex items-start gap-2">
            <Save className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>Save Lineup remains the correct MVP action label once real editing and save behavior are implemented.</p>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-20 rounded-lg border bg-white p-3 shadow-lg">
        <Button className="w-full" disabled>
          Save Lineup
        </Button>
      </div>
    </div>
  );
}
