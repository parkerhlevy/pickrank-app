import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Legal</p>
        <h1 className="text-3xl font-black leading-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">
          This beta privacy policy explains the limited account and contest data PickRank expects to collect during Early Access Beta.
        </p>
      </section>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Beta Data Use</CardTitle>
          </div>
          <CardDescription>Pending counsel review before broader public use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>PickRank collects account access data, public username, age confirmation, state, Beta Terms acceptance, Privacy Policy acceptance, contest entries, board saves, and final results activity.</p>
          <p>PickRank should collect only data needed for account access, beta contest operation, support, security, analytics, and legal or compliance review.</p>
          <p>PickRank does not collect payment card data, bank data, withdrawal data, or KYC documents during Early Access Beta.</p>
          <p>PickRank is not intended for children under 13.</p>
          <p>
            Product baseline references: the{' '}
            <a className="inline-link" href="https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business">
              FTC personal information guide
            </a>{' '}
            and the{' '}
            <a className="inline-link" href="https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions">
              FTC COPPA FAQ
            </a>
            .
          </p>
          <Link href="/legal/terms" className="inline-link">
            Review Beta Terms
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
