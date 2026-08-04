import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const appRoutes = [
  { path: '/', file: 'app/page.tsx' },
  { path: '/auth', file: 'app/auth/page.tsx' },
  { path: '/contests', file: 'app/contests/page.tsx' },
  { path: '/contests/:contest_id', file: 'app/contests/[contestId]/page.tsx' },
  { path: '/contests/:contest_id/payment', file: 'app/contests/[contestId]/payment/page.tsx' },
  { path: '/contests/:contest_id/success', file: 'app/contests/[contestId]/success/page.tsx' },
  { path: '/contests/:contest_id/lineup', file: 'app/contests/[contestId]/lineup/page.tsx' },
  { path: '/contests/:contest_id/results', file: 'app/contests/[contestId]/results/page.tsx' },
  { path: '/admin/eligibility', file: 'app/admin/eligibility/page.tsx' },
  { path: '/how-it-works', file: 'app/how-it-works/page.tsx' },
  { path: '/leaderboard', file: 'app/leaderboard/page.tsx' },
  { path: '/legal/beta-rules', file: 'app/legal/beta-rules/page.tsx' },
  { path: '/legal/privacy', file: 'app/legal/privacy/page.tsx' },
  { path: '/legal/responsible-play', file: 'app/legal/responsible-play/page.tsx' },
  { path: '/legal/terms', file: 'app/legal/terms/page.tsx' },
  { path: '/profile', file: 'app/profile/page.tsx' },
  { path: '/wallet', file: 'app/wallet/page.tsx' },
];

describe('Phase 0 app routes', () => {
  it.each(appRoutes)('has a page for $path', ({ file }) => {
    expect(existsSync(join(process.cwd(), file))).toBe(true);
  });
});
