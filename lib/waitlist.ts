import { z } from 'zod';
import { Resend } from 'resend';
import { getServiceRoleSupabaseConfig } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  renderWaitlistWelcomeEmailReact,
  renderWaitlistWelcomeEmailText,
  waitlistWelcomeEmailSubject,
} from '@/lib/waitlist-email';

const maxEmailLength = 254;
const utmPattern = /^[a-zA-Z0-9][a-zA-Z0-9 _./:-]{0,99}$/;
const sourcePathPattern = /^\/[a-zA-Z0-9/_-]*$/;

export type WaitlistActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: {
    consent?: string;
    email?: string;
  };
};

export type WaitlistSignupInput = {
  email: unknown;
  consent?: unknown;
  sourcePath?: unknown;
  honeypot?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_content?: unknown;
  utm_term?: unknown;
};

type WaitlistRecord = {
  id: string;
  email: string;
  signed_up_at: string;
  source_path: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  welcome_email_status: string;
};

type SupabaseResult<T> = {
  data: T | null;
  error: { code?: string; message?: string } | null;
};

type SupabaseClientLike = {
  from: (table: string) => {
    insert: (payload: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<SupabaseResult<WaitlistRecord>>;
      };
    };
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<SupabaseResult<WaitlistRecord>>;
      };
    };
    update: (payload: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<SupabaseResult<null>>;
    };
  };
};

type ResendClientLike = {
  contacts: {
    create: (payload: Record<string, unknown>) => Promise<{ data: { id: string } | null; error: unknown | null }>;
    get: (email: string) => Promise<{ data: { id: string; unsubscribed?: boolean } | null; error: unknown | null }>;
    update: (payload: Record<string, unknown>) => Promise<{ data: { id: string } | null; error: unknown | null }>;
    segments: {
      add: (payload: Record<string, unknown>) => Promise<{ data: unknown | null; error: unknown | null }>;
    };
  };
  emails: {
    send: (payload: Record<string, unknown>) => Promise<{ data: { id: string } | null; error: unknown | null }>;
  };
};

type WaitlistDependencies = {
  createSupabaseClient?: () => SupabaseClientLike;
  createResendClient?: (apiKey: string) => ResendClientLike;
  now?: () => Date;
  env?: Record<string, string | undefined>;
};

const optionalUtmSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  },
  z.string().max(100).regex(utmPattern).optional(),
);

export const waitlistSignupSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter an email address.')
    .max(maxEmailLength, 'Enter an email address under 255 characters.')
    .email('Enter a valid email address.')
    .transform((email) => email.toLowerCase()),
  consent: z.literal('on', {
    message: 'Confirm that PickRank can email you launch updates.',
  }),
  sourcePath: z
    .string()
    .trim()
    .max(120)
    .regex(sourcePathPattern)
    .catch('/'),
  honeypot: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? ''),
  utm_source: optionalUtmSchema,
  utm_medium: optionalUtmSchema,
  utm_campaign: optionalUtmSchema,
  utm_content: optionalUtmSchema,
  utm_term: optionalUtmSchema,
});

export function parseWaitlistSignupInput(input: WaitlistSignupInput) {
  return waitlistSignupSchema.safeParse(input);
}

export async function joinWaitlist(
  input: WaitlistSignupInput,
  dependencies: WaitlistDependencies = {},
): Promise<WaitlistActionState> {
  if (typeof input.honeypot === 'string' && input.honeypot.trim()) {
    return successState();
  }

  const parsed = parseWaitlistSignupInput(input);

  if (!parsed.success) {
    const flattened = parsed.error.flatten();

    return {
      status: 'error',
      message: 'Check the form and try again.',
      fieldErrors: {
        consent: flattened.fieldErrors.consent?.[0],
        email: flattened.fieldErrors.email?.[0],
      },
    };
  }

  const signup = parsed.data;

  try {
    const supabase = dependencies.createSupabaseClient?.() ?? (createAdminClient() as unknown as SupabaseClientLike);
    const saved = await saveWaitlistRecord(supabase, signup, dependencies);

    await syncResendAfterSignup(saved.record, saved.created, dependencies);

    return successState();
  } catch {
    return {
      status: 'error',
      message: 'The waitlist is temporarily unavailable. Try again in a few minutes.',
    };
  }
}

