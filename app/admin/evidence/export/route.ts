import { createHash } from 'node:crypto';
import { buildAdminEvidencePackage, recordAdminAuditEvent } from '@/lib/admin-evidence';
import { getCurrentOperatorRoles } from '@/lib/contest-operator-access';

export async function GET(request: Request) {
  const authState = await getCurrentOperatorRoles();

  if (!authState.user) {
    return Response.json({ error: 'Authentication is required.' }, { status: 401 });
  }

  if (!authState.isContestOperator) {
    return Response.json({ error: 'Contest operator access is required.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const identified = url.searchParams.get('identified') === '1';
  const reason = url.searchParams.get('reason')?.trim() || '';

  if (identified && reason.length < 12) {
    return Response.json({ error: 'Add an export reason of at least 12 characters.' }, { status: 400 });
  }

  const evidencePackage = await buildAdminEvidencePackage({ identified });
  const datasetsJson = JSON.stringify(evidencePackage.datasets);
  const payloadSha256 = createHash('sha256').update(datasetsJson).digest('hex');
  const completedPackage = {
    ...evidencePackage,
    manifest: {
      ...evidencePackage.manifest,
      payloadSha256,
    },
  };

  await recordAdminAuditEvent({
    actorUserId: authState.user.id,
    eventType: identified ? 'identified_evidence_exported' : 'pseudonymous_evidence_exported',
    metadata: {
      payload_sha256: payloadSha256,
      table_counts: completedPackage.manifest.tableCounts,
    },
    reason: identified ? reason : null,
    targetType: 'evidence_package',
  });

  const date = new Date().toISOString().slice(0, 10);
  const identityLabel = identified ? 'identified' : 'pseudonymous';

  return new Response(`${JSON.stringify(completedPackage, null, 2)}\n`, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="pickrank-evidence-${identityLabel}-${date}.json"`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
