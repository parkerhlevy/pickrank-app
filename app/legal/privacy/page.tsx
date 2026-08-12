import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  accountDeletionPeriod,
  legalEffectiveDate,
  legalEntityDescription,
  legalLastUpdatedDate,
  legalPostalAddress,
  legalPrivacyEmail,
  legalSupportEmail,
} from '@/lib/legal';

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Legal</p>
        <h1 className="text-3xl font-black leading-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">
          Effective {legalEffectiveDate}. Last updated {legalLastUpdatedDate}.
        </p>
      </section>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Beta Data Use</CardTitle>
          </div>
          <CardDescription>PickRank collects limited data to operate free beta contests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-sm text-muted-foreground">
          <LegalSection title="Who Operates PickRank">
            <p>PickRank is operated by {legalEntityDescription}.</p>
            <p>Privacy questions can be sent to {legalPrivacyEmail}. General support questions can be sent to {legalSupportEmail}.</p>
            <p>Mailing address: {legalPostalAddress}.</p>
          </LegalSection>

          <LegalSection title="Information PickRank Collects">
            <p>PickRank collects waitlist email and consent data, account access data, public username, date of birth, state, Beta Terms acceptance, Privacy Policy acceptance, contest entries, board saves, final results activity, and basic device, log, and usage data.</p>
            <p>PickRank does not collect payment card data, bank data, withdrawal data, tax documents, government ID, or KYC documents during Early Access Beta.</p>
          </LegalSection>

          <LegalSection title="How PickRank Uses Information">
            <p>PickRank uses beta data for account access, beta contest operation, support, security, analytics, legal or compliance review, email updates when users consent, and product improvement.</p>
            <p>PickRank does not use advertising or behavioral targeting cookies during Early Access Beta.</p>
          </LegalSection>

          <LegalSection title="Age And Children">
            <p>PickRank Early Access Beta is for users who are at least 18 years old. PickRank uses date of birth to confirm beta age eligibility.</p>
            <p>If PickRank learns that an under-18 user submitted account information, PickRank may restrict the account and delete or de-identify account data when appropriate. Age-related privacy questions can be sent to {legalPrivacyEmail}.</p>
          </LegalSection>

          <LegalSection title="Sharing">
            <p>PickRank may share information with service providers that help operate authentication, hosting, analytics, email, support, security, and contest data workflows.</p>
            <p>PickRank may disclose information if required for legal, security, fraud-prevention, enforcement, or compliance reasons.</p>
          </LegalSection>

          <LegalSection title="Retention And Deletion">
            <p>Users can request account deletion by contacting {legalPrivacyEmail}. PickRank aims to delete or de-identify account data within {accountDeletionPeriod}, unless it must keep limited records for legal, security, fraud-prevention, dispute, or compliance reasons.</p>
            <p>Waitlist users can unsubscribe from launch emails using the unsubscribe option in marketing emails once broader campaign emails begin.</p>
          </LegalSection>

          <LegalSection title="Security">
            <p>PickRank uses reasonable technical and organizational safeguards for beta data. No system is perfectly secure, and users should protect their own account access.</p>
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
      <Link href="/legal/terms" className="inline-link">
        Review Beta Terms
      </Link>
      <Link href="/legal/beta-rules" className="inline-link">
        Review Beta Contest Rules
      </Link>
      <Link href="/legal/responsible-play" className="inline-link">
        Review Responsible Play
      </Link>
    </div>
  );
}
