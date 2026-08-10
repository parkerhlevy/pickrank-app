import { describe, expect, it, vi } from 'vitest';
import { joinWaitlist, parseWaitlistSignupInput } from '../../lib/waitlist';
import {
  renderWaitlistWelcomeEmailHtml,
  renderWaitlistWelcomeEmailText,
  waitlistHomepageUrl,
  waitlistWelcomeEmailSubject,
} from '../../lib/waitlist-email';

type Row = {
  id: string;
  email: string;
  signed_up_at: string;
  source_path: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  welcome_email_status: string;
};

function createSupabaseMock() {
  const rows: Row[] = [];
  const updates: Record<string, unknown>[] = [];
  let insertAttempts = 0;

  const supabase = {
    from(table: string) {
      expect(table).toBe('waitlist_signups');

      return {
        insert(payload: Record<string, unknown>) {
          insertAttempts += 1;

          return {
            select() {
              return {
                async single() {
                  if (rows.some((row) => row.email === payload.email)) {
                    return { data: null, error: { code: '23505' } };
                  }

                  const row = {
                    id: `row-${rows.length + 1}`,
                    email: payload.email as string,
                    signed_up_at: '2026-07-14T12:00:00.000Z',
                    source_path: payload.source_path as string,
                    utm_source: payload.utm_source as string | null,
                    utm_medium: payload.utm_medium as string | null,
                    utm_campaign: payload.utm_campaign as string | null,
                    welcome_email_status: 'pending',
                  };
                  rows.push(row);
                  return { data: row, error: null };
                },
              };
            },
          };
        },
        select() {
          return {
            eq(_column: string, value: string) {
              return {
                async single() {
                  return { data: rows.find((row) => row.email === value) ?? null, error: null };
                },
              };
            },
          };
        },
        update(payload: Record<string, unknown>) {
          return {
            async eq(_column: string, value: string) {
              updates.push({ id: value, ...payload });
              const row = rows.find((candidate) => candidate.id === value);
              if (row && typeof payload.welcome_email_status === 'string') {
                row.welcome_email_status = payload.welcome_email_status;
              }
              return { data: null, error: null };
            },
          };
        },
      };
    },
  };

  return {
    rows,
    updates,
    get insertAttempts() {
      return insertAttempts;
    },
    client: supabase,
  };
}

function createResendMock(
  options: { contactFails?: boolean; lookupFails?: boolean; emailFails?: boolean; unsubscribed?: boolean } = {},
) {
  return {
    contacts: {
      get: vi.fn(async () => ({
        data: options.unsubscribed ? { id: 'contact-existing', unsubscribed: true } : null,
        error: options.lookupFails ? { message: 'timeout', statusCode: 500 } : null,
      })),
      create: vi.fn(async () => ({
        data: options.contactFails ? null : { id: 'contact-created' },
        error: options.contactFails ? { message: 'failed' } : null,
      })),
      update: vi.fn(async () => ({
        data: options.contactFails ? null : { id: 'contact-updated' },
        error: options.contactFails ? { message: 'failed' } : null,
      })),
      segments: {
        add: vi.fn(async () => ({ data: {}, error: null })),
      },
    },
    emails: {
      send: vi.fn(async () => ({
        data: options.emailFails ? null : { id: 'email-created' },
        error: options.emailFails ? { message: 'failed' } : null,
      })),
    },
  };
}

const resendEnv = {
  RESEND_API_KEY: 're_test',
  RESEND_FROM_EMAIL: 'PickRank <hello@pickrankgames.com>',
  RESEND_REPLY_TO_EMAIL: 'support@pickrankgames.com',
  RESEND_WAITLIST_SEGMENT_ID: 'segment-id',
};

describe('waitlist signup validation', () => {
  it('normalizes email whitespace and casing', () => {
    const parsed = parseWaitlistSignupInput({
      email: '  Parker@Example.COM  ',
      consent: 'on',
      sourcePath: '/',
    });

    expect(parsed.success).toBe(true);
    expect(parsed.success ? parsed.data.email : '').toBe('parker@example.com');
  });

  it('rejects invalid, empty, oversized, and malformed attribution input', () => {
    expect(parseWaitlistSignupInput({ email: 'not-an-email' }).success).toBe(false);
    expect(parseWaitlistSignupInput({ email: '' }).success).toBe(false);
    expect(parseWaitlistSignupInput({ email: `${'a'.repeat(250)}@example.com` }).success).toBe(false);
    expect(
      parseWaitlistSignupInput({
        email: 'valid@example.com',
        utm_source: '<script>',
      }).success,
    ).toBe(false);
    expect(
      parseWaitlistSignupInput({
        email: 'valid@example.com',
        utm_campaign: 'a'.repeat(101),
      }).success,
    ).toBe(false);
  });

  it('requires explicit email marketing consent', () => {
    const parsed = parseWaitlistSignupInput({
      email: 'valid@example.com',
      sourcePath: '/',
    });

    expect(parsed.success).toBe(false);
  });
});

