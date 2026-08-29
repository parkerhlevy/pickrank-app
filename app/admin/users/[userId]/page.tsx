import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { EntrySummaryCard, formatAdminTimestamp } from '@/components/admin/evidence-ui';
import { Button } from '@/components/ui/button';
import { getAdminEvidenceUser, recordAdminAuditEvent } from '@/lib/admin-evidence';
import { requireContestOperator } from '@/lib/contest-operator-access';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const access = await requireContestOperator(`/admin/users/${userId}`);
  const user = await getAdminEvidenceUser(userId);

  if (!user) notFound();

  await recordAdminAuditEvent({
    actorUserId: access.user?.id || null,
    eventType: 'sensitive_user_record_viewed',
    targetId: userId,
    targetType: 'user',
  });

  return (
    <div className="space-y-6 pb-24">
      <Button asChild variant="ghost" size="sm" className="-ml-3 justify-start">
        <Link href="/admin/users">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          User search
        </Link>
      </Button>

      <section className="screen-header space-y-2">
        <p className="eyebrow">User record</p>
        <h1 className="text-3xl font-black leading-tight">{user.displayName}</h1>
        <p className="text-muted-foreground">@{user.username} · {user.email}</p>
        <p className="break-all text-xs text-slate-500">{user.userId}</p>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Profile and eligibility</h2>
            <p className="mt-1 text-xs text-slate-500">Sensitive data view recorded in the admin audit log.</p>
          </div>
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileField label="Date of birth" value={user.dateOfBirth || 'Not provided'} />
          <ProfileField label="Jurisdiction" value={user.jurisdiction} />
          <ProfileField label="Account status" value={user.accountStatus} />
          <ProfileField label="Eligibility status" value={user.eligibilityStatus} />
          <ProfileField label="Age gate" value={user.ageGateStatus} />
          <ProfileField label="KYC status" value={user.kycStatus} />
          <ProfileField label="Terms accepted" value={formatAdminTimestamp(user.termsAcceptedAt)} />
          <ProfileField label="Privacy accepted" value={formatAdminTimestamp(user.privacyPolicyAcceptedAt)} />
          <ProfileField label="Account created" value={formatAdminTimestamp(user.createdAt)} />
          <ProfileField label="Last sign in" value={formatAdminTimestamp(user.lastSignInAt)} />
        </dl>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">Contest entries</h2>
            <p className="mt-1 text-sm text-slate-500">Current boards, immutable saved versions, and final scoring.</p>
          </div>
          <span className="numeric text-sm font-bold text-slate-600">{user.entryCount} total</span>
        </div>
        {user.entries.length === 0 ? (
          <p className="mt-4 rounded-xl border bg-white p-5 text-sm text-slate-500">This user has no contest entries.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {user.entries.map((entry) => <EntrySummaryCard key={entry.entryId} entry={entry} />)}
          </div>
        )}
      </section>
    </div>
  );
}
function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-extrabold uppercase tracking-[0.06em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
