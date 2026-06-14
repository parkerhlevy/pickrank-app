import Link from 'next/link';
import { ArrowLeft, CheckCircle2, CircleAlert, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getContestById } from '@/lib/phase-0-demo';

export default async function EntrySuccessPage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = await params;
  const contest = getContestById(contestId);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-3 justify-start">
        <Link href={`/contests/${contest.id}/payment`}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Payment Review
        </Link>
      </Button>

      <div className="screen-header space-y-2">
        <p className="eyebrow">Entry Success</p>
        <h1 className="text-3xl font-black leading-tight">{contest.title}</h1>
        <p className="text-muted-foreground">
          This screen previews the post-entry moment in the MVP flow without claiming a real entry was confirmed.
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-emerald-950 text-white">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            You&apos;re Ready to Build
          </CardTitle>
          <CardDescription className="text-emerald-200">
            Visual-only placeholder. Payment capture, entry creation, and lineup creation are still future work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5 text-sm">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <p className="font-semibold">Next step: Build Your Lineup</p>
            <p className="mt-1 text-muted-foreground">Users should feel routed forward after entry review, even before real transaction wiring exists.</p>
          </div>
          <div className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>No wallet funds were debited and no contest entry was created from this placeholder screen.</p>
          </div>
          <div className="flex items-start gap-2">
            <ListChecks className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>Single-entry language stays intact: the next destination is one dedicated lineup builder for this contest.</p>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-20 rounded-lg border bg-white p-3 shadow-lg">
        <Button asChild className="w-full">
          <Link href={`/contests/${contest.id}/lineup`}>Build Your Lineup</Link>
        </Button>
      </div>
    </div>
  );
}