describe('waitlist signup workflow', () => {
  it('saves a new waitlist record before syncing Resend and does not require authentication', async () => {
    const supabase = createSupabaseMock();
    const resend = createResendMock();
    const order: string[] = [];

    const result = await joinWaitlist(
      {
        email: 'fan@example.com',
        consent: 'on',
        sourcePath: '/',
        utm_source: 'codex',
        utm_medium: 'test',
        utm_campaign: 'launch',
      },
      {
        createSupabaseClient: () => {
          order.push('supabase');
          return supabase.client;
        },
        createResendClient: () => {
          order.push('resend');
          return resend;
        },
        env: resendEnv,
        now: () => new Date('2026-07-14T12:00:00.000Z'),
      },
    );

    expect(result.status).toBe('success');
    expect(supabase.rows).toHaveLength(1);
    expect(order[0]).toBe('supabase');
    expect(order).toContain('resend');
    expect(resend.contacts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'fan@example.com',
        unsubscribed: false,
        segments: [{ id: 'segment-id' }],
      }),
    );
    expect(resend.contacts.create).toHaveBeenCalledWith(
      expect.not.objectContaining({
        properties: expect.anything(),
      }),
    );
    expect(resend.emails.send).toHaveBeenCalledTimes(1);
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: {
          'List-Unsubscribe': '<mailto:support@pickrankgames.com?subject=Unsubscribe%20from%20PickRank%20emails>',
        },
      }),
    );
    expect(supabase.updates.at(-1)).toMatchObject({
      resend_contact_sync_status: 'synced',
      welcome_email_status: 'sent',
    });
  });

  it('does not create a Supabase Auth user or PickRank profile', async () => {
    const supabase = createSupabaseMock();
    const resend = createResendMock();
    const touchedTables = new Set<string>();

    await joinWaitlist(
      { email: 'fan@example.com', consent: 'on', sourcePath: '/' },
      {
        createSupabaseClient: () => ({
          from(table: string) {
            touchedTables.add(table);
            return supabase.client.from(table);
          },
        }),
        createResendClient: () => resend,
        env: resendEnv,
      },
    );

    expect(touchedTables).toEqual(new Set(['waitlist_signups']));
  });

  it('returns the same success state for duplicates and does not resend the welcome email', async () => {
    const supabase = createSupabaseMock();
    const resend = createResendMock();

    const first = await joinWaitlist(
      { email: 'fan@example.com', consent: 'on', sourcePath: '/' },
      { createSupabaseClient: () => supabase.client, createResendClient: () => resend, env: resendEnv },
    );
    const duplicate = await joinWaitlist(
      { email: ' FAN@example.com ', consent: 'on', sourcePath: '/' },
      { createSupabaseClient: () => supabase.client, createResendClient: () => resend, env: resendEnv },
    );

    expect(first).toEqual(duplicate);
    expect(supabase.rows).toHaveLength(1);
    expect(resend.emails.send).toHaveBeenCalledTimes(1);
    expect(supabase.insertAttempts).toBe(2);
  });

  it('safely ignores honeypot submissions without persistence or email', async () => {
    const supabase = createSupabaseMock();
    const resend = createResendMock();

    const result = await joinWaitlist(
      { email: 'bot@example.com', sourcePath: '/', honeypot: 'bot value' },
      { createSupabaseClient: () => supabase.client, createResendClient: () => resend, env: resendEnv },
    );

    expect(result.status).toBe('success');
    expect(supabase.rows).toHaveLength(0);
    expect(resend.emails.send).not.toHaveBeenCalled();
  });

  it('records missing Resend configuration without exposing provider details', async () => {
    const supabase = createSupabaseMock();

    const result = await joinWaitlist(
      { email: 'fan@example.com', consent: 'on', sourcePath: '/' },
      { createSupabaseClient: () => supabase.client, env: {} },
    );

    expect(result.status).toBe('success');
    expect(supabase.rows).toHaveLength(1);
    expect(supabase.updates.at(-1)).toMatchObject({
      resend_contact_sync_status: 'missing_config',
      welcome_email_status: 'missing_config',
      provider_retry_reason: 'missing_config',
    });
  });

  it('keeps the Supabase signup and records retryable status when Resend fails', async () => {
    const supabase = createSupabaseMock();
    const resend = createResendMock({ contactFails: true });

    const result = await joinWaitlist(
      { email: 'fan@example.com', consent: 'on', sourcePath: '/' },
      { createSupabaseClient: () => supabase.client, createResendClient: () => resend, env: resendEnv },
    );

    expect(result.status).toBe('success');
    expect(supabase.rows).toHaveLength(1);
    expect(supabase.updates.at(-1)).toMatchObject({
      resend_contact_sync_status: 'failed_retryable',
      welcome_email_status: 'failed_retryable',
      provider_retry_reason: 'contact_sync_failed',
    });
  });

  it('records a retryable welcome email failure after contact sync succeeds', async () => {
    const supabase = createSupabaseMock();
    const resend = createResendMock({ emailFails: true });

    await joinWaitlist(
      { email: 'fan@example.com', consent: 'on', sourcePath: '/' },
      { createSupabaseClient: () => supabase.client, createResendClient: () => resend, env: resendEnv },
    );

    expect(supabase.updates.at(-1)).toMatchObject({
      resend_contact_sync_status: 'synced',
      welcome_email_status: 'failed_retryable',
      provider_retry_reason: 'welcome_email_failed',
    });
  });

  it('does not silently re-opt an unsubscribed Resend contact into marketing', async () => {
    const supabase = createSupabaseMock();
    const resend = createResendMock({ unsubscribed: true });

    await joinWaitlist(
      { email: 'fan@example.com', consent: 'on', sourcePath: '/' },
      { createSupabaseClient: () => supabase.client, createResendClient: () => resend, env: resendEnv },
    );

    expect(resend.contacts.create).not.toHaveBeenCalled();
    expect(resend.contacts.update).not.toHaveBeenCalled();
    expect(resend.emails.send).not.toHaveBeenCalled();
    expect(supabase.updates.at(-1)).toMatchObject({
      resend_contact_sync_status: 'skipped_unsubscribed',
      welcome_email_status: 'skipped_unsubscribed',
      provider_retry_reason: 'contact_unsubscribed',
    });
  });

  it('records a retryable failure when Resend contact lookup fails unexpectedly', async () => {
    const supabase = createSupabaseMock();
    const resend = createResendMock({ lookupFails: true });

    await joinWaitlist(
      { email: 'fan@example.com', consent: 'on', sourcePath: '/' },
      { createSupabaseClient: () => supabase.client, createResendClient: () => resend, env: resendEnv },
    );

    expect(resend.contacts.create).not.toHaveBeenCalled();
    expect(resend.contacts.update).not.toHaveBeenCalled();
    expect(supabase.updates.at(-1)).toMatchObject({
      resend_contact_sync_status: 'failed_retryable',
      welcome_email_status: 'failed_retryable',
      provider_retry_reason: 'contact_sync_failed',
    });
  });
});

