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

Duplicate submissions may refresh Resend segment membership, but the welcome email is not resent when the Supabase record already exists.

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

Attribution stays in Supabase. Do not send UTM/source values to Resend as custom contact properties unless the matching properties are created and maintained in Resend first.

No internal database IDs, secrets, raw provider errors, or unnecessary personal data are sent to Resend.

## Unsubscribed Contacts

Before creating or updating a Resend contact, the workflow checks the existing contact by email. If Resend says the contact is globally unsubscribed, the workflow does not set `unsubscribed: false`, does not add the segment again, and does not send a welcome email. Supabase records the status as `skipped_unsubscribed` with the retry category `contact_unsubscribed`.

One-off waitlist welcome emails include a visible mailto unsubscribe link plus a `List-Unsubscribe` email header that points to the configured `RESEND_REPLY_TO_EMAIL` address. Operators must mark manual unsubscribe requests as unsubscribed in Resend.

Future broadcasts should use Resend unsubscribe capabilities. Resend Broadcasts and Automations automatically handle unsubscribe requests only when the email includes `{{{RESEND_UNSUBSCRIBE_URL}}}` or Resend's built-in unsubscribe footer. Do not build a custom unsubscribe system unless Resend cannot satisfy a later requirement.

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
You’re officially on the list. We’ll send Early Access Beta updates.
```

The send path uses Resend's React email rendering support with a plain-text fallback. It includes PickRank branding, a link to `https://www.pickrankgames.com`, free Early Access Beta copy, no cash-prize language, a visible unsubscribe mailto link, the Playground Sports, LLC postal address, and the Privacy Policy link. The Resend Email API payload also includes a `List-Unsubscribe` header using the configured reply-to address. It avoids urgent claims, winnings promises, play-now language, account-creation pressure, and the Resend `{{{RESEND_UNSUBSCRIBE_URL}}}` token because that token is documented for Broadcasts and Automations, not this one-off Email API send.

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
4. Use Resend's unsubscribe and suppression views to inspect unsubscribed contacts.
5. Export contacts from Resend when needed for campaign planning.

## Sending a Launch Broadcast

1. Open Resend.
2. Create a broadcast.
3. Select the PickRank waitlist segment.
4. Add a visible unsubscribe link or button with `{{{RESEND_UNSUBSCRIBE_URL}}}` as the link target, or include Resend's unsubscribe footer.
5. Preview the campaign on desktop and mobile.
6. Send a test broadcast to a controlled internal address.
7. Confirm links, unsubscribe behavior, sender identity, reply-to address, and the live Resend preference page.
8. Schedule or send the launch broadcast through Resend.

## Deliverability Polish

The current waitlist path is production-tested for capture, Resend contact sync, and welcome-email sending. The remaining issue is deliverability polish because a successful test email reached Parker's work-email junk folder.

Keep this pass limited to sender identity, DNS verification, welcome-email risk review, and test planning. Do not change waitlist capture, auth, eligibility, payments, wallet-ledger, scoring, final-results behavior, Supabase policies, Vercel environment values, Resend account settings, or DNS records from this repo slice.

Preferred production sender after root-domain verification:

```text
PickRank <hello@pickrankgames.com>
```

Use a PickRank-owned sending domain instead of a generic provider sender. Keep `RESEND_REPLY_TO_EMAIL` on a monitored PickRank-owned address such as `support@pickrankgames.com` or `hello@pickrankgames.com`.

The 2026-07-22 public DNS audit in `docs/waitlist-deliverability-audit-2026-07-22.md` found Resend return-path evidence for `auth.pickrankgames.com`, but not for root `pickrankgames.com`. If Resend currently only verifies `auth.pickrankgames.com`, either use a monitored sender on that verified subdomain for the immediate matrix or verify `pickrankgames.com` in Resend before using `hello@pickrankgames.com`.

Live Resend dashboard checks to record:

1. Sending domain used by `RESEND_FROM_EMAIL`.
2. Domain verification state.
3. SPF record status.
4. DKIM record status.
5. DMARC record status.
6. Return-path or bounce-domain status if Resend shows one.
7. Whether the active production `RESEND_FROM_EMAIL` exactly matches the verified domain strategy.

Welcome-email deliverability review:

- Subject is short and transactional-adjacent: `You’re on the PickRank waitlist`.
- Preview text matches the low-pressure launch-update purpose.
- Body avoids urgent claims, winnings promises, play-now language, eligibility claims, account-creation prompts, and excessive links.
- HTML has one homepage link plus a plain-text fallback.
- Footer explains why the recipient is receiving the email, includes a visible mailto unsubscribe path, and leaves future broadcast preference handling to Resend Broadcasts with `{{{RESEND_UNSUBSCRIBE_URL}}}`.
- The linked logo asset is remote; if inbox image blocking becomes noisy in testing, consider a simpler text-first header before changing content tone.

Cross-inbox test matrix:

| Provider | Test address | Expected result | Checks |
| --- | --- | --- | --- |
| Gmail | Controlled Gmail inbox | Inbox or Promotions, not Spam | From name, subject, link, image handling, reply-to |
| iCloud | Controlled iCloud inbox | Inbox, not Junk | From name, subject, link, image handling, reply-to |
| Outlook | Controlled Outlook/Hotmail inbox | Inbox or Other, not Junk | From name, subject, link, image handling, reply-to |
| Work email | Parker's work provider or another Microsoft/Google Workspace tenant | Inbox, not Junk | Authentication pass indicators if visible, from/reply-to alignment, link/image treatment |

For each test, submit one production waitlist signup with a fresh address or plus alias, then confirm `public.waitlist_signups`, Resend contact membership, welcome-email send status, inbox placement, and reply-to behavior.

## Parker Configuration Status

- Resend account exists
- Resend already has verified domain `auth.pickrankgames.com`
- Resend API key has been created
- Resend `PickRank Waitlist` segment has been created
- Required Resend variables have been added to Vercel for Production and Preview
- Migration `0012` has been applied to linked Supabase project `jmvzdspiobcjrewndhuf`
- Production testing confirmed Supabase capture, Resend contact sync, and welcome-email send
- 2026-08-09 Gmail plus-alias production test reached `parkerhlevy+pickrank-legalbeta-1786334718225@gmail.com` in Inbox as `PickRank <hello@pickrankgames.com>` with DKIM, SPF, and DMARC pass

Remaining:

- Confirm live Resend Broadcast unsubscribe/preference behavior before broader outreach
- Verify Resend SPF/DKIM/DMARC status for the active sending domain
- Change Production and Preview `RESEND_REPLY_TO_EMAIL` from `info@pickrankgames.com` to the monitored support/privacy address if Parker keeps `support@pickrankgames.com`
- Run the cross-inbox deliverability test matrix

## Outstanding Production Steps

The Gmail path is healthy for the current priority level. The remaining production steps are changing `RESEND_REPLY_TO_EMAIL` to the chosen monitored address, confirming the live Resend Broadcast unsubscribe/preference URL, and running deferred iCloud, Outlook/Hotmail, and work-email checks.
