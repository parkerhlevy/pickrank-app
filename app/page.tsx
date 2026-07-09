import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, PlayCircle, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const landingVideoPath = '/marketing/pickrank-landing-video-locked-in-final.mp4';
const landingVideoPosterPath = '/marketing/pickrank-landing-thumb.png';
const hasLandingVideo = existsSync(join(process.cwd(), 'public', landingVideoPath));

const proofPoints = [
  {
    title: 'Clear weekly format',
    description: 'Each contest centers on one stat category, one slate, and one scoring system you can understand quickly.',
    icon: Sparkles,
  },
  {
    title: 'Skill-based scoring',
    description: 'Your score comes from how close each ranking lands to the final order, so sharp calls matter.',
    icon: ShieldCheck,
  },
  {
    title: 'Simple next step',
    description: 'Create your account now so you are ready to move from contest details into entry and lineup setup.',
    icon: Users,
  },
];

const steps = [
  {
    title: 'Start with the slate',
    description: 'Open the weekly contest, review the stat category, and see which 15 players are in the pool.',
  },
  {
    title: 'Rank your top 10',
    description: 'Build your lineup by choosing the 10 players you trust most and ordering them from first to tenth.',
  },
  {
    title: 'Let the final results decide it',
    description: 'After the games finish, lower miss scores rise to the top of the leaderboard and final results.',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8 pb-6">
      <section className="brand-panel relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.28),_transparent_55%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
              Early access
            </div>
            <div className="space-y-3">
              <Image
                src="/brand/pickrank-wordmark-white-pick.png"
                alt="PickRank"
                width={240}
                height={86}
                className="h-auto w-[184px] sm:w-[220px]"
                priority
              />
              <h1 className="max-w-xl text-4xl font-black leading-tight text-white sm:text-5xl">
                15 players. Pick 10. Rank them.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                PickRank is a skill-based ranking contest app where you study a slate, rank your top picks, and compete
                based on how close your order is to the final results.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="text-sm font-bold">
                <Link href="/auth">
                  Sign up for the waitlist
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          <Card className="border-white/10 bg-slate-950/40 text-white shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
            <CardHeader className="space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100">
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                Your new favorite fantasy game
              </div>
              <CardTitle className="text-2xl">Learn how to play today</CardTitle>
            </CardHeader>
            <CardContent>
              {hasLandingVideo ? (
                <video
                  controls
                  preload="metadata"
                  playsInline
                  poster={landingVideoPosterPath}
                  className="aspect-video w-full rounded-xl border border-white/10 bg-slate-900"
                  aria-label="PickRank product walkthrough video"
                >
                  <source src={landingVideoPath} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-slate-900/70 p-6 text-center">
                  <PlayCircle className="mb-3 h-10 w-10 text-blue-200" aria-hidden="true" />
                  <p className="text-lg font-semibold text-white">Walkthrough video coming soon</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
                    You can browse the live product screens now. A short walkthrough of contest entry and lineup setup is
                    on the way.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {steps.map((step, index) => (
          <Card key={step.title} className="section-card">
            <CardHeader className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                {index + 1}
              </div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {proofPoints.map(({ title, description, icon: Icon }) => (
          <Card key={title} className="section-card">
            <CardHeader className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="section-card">
          <CardHeader>
            <CardTitle>Why the format is easy to follow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>PickRank keeps each contest focused on one stat category at a time so the challenge is easy to follow.</p>
            <p>
              In the current MVP format, you rank your top 10 quarterbacks from a 15-player slate and receive a miss
              score based on how far each ranking lands from the final order.
            </p>
            <p>The goal is to make the path from contest details to final results feel understandable from the first screen.</p>
          </CardContent>
        </Card>

        <Card className="section-card">
          <CardHeader>
            <CardTitle>Take the next step</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Browse the contest flow now, then create your account when you want to be ready for entry and lineup setup.
            </p>
            <div className="section-card-muted space-y-3 px-4 py-4 text-sm">
              <div className="detail-row bg-white">
                <span>1. Browse Open Contests</span>
                <span className="font-medium text-foreground">Review the featured slate and lock timing</span>
              </div>
              <div className="detail-row bg-white">
                <span>2. See How It Works</span>
                <span className="text-muted-foreground">Learn the scoring and final-results flow</span>
              </div>
              <div className="detail-row bg-white">
                <span>3. Create Account</span>
                <span className="text-muted-foreground">Be ready for contest entry and lineup setup</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="sm:flex-1">
                <Link href="/auth">Create Account</Link>
              </Button>
              <Button asChild variant="secondary" className="sm:flex-1">
                <Link href="/how-it-works">See How It Works</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
