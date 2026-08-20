import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  enforcementReviewWindow,
  legalEffectiveDate,
  legalEntityDescription,
  legalLastUpdatedDate,
  legalPostalAddress,
  legalSupportEmail,
} from '@/lib/legal';

export default function AcceptableUsePage() {
  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Legal</p>
        <h1 className="text-3xl font-black leading-tight">Acceptable Use Policy</h1>
        <p className="text-muted-foreground">
          Effective {legalEffectiveDate}. Last updated {legalLastUpdatedDate}.
        </p>
      </section>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Free beta contest integrity</CardTitle>
          </div>
          <CardDescription>
            These rules protect account, entry, and contest integrity during PickRank Early Access Beta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-sm text-muted-foreground">
          <LegalSection title="Beta boundary">
            <p>
              PickRank Early Access Beta is free to play. There are no cash prizes, payouts, deposits, withdrawals, or other
              rewards of value. The beta depends on trustworthy contest data and fair participation.
            </p>
          </LegalSection>

          <LegalSection title="One person, one account">
            <p>
              You may create and use one PickRank account. Do not open, control, share, or use another person&apos;s account or
              create a second account after an account restriction or closure.
            </p>
          </LegalSection>

          <LegalSection title="No collusion">
            <p>
              Do not coordinate entries or share a board with another entrant before a contest locks. Do not submit an entry
              to distort the contest field or advantage another entrant.
            </p>
          </LegalSection>

          <LegalSection title="No automation or scraping">
            <p>
              Do not use bots, scripts, macros, browser extensions, scrapers, crawlers, or other automated systems to access
              PickRank, build or submit an entry, or manage an account.
            </p>
          </LegalSection>

          <LegalSection title="No circumvention or exploitation">
            <p>
              Do not provide false account or age information, bypass the 18+ beta age gate or another account restriction,
              exploit a bug or misconfigured contest, or interfere with PickRank security. Report errors to {legalSupportEmail}.
            </p>
          </LegalSection>

          <LegalSection title="General conduct">
            <p>
              Do not use PickRank for unlawful activity, harassment, threats, malware, unauthorized access, denial-of-service
              activity, or other conduct that harms users, PickRank, or contest integrity.
            </p>
            <p>
              Do not use non-public information about players, PickRank, contests, or other entrants to build or submit an
              entry.
            </p>
          </LegalSection>

          <LegalSection title="Review and enforcement">
            <p>
              PickRank may review account, device, log, entry, and usage signals, together with user reports, to identify
              duplicate accounts, automation, collusion, or other abuse.
            </p>
            <p>
              PickRank may warn, void an entry, remove an entry from standings, restrict an account, or suspend or close an
              account when it determines that these rules were breached. You can request review by contacting {legalSupportEmail}.
              PickRank aims to review beta enforcement requests within {enforcementReviewWindow}.
            </p>
          </LegalSection>

          <LegalSection title="Operator and contact">
            <p>PickRank is operated by {legalEntityDescription}.</p>
            <p>Integrity, security, and enforcement questions can be sent to {legalSupportEmail}.</p>
            <p>Mailing address: {legalPostalAddress}.</p>
          </LegalSection>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/legal/terms" className="inline-link">
              Review Beta Terms
            </Link>
            <Link href="/legal/privacy" className="inline-link">
              Review Privacy Policy
            </Link>
            <Link href="/legal/beta-rules" className="inline-link">
              Review beta contest rules
            </Link>
            <Link href="/legal/responsible-play" className="inline-link">
              Review responsible play
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LegalSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-black text-foreground">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
