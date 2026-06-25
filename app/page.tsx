import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, PlayCircle, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const landingVideoPath = '/marketing/pickrank-overview.mp4';
const hasLandingVideo = existsSync(join(process.cwd(), 'public', landingVideoPath));

const proofPoints = [
  {
    title: 'Simple first impression',
    description: 'Show the concept quickly before the full contest loop is fully live.',
    icon: Sparkles,
  },
  {
    title: 'Skill-based positioning',
    description: 'Keep the message centered on rankings, accuracy, and competition.',
    icon: ShieldCheck,
  },
  {
    title: 'Direct conversion path',
    description: 'Move interested users straight into the existing sign-up flow.',
    icon: Users,
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
              Pre-launch preview
            </div>
            <div className="space-y-3">
              <Image
                src="/brand/pickrank-wordmark-clean.png"
                alt="PickRank"
                width={240}
                height={86}
                className="h-auto w-[184px] sm:w-[220px]"
                priority
              />
              <h1 className="max-w-xl text-4xl font-black leading-tight text-white sm:text-5xl">
                A simple new way to compete on NFL knowledge.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                PickRank is a skill-based ranking contest where players order a slate around one stat category, then climb
                the standings based on how close they were to the final results.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="text-sm font-bold">
                <Link href="/auth">
                  Sign Up
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="text-sm font-bold">
                <Link href="/how-it-works">See How It Works</Link>
              </Button>
            </div>
            <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
              <div className="rounded-xl border border-white/12 bg-white/6 px-4 py-3">Public preview is live now</div>
              <div className="rounded-xl border border-white/12 bg-white/6 px-4 py-3">Contest concept in plain language</div>
              <div className="rounded-xl border border-white/12 bg-white/6 px-4 py-3">Account path ready at sign-up</div>
            </div>
          </div>

          <Card className="border-white/10 bg-slate-950/40 text-white shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
            <CardHeader className="space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100">
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                Product preview
              </div>
              <CardTitle className="text-2xl">See the idea before the full launch.</CardTitle>
            </CardHeader>
            <CardContent>
              {hasLandingVideo ? (
                <video
                  controls
                  preload="metadata"
                  className="aspect-video w-full rounded-xl border border-white/10 bg-slate-900"
                  aria-label="PickRank product preview video"
                >
                  <source src={landingVideoPath} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-slate-900/70 p-6 text-center">
                  <PlayCircle className="mb-3 h-10 w-10 text-blue-200" aria-hidden="true" />
                  <p className="text-lg font-semibold text-white">Preview video coming next</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
                    This landing page is ready for a pre-rendered Remotion video at
                    <span className="font-mono text-slate-100"> public{landingVideoPath}</span>.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {proofPoints.map(({ title, description, icon: Icon }) => (
          <Card key={title} className="border-slate-200/80 bg-white/95">
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
        <Card>
          <CardHeader>
            <CardTitle>What PickRank is</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Users rank players from a contest slate around one stat category.</p>
            <p>After the games finish, scores are based on how close those rankings were to the final order.</p>
            <p>The goal is simple: reward sports judgment, not luck-driven play.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What to do next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              If you want early access, create an account now and follow the product as the contest experience continues to
              tighten up.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="sm:flex-1">
                <Link href="/auth">Create Account</Link>
              </Button>
              <Button asChild variant="secondary" className="sm:flex-1">
                <Link href="/contests">Browse the App Preview</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