async function saveWaitlistRecord(
  supabase: SupabaseClientLike,
  signup: z.infer<typeof waitlistSignupSchema>,
  dependencies: WaitlistDependencies,
): Promise<{ record: WaitlistRecord; created: boolean }> {
  const insertResult = await supabase
    .from('waitlist_signups')
    .insert({
      email: signup.email,
      consented_at: nowIso(dependencies),
      source_path: signup.sourcePath,
      utm_source: signup.utm_source ?? null,
      utm_medium: signup.utm_medium ?? null,
      utm_campaign: signup.utm_campaign ?? null,
      utm_content: signup.utm_content ?? null,
      utm_term: signup.utm_term ?? null,
    })
    .select(
      'id,email,signed_up_at,source_path,utm_source,utm_medium,utm_campaign,welcome_email_status',
    )
    .single();

  if (!insertResult.error && insertResult.data) {
    return { record: insertResult.data, created: true };
  }

  if (insertResult.error?.code !== '23505') {
    throw new Error('waitlist_insert_failed');
  }

  const selectResult = await supabase
    .from('waitlist_signups')
    .select('id,email,signed_up_at,source_path,utm_source,utm_medium,utm_campaign,welcome_email_status')
    .eq('email', signup.email)
    .single();

  if (selectResult.error || !selectResult.data) {
    throw new Error('waitlist_duplicate_lookup_failed');
  }

  return { record: selectResult.data, created: false };
}

async function syncResendAfterSignup(
  record: WaitlistRecord,
  created: boolean,
  dependencies: WaitlistDependencies,
) {
  const supabase = dependencies.createSupabaseClient?.() ?? (createAdminClient() as unknown as SupabaseClientLike);
  const env = dependencies.env ?? process.env;
  const config = getResendConfig(env);

  if (!config) {
    await updateWaitlistRecord(supabase, record.id, {
      resend_contact_sync_status: 'missing_config',
      resend_contact_sync_attempted_at: nowIso(dependencies),
      welcome_email_status: created ? 'missing_config' : 'skipped_duplicate',
      provider_retry_reason: 'missing_config',
      updated_at: nowIso(dependencies),
    });
    return;
  }

  const resend = dependencies.createResendClient?.(config.apiKey) ?? (new Resend(config.apiKey) as unknown as ResendClientLike);
  const contactPayload = {
    email: record.email,
    unsubscribed: false,
    segments: [{ id: config.waitlistSegmentId }],
  };

  try {
    const existingContact = await resend.contacts.get(record.email);

    if (existingContact.error && !isResendNotFound(existingContact.error)) {
      throw createResendSyncError('resend_contact_lookup_failed', existingContact.error);
    }

    const isUnsubscribed = existingContact.data?.unsubscribed === true;

    if (isUnsubscribed) {
      await updateWaitlistRecord(supabase, record.id, {
        resend_contact_sync_status: 'skipped_unsubscribed',
        resend_contact_sync_attempted_at: nowIso(dependencies),
        resend_contact_id: existingContact.data?.id ?? null,
        welcome_email_status: 'skipped_unsubscribed',
        provider_retry_reason: 'contact_unsubscribed',
        updated_at: nowIso(dependencies),
      });
      return;
    }

    const contactResult = existingContact.data
      ? await resend.contacts.update({
          email: record.email,
        })
      : await resend.contacts.create(contactPayload);

    if (contactResult.error || !contactResult.data) {
      throw createResendSyncError('resend_contact_sync_failed', contactResult.error);
    }

    if (existingContact.data) {
      const segmentResult = await resend.contacts.segments.add({
        email: record.email,
        segmentId: config.waitlistSegmentId,
      });

      if (segmentResult.error) {
        throw createResendSyncError('resend_contact_segment_failed', segmentResult.error);
      }
    }

    let welcomeStatus = created && record.welcome_email_status !== 'sent' ? 'sent' : 'skipped_duplicate';
    let welcomeSentAt: string | null = created && record.welcome_email_status !== 'sent' ? nowIso(dependencies) : null;

    if (created && record.welcome_email_status !== 'sent') {
      const emailResult = await resend.emails.send({
        from: config.fromEmail,
        to: record.email,
        replyTo: config.replyToEmail,
        subject: waitlistWelcomeEmailSubject,
        react: renderWaitlistWelcomeEmailReact(),
        text: renderWaitlistWelcomeEmailText(),
        tags: [{ name: 'source', value: 'waitlist' }],
      });

      if (emailResult.error || !emailResult.data) {
        welcomeStatus = 'failed_retryable';
        welcomeSentAt = null;
      }
    }

    await updateWaitlistRecord(supabase, record.id, {
      resend_contact_sync_status: 'synced',
      resend_contact_sync_attempted_at: nowIso(dependencies),
      resend_contact_id: contactResult.data.id,
      welcome_email_status: welcomeStatus,
      welcome_email_sent_at: welcomeSentAt,
      provider_retry_reason: welcomeStatus === 'failed_retryable' ? 'welcome_email_failed' : null,
      updated_at: nowIso(dependencies),
    });
  } catch (error) {
    console.warn('waitlist_resend_sync_failed', summarizeResendSyncError(error));

    await updateWaitlistRecord(supabase, record.id, {
      resend_contact_sync_status: 'failed_retryable',
      resend_contact_sync_attempted_at: nowIso(dependencies),
      welcome_email_status: created ? 'failed_retryable' : 'skipped_duplicate',
      provider_retry_reason: 'contact_sync_failed',
      updated_at: nowIso(dependencies),
    });
  }
}

