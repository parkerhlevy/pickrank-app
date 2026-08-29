import Link from 'next/link';
import { ArrowRight, BarChart3, CheckCircle2, ListOrdered, ShieldCheck, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BackLinkButton } from '@/components/ui/back-link-button';
import { getHowItWorksReturn } from '@/lib/how-it-works-navigation';
import { launchMode } from '@/lib/launch-mode';

const howToEnterSteps = [
  {
    icon: ListOrdered,
    title: 'Choose a contest',
    description: 'Contests show the stat category that you will be ranking.',
  },
  {
    icon: CheckCircle2,
    title: 'Build your board',
    description: 'Pick and rank your top 10 from the 20-player pool.',
  },
  {
    icon: BarChart3,
    title: 'Get your score',
    description:
      'Once all players from the player pool have played, your board will be compared to the official ranked results. The closer your selections were, the better your score. Lowest total wins.',
  },
  {
    icon: Trophy,
    title: 'See where you finished',
    description:
      'Final leaderboard of all contestants will appear after scoring is confirmed approximately 24 hours after the final game finishes. See where you placed in the Results tab.',
  },
];

const scoringRules = [
  ['Rank differential', 'Add the distance between each selected rank and the official final rank.'],
  ['Lowest score wins', 'The best board has the lowest total differential across the 10 ranked picks.'],
];

const tiebreakers = [
  ['Tiebreaker 1', 'Most exact picks.'],
  ['Tiebreaker 2', 'Most 1 differential picks'],
  ['Tiebreaker 3', 'Closest placement of the actual QB1.'],
];

const rankDifferentialExampleRows = [
  ['Josh Allen', '1st', '2nd', '1'],
  ['Joe Burrow', '2nd', '1st', '1'],
  ['Patrick Mahomes', '3rd', '14th', '11'],
];

type HowItWorksPageProps = {
  searchParams?: Promise<{
    returnTo?: string;
  }>;
};

export default async function HowItWorksPage({ searchParams }: HowItWorksPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const returnContext = getHowItWorksReturn(resolvedSearchParams.returnTo);

  return (
    <div className="space-y-6">
      {returnContext ? (
        <BackLinkButton href={returnContext.href} transitionTypes={['nav-back']}>
          Return to {returnContext.label}
        </BackLinkButton>
      ) : null}

      <section className="screen-header space-y-3">
        <div>
          <div className="space-y-3">
            <p className="eyebrow">How it works</p>
            <h1 className="text-3xl font-black leading-tight">Skill-based ranking contests</h1>
            <p className="text-muted-foreground">
              PickRank asks one question: how well do you know players and their matchups?
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="PickRank basics">
        <GuideTile
          icon={ListOrdered}
          title="Pick 10 from 20"
          description="Start with the player pool. Pick and rank the top 10 by the contest stat category."
        />
        <ScoringGuideTile />
        <GuideTile
          icon={ShieldCheck}
          title={launchMode.mode === 'early_access_beta' ? 'Early access beta' : launchMode.displayName}
          description="Contests have no payouts or cash prizes during beta period"
        />
      </section>

      <Card className="section-card">
        <CardHeader>
          <CardTitle>How to enter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {howToEnterSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="step-row">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold tracking-[0.08em] text-muted-foreground">Step {index + 1}</p>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <Link href="#rank-differential-example" className="inline-link inline-flex items-center gap-1">
            View example
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>

      <Card className="section-card" id="rank-differential-example">
        <CardHeader>
          <CardTitle>How scoring works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {scoringRules.map(([label, description]) => (
            <div key={label} className="section-card-muted px-3 py-3">
              <p className="font-semibold">{label}</p>
              <p className="text-muted-foreground">{description}</p>
            </div>
          ))}
          <p className="pt-2 font-black">In case of a tie...</p>
          {tiebreakers.map(([label, description]) => (
            <div key={label} className="section-card-muted px-3 py-3">
              <p className="font-semibold">{label}</p>
              <p className="text-muted-foreground">{description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <CardTitle>Rank differential example</CardTitle>
          <CardDescription>Each board rank is compared to the official final rank for that stat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-bold text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2">
                    Selected player
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Your rank
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Final rank
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Difference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rankDifferentialExampleRows.map(([player, yourRank, finalRank, difference]) => (
                  <tr key={player}>
                    <td className="px-3 py-2 font-medium">{player}</td>
                    <td className="numeric px-3 py-2 font-medium">{yourRank}</td>
                    <td className="numeric px-3 py-2">{finalRank}</td>
                    <td className="numeric px-3 py-2 font-black">{difference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="section-card-muted p-3 text-muted-foreground">
            Add the differences across all 10 ranked picks. Lowest total differential wins, with tiebreakers applied if
            needed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ScoringGuideTile() {
  return (
    <div className="section-card space-y-3 p-3 sm:min-h-[8rem] sm:p-4">
      <div className="flex items-center gap-3 sm:items-start">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
        </div>
        <p className="font-black leading-tight">Lowest score wins</p>
      </div>
      <div
        className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5"
        role="img"
        aria-label="Example: Your rank 2nd, final rank 5th, difference 3 points."
      >
        <RankExampleCell label="Your rank" value="2nd" />
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <RankExampleCell label="Final rank" value="5th" />
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <RankExampleCell label="Difference" value="+3" suffix="points" />
      </div>
      <p className="text-sm leading-6 text-muted-foreground">Exact ranks add 0. Lowest total wins.</p>
    </div>
  );
}

function RankExampleCell({ label, suffix, value }: { label: string; suffix?: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-2 text-center" aria-hidden="true">
      <p className="text-[0.625rem] font-semibold leading-tight text-muted-foreground">{label}</p>
      <p className="numeric mt-1 text-base font-black leading-none text-primary">{value}</p>
      {suffix ? <p className="mt-1 text-[0.625rem] font-bold leading-none text-primary">{suffix}</p> : null}
    </div>
  );
}

function GuideTile({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ListOrdered;
  title: string;
  description: string;
}) {
  return (
    <div className="section-card flex flex-row items-start gap-3 p-3 sm:min-h-[8rem] sm:flex-col sm:gap-2 sm:p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="font-black leading-tight">{title}</p>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
