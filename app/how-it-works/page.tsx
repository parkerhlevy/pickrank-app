import Link from 'next/link';
import { BarChart3, CheckCircle2, ListOrdered, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HowItWorksPage() {
  const steps = [
    {
      icon: ListOrdered,
      title: 'Choose a contest',
      description: 'Open Contests show the stat category, lock time, entry fee, prize pool, and current entry count.',
    },
    {
      icon: CheckCircle2,
      title: 'Rank the slate',
      description: 'For the MVP QB format, select and rank your top 10 from a 15-quarterback slate.',
    },
    {
      icon: BarChart3,
      title: 'Compare final stats',
      description: 'Your final score is based on rank differential against the official final ranking for the contest stat.',
    },
    {
      icon: Trophy,
      title: 'See final results',
      description: 'Leaderboard and payout views appear after final results are calculated in a future phase.',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm font-medium text-primary">How It Works</p>
        <h1 className="text-3xl font-bold tracking-tight">Skill-based ranking contests</h1>
        <p className="text-muted-foreground">
          PickRank is a contest app where players rank a slate by a specific stat category and compete for the prize pool.
        </p>
      </section>

      <div className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <Card key={step.title}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle className="text-base">{step.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scoring Snapshot</CardTitle>
          <CardDescription>Differential scoring direction from the simulation work.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            ['Rank differential', 'Add the distance between each saved rank and the official final rank.'],
            ['Lower score wins', 'The best lineup has the lowest total differential across the 10 ranked picks.'],
            ['Tiebreaker 1', 'Most exact picks.'],
            ['Tiebreaker 2', 'Most one-off-or-better picks.'],
            ['Tiebreaker 3', 'Closest placement of the actual QB1.'],
          ].map(([label, description]) => (
            <div key={label} className="rounded-lg border px-3 py-2">
              <p className="font-semibold">{label}</p>
              <p className="text-muted-foreground">{description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button asChild className="w-full">
        <Link href="/contests">View Open Contests</Link>
      </Button>
    </div>
  );
}
