import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  enforcementReviewWindow,
  legalEffectiveDate,
  legalEntityDescription,
  legalGoverningLaw,
  legalLastUpdatedDate,
  legalPostalAddress,
  legalSupportEmail,
  legalVenue,
  officialDataProvider,
  resultsFinalityWindow,
} from '@/lib/legal';
import { launchMode } from '@/lib/launch-mode';

export default function BetaTermsPage() {
  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Legal</p>
        <h1 className="text-3xl font-black leading-tight">Beta Terms</h1>
        <p className="text-muted-foreground">
          Effective {legalEffectiveDate}. Last updated {legalLastUpdatedDate}.
        </p>
      </section>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>{launchMode.displayName}</CardTitle>
          </div>
          <CardDescription>{launchMode.betaNoCashValueCopy}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-sm text-muted-foreground">
          <LegalSection title="Operator">
            <p>PickRank is operated by {legalEntityDescription}.</p>
            <p>Questions about beta participation can be sent to {legalSupportEmail}.</p>
            <p>Mailing address: {legalPostalAddress}.</p>
          </LegalSection>

          <LegalSection title="Early Access Beta">
            <p>PickRank Early Access Beta is free to play. A Beta Pass has no cash value.</p>
            <p>No purchase, entry fee, deposit, payout, withdrawal, cash prize, or cash-balance movement is available during beta.</p>
            <p>Paid contests are planned for a later launch and remain blocked until legal, provider, payment, withdrawal, and compliance review is complete.</p>
          </LegalSection>

          <LegalSection title="Account requirements">
            <p>Users need an account, public username, date of birth, state capture, Beta Terms acceptance, and Privacy Policy acceptance before beta entry.</p>
            <p>PickRank Early Access Beta is for users who are at least 18 years old. Users under 18 may not create or use an account or enter beta contests.</p>
            <p>Each person may use one account. PickRank may restrict, suspend, or close accounts that appear duplicate, false, abusive, automated, or harmful to beta integrity.</p>
          </LegalSection>

          <LegalSection title="Contest rules">
            <p>Beta contests use a 20-player pool. Users pick and rank 10 players before lock.</p>
            <p>Contest results use PickRank&apos;s saved final stats from {officialDataProvider} and the scoring rules shown in the Beta Contest Rules.</p>
            <p>PickRank aims to finalize beta results within {resultsFinalityWindow}.</p>
            <p>PickRank can pause, cancel, correct, or rerun a beta contest if testing, data, integrity, or operational issues require it.</p>
          </LegalSection>

          <LegalSection title="Third-party sports data">
            <p>PickRank may rely on independent sports-data providers to operate and score contests.</p>
            <p>Provider data may be delayed, unavailable, incomplete, or corrected. PickRank may take the corrective actions described in the applicable Contest Rules.</p>
          </LegalSection>

          <LegalSection title="Acceptable use">
            <p>Users may not misuse PickRank, submit false account details, misrepresent age, use automation, exploit bugs, interfere with security, or coordinate activity that harms contest integrity.</p>
            <p>Users can ask PickRank to review an enforcement decision by contacting {legalSupportEmail}. PickRank aims to review beta enforcement requests within {enforcementReviewWindow}.</p>
            <Link href="/legal/acceptable-use" className="inline-link">
              Review the full Acceptable Use Policy
            </Link>
          </LegalSection>

          <LegalSection title="Governing law">
            <p>These Beta Terms are governed by {legalGoverningLaw}. The venue for disputes is {legalVenue}.</p>
          </LegalSection>

          <LegalLinks />
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

function LegalLinks() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
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
  );
}