describe('waitlist welcome email template', () => {
  it('contains the approved subject, core copy, homepage link, branding, and beta legal footer', () => {
    const html = renderWaitlistWelcomeEmailHtml();
    const text = renderWaitlistWelcomeEmailText();

    expect(waitlistWelcomeEmailSubject).toBe('You’re on the PickRank waitlist');
    expect(html).toContain('You’re on the list.');
    expect(html).toContain('Thanks for joining the PickRank waitlist.');
    expect(html).toContain('free Early Access Beta');
    expect(html).toContain(waitlistHomepageUrl);
    expect(html).toContain('alt="PickRank"');
    expect(html).toContain('No purchase, no entry fee, no prizes');
    expect(html).toContain('Unsubscribe');
    expect(html).toContain('mailto:support@pickrankgames.com?subject=Unsubscribe%20from%20PickRank%20emails');
    expect(html).toContain('Playground Sports, LLC');
    expect(html).toContain('5014 42nd Ave SW, Unit C');
    expect(html).toContain('Seattle, WA 98136');
    expect(html).toContain('/legal/privacy');
    expect(html).not.toContain('Future launch emails will include');
    expect(html).not.toContain('{{{RESEND_UNSUBSCRIBE_URL}}}');
    expect(html).toContain('not affiliated with or endorsed by the NFL');
    expect(text).toContain('The PickRank Team');
    expect(text).toContain(waitlistHomepageUrl);
    expect(text).toContain('Unsubscribe: mailto:support@pickrankgames.com?subject=Unsubscribe%20from%20PickRank%20emails');
    expect(text).toContain('Playground Sports, LLC');
    expect(text).toContain('5014 42nd Ave SW, Unit C');
    expect(text).toContain('Seattle, WA 98136');
    expect(text).not.toContain('Future launch emails will include');
    expect(text).not.toContain('{{{RESEND_UNSUBSCRIBE_URL}}}');
  });
});
