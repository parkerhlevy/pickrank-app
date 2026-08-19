import Link from 'next/link';
import { ArrowRight, BarChart3, CheckCircle2, ListOrdered, ShieldCheck, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function HowItWorksPage() {
  return (
    <div className="space-y-6">
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
        <GuideTile
          icon={BarChart3}
          title="Lowest score wins"
          description="Each miss distance adds points. Exact ranks add zero."
        />
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
