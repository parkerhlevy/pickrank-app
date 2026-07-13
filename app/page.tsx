import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Brain, CalendarDays, PlayCircle, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const landingVideoPath = '/marketing/pickrank-landing-video-locked-in-final.mp4';
const landingVideoPosterPath = '/marketing/pickrank-landing-thumb.png';
const hasLandingVideo = existsSync(join(process.cwd(), 'public', landingVideoPath));

const whyPickRankCards = [
  {
    title: 'No drafting. No season-long commitment.',
    description: 'One slate. One ranking. One week at a time.',
    icon: CalendarDays,
  },
  {
    title: 'Your sports knowledge actually matters.',
    description: 'The closer your rankings are to the final results, the better you score.',
    icon: Brain,
  },
  {
    title: 'Easy to play. Hard to master.',
    description: 'Anyone can rank 10 players. Getting the order right is another story.',
    icon: Trophy,
  },
];

const steps = [
  {
    title: 'Start with the slate',
    description: 'Each week, you’ll get 15 players competing in one stat category.',
  },
  {
    title: 'Rank your top 10',
    description: 'Choose who you think will finish highest and put them in order.',
  },
  {
    title: 'See how you stack up',
    description: 'When the games are over, the most accurate rankings rise to the top and win cash prizes.',
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
                src="/brand/pickrank-wordmark-football-transparent-light.png"
                alt="PickRank"
                width={520}
                height={173}
                className="h-auto w-[240px] sm:w-[320px]"
                priority
              />
              <h1 className="max-w-xl text-4xl font-black leading-tight text-white sm:text-5xl">
                15 players. Pick 10. Rank them.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Think you know who’s going off this week? Prove it. Rank your top 10 players, then see how your picks
                stack up when the games are over and compete for the top spot.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="text-sm font-bold">
                <Link href="/auth">
                  Join the waitlist
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          <Card className="border-white/10 bg-slate-950/40 text-white shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
            <CardHeader className="space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100">
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                See PickRank in action
              </div>
              <CardTitle className="text-2xl">Learn the game in 34 seconds</CardTitle>
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

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black leading-tight">How PickRank works</h2>
          <p className="text-muted-foreground">Three simple steps. One weekly challenge.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
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
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black leading-tight">Why PickRank</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {whyPickRankCards.map(({ title, description, icon: Icon }) => (
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
        </div>
      </section>
    </div>
  );
}
