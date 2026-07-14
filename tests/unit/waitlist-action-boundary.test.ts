import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('waitlist server boundary', () => {
  it('keeps the signup action as a server action and does not expose Resend credentials to client code', () => {
    const actionSource = readFileSync(join(process.cwd(), 'app/waitlist/actions.ts'), 'utf8');
    const formSource = readFileSync(join(process.cwd(), 'components/waitlist/waitlist-form.tsx'), 'utf8');
    const waitlistSource = readFileSync(join(process.cwd(), 'lib/waitlist.ts'), 'utf8');

    expect(actionSource).toContain("'use server'");
    expect(formSource).not.toContain('RESEND_API_KEY');
    expect(formSource).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(waitlistSource).toContain('createAdminClient');
    expect(waitlistSource).toContain('RESEND_API_KEY');
  });

  it('does not introduce a production-enabled E2E persistence bypass', () => {
    const waitlistSource = readFileSync(join(process.cwd(), 'lib/waitlist.ts'), 'utf8');

    expect(waitlistSource).not.toContain('PICKRANK_E2E_USE_FILE_STORE');
    expect(waitlistSource).not.toContain("NODE_ENV === 'production'");
  });
});