function getResendConfig(env: Record<string, string | undefined>) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL || !env.RESEND_REPLY_TO_EMAIL || !env.RESEND_WAITLIST_SEGMENT_ID) {
    return null;
  }

  return {
    apiKey: env.RESEND_API_KEY,
    fromEmail: env.RESEND_FROM_EMAIL,
    replyToEmail: env.RESEND_REPLY_TO_EMAIL,
    waitlistSegmentId: env.RESEND_WAITLIST_SEGMENT_ID,
  };
}

function isResendNotFound(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { statusCode?: number; name?: string; message?: string };

  return (
    candidate.statusCode === 404 ||
    candidate.name === 'not_found' ||
    candidate.name === 'not_found_error' ||
    candidate.message?.toLowerCase().includes('not found') === true
  );
}

function createResendSyncError(message: string, providerError: unknown) {
  return new Error(message, { cause: providerError });
}

function summarizeResendSyncError(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: 'unknown_resend_sync_failed' };
  }

  return {
    message: error.message,
    cause: summarizeProviderError(error.cause),
  };
}

function summarizeProviderError(error: unknown): Record<string, unknown> | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const candidate = error as {
    message?: unknown;
    name?: unknown;
    statusCode?: unknown;
    status?: unknown;
    code?: unknown;
  };

  return {
    name: typeof candidate.name === 'string' ? candidate.name : undefined,
    message: typeof candidate.message === 'string' ? candidate.message : undefined,
    statusCode:
      typeof candidate.statusCode === 'number' || typeof candidate.statusCode === 'string'
        ? candidate.statusCode
        : undefined,
    status: typeof candidate.status === 'number' || typeof candidate.status === 'string' ? candidate.status : undefined,
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
  };
}

async function updateWaitlistRecord(supabase: SupabaseClientLike, id: string, payload: Record<string, unknown>) {
  await supabase.from('waitlist_signups').update(payload).eq('id', id);
}

function successState(): WaitlistActionState {
  return {
    status: 'success',
    message: 'We’ll email you with PickRank launch updates.',
  };
}

function nowIso(dependencies: WaitlistDependencies) {
  return (dependencies.now?.() ?? new Date()).toISOString();
}

export function assertWaitlistUsesServiceRoleBoundary() {
  return getServiceRoleSupabaseConfig;
}
