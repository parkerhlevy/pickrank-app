# PickRank Waitlist Workflow

## Purpose

The public homepage waitlist is separate from account authentication. Visitors submit only an email address on `/`; the workflow does not create a Supabase Auth user, does not create a PickRank profile, and does not send general waitlist traffic to `/auth`.

Supabase remains the source of truth for waitlist membership, consent, signup timing, attribution, and provider-sync status. Resend is used for contact management, launch/beta broadcasts, unsubscribe handling, and the branded welcome email.

## Storage

Waitlist records are stored in `public.waitlist_signups` from migration `db/migrations/0012_waitlist_signups.sql`.

Stored fields include normalized lowercase email, signup and explicit consent timestamps, safe source path, approved UTM fields, Resend contact sync status, welcome email status, and a safe retry category.

The homepage form requires a consent checkbox before submission. Do not replace it with implied-consent copy unless legal review explicitly approves that change.

The table has RLS enabled and grants no direct table access to `anon` or `authenticated`. The homepage writes through trusted server-side code using the Supabase service-role client. Browser clients must not receive the service-role key.

## Duplicate Signups

Email uniqueness is case-insensitive. A duplicate submission returns the same visitor success state as a new signup, does not create a second row, and does not reveal whether the address was already on the list.

Duplicate submissions may refresh the Resend contact properties or segment membership, but the welcome email is not resent when the Supabase record already exists.

## Honeypot Behavior

The form includes a hidden `company` field. If it is filled, the server returns the same success state but does not create a Supabase row and does not contact Resend. This keeps basic automated submissions from learning the anti-spam behavior.

## Attribution

Only these UTM fields are accepted: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term`.

Each value is trimmed, length-limited, and pattern-validated before persistence. Arbitrary query parameters are ignored and are never treated as database column names.

## Resend Contact Sync

Required server-side variables:

```text
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_REPLY_TO_EMAIL
RESEND_WAITLIST_SEGMENT_ID
```

The implementation uses the official Resend Node.js SDK, Resend contacts, and the current segment model. Resend audiences are deprecated in the current API, so the waitlist uses a dedicated segment ID.

Synced contact properties:

- `signup_source`
- `signup_timestamp`
- `utm_source`
- `utm_medium`
- `utm_campaign`

No internal database IDs, secrets, raw provider errors, or unnecessary personal data are sent to Resend.

## Unsubscribed Contacts

Before creating or updating a Resend contact, the workflow checks the existing contact by email. If Resend says the contact is globally unsubscribed, the workflow does not set `unsubscribed: false`, does not add the segment again, and does not send a welcome email. Supabase records the status as `skipped_unsubscribed` with the retry category `contact_unsubscribed`.

Future broadcasts should use Resend unsubscribe capabilities. Do not build a custom unsubscribe system unless Resend cannot satisfy a later requirement.

## Resend Failure Handling

The Supabase write happens first and is authoritative. If Resend configuration is missing or the provider call fails, the Supabase signup stays saved and the homepage still shows the normal success state.

Retryable failures are recorded on the waitlist row:

- `resend_contact_sync_status = missing_config` or `failed_retryable`
- `welcome_email_status = missing_config` or `failed_retryable`
- `provider_retry_reason = missing_config`, `contact_sync_failed`, or `welcome_email_failed`

This slice does not add a background queue. The retry boundary is the status fields on `waitlist_signups`; an operator can later reprocess rows with retryable statuses.

## Welcome Email

Template location:

```text
lib/waitlist-email.tsx
```

Subject:

```text
You’re on the PickRank waitlist
```

Preview text:

```text
You’re officially on the list. We’ll let you know when it’s time to play.
```

The send path uses Resend's React email rendering support with a plain-text fallback. It includes PickRank branding, a link to `https://www.pickrankgames.com`, and no account-creation, sign-in, eligibility, or play-now language.

## Viewing and Exporting Supabase Records

After migration `0012` is applied:

1. Open the Supabase project.
2. Go to Table Editor.
3. Select `public.waitlist_signups`.
4. Use filters for signup date, UTM fields, or retry status when needed.
5. Use Supabase export/download options for CSV review.

Do not change RLS or add public table policies to make exports easier.

## Viewing and Managing Resend Contacts

1. Open Resend.
2. Go to Contacts.
3. Filter by the PickRank waitlist segment.
4. Review contact properties for source and campaign segmentation.
5. Use Resend's unsubscribe and suppression views to inspect unsubscribed contacts.
6. Export contacts from Resend when needed for campaign planning.

## Sending a Launch Broadcast

1. Open Resend.
2. Create a broadcast.
3. Select the PickRank waitlist segment.
4. Preview the campaign on desktop and mobile.
5. Send a test broadcast to a controlled internal address.
6. Confirm links, unsubscribe behavior, sender identity, and reply-to address.
7. Schedule or send the launch broadcast through Resend.

## Sending Domain Setup

Prepare a verified PickRank-owned sender such as:

```text
PickRank <hello@pickrankgames.com>
```

Manual setup required:

1. Add `pickrankgames.com` as a sending domain in Resend.
2. Add the required DNS records shown by Resend.
3. Wait for DNS propagation.
4. Verify the domain in Resend.
5. Create a Resend API key.
6. Create or identify the dedicated PickRank waitlist segment.
7. Add the required Resend variables to Vercel.
8. Deploy only after migration and environment values are ready.

Do not modify DNS, Resend account settings, Vercel environment variables, or production deployments from this repo slice.

## What Parker Must Configure

- Create or access the Resend account
- Add the PickRank sending domain
- Add the required DNS records
- Verify the sending domain
- Create a Resend API key
- Create or identify the PickRank waitlist audience or segment
- Add required environment variables to Vercel
- Confirm the sender and reply-to addresses
- Apply migration `0012` after review
- Send a test welcome email
- Confirm unsubscribe behavior
- Deploy the waitlist workflow
- Submit one real production waitlist signup
- Confirm the Supabase record
- Confirm the Resend contact
- Confirm the welcome email delivery

## Outstanding Production Steps

Migration `0012` still requires safe Supabase validation and application. Production Resend configuration, DNS verification, Vercel environment variables, real delivery testing, deployment, and one production signup verification remain outstanding.
