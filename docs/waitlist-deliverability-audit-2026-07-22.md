# Waitlist Deliverability Audit - 2026-07-22

## Scope

This is the narrow waitlist deliverability pass from `docs/agent-handoff.md`.

In scope:

- Public DNS checks for the PickRank sending-domain candidates
- Sender and reply-to recommendation
- Welcome-email deliverability review
- Cross-inbox test matrix

Out of scope:

- Waitlist capture behavior
- Auth, eligibility, payments, wallet-ledger, scoring, and final-results behavior
- Supabase policy changes
- Vercel environment changes
- Resend account settings
- DNS record changes

The follow-up account, DNS, and Vercel changes below were completed later only after explicit approval.

## Repo Evidence

The waitlist send path uses these server-only variables:

```text
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_REPLY_TO_EMAIL
RESEND_WAITLIST_SEGMENT_ID
```

The current repo example points `RESEND_FROM_EMAIL` at:

```text
PickRank <hello@pickrankgames.com>
```

The handoff says Resend already has verified domain `auth.pickrankgames.com`, and production testing confirmed Supabase capture, Resend segment sync, and welcome-email sending.

## Public DNS Findings

Checked from this machine on 2026-07-22 using `dig`.

| Record | Result | Deliverability meaning |
| --- | --- | --- |
| `TXT pickrankgames.com` | `v=spf1 include:_spf.hostedemail.com ~all` | Root domain has hosted-email SPF, but this is not Resend-specific evidence. |
| `TXT _dmarc.pickrankgames.com` | No record returned | No visible root DMARC policy from public DNS. |
| `TXT auth.pickrankgames.com` | No record returned | No direct SPF TXT at the visible `auth` host. |
| `TXT _dmarc.auth.pickrankgames.com` | No record returned | No visible subdomain DMARC policy from public DNS. |
| `CNAME resend._domainkey.pickrankgames.com` | No record returned | No visible Resend DKIM at the common root-domain selector checked. |
| `CNAME resend._domainkey.auth.pickrankgames.com` | No record returned | No visible Resend DKIM at the common auth-subdomain selector checked. |
| `TXT send.pickrankgames.com` | No record returned | No visible default Resend return-path SPF for the root domain. |
| `MX send.pickrankgames.com` | No record returned | No visible default Resend return-path MX for the root domain. |
| `TXT send.auth.pickrankgames.com` | `v=spf1 include:amazonses.com ~all` | The default Resend return path appears configured for the `auth` subdomain. |
| `MX send.auth.pickrankgames.com` | `10 feedback-smtp.us-east-1.amazonses.com.` | The default Resend bounce path appears configured for the `auth` subdomain. |

Public DNS does not prove the Resend dashboard status, because Resend may use account-specific DKIM records and dashboard-side verification state. It does show that `auth.pickrankgames.com` has the strongest public evidence of Resend return-path setup, while `pickrankgames.com` does not yet show matching Resend return-path records.

## Live Dashboard Verification

Checked in Vercel and Resend after the public DNS pass, then updated after the approved root-domain sender cutover.

Approved external deliverability changes completed on 2026-07-22:

- Deleted `auth.pickrankgames.com` from Resend because the current Resend plan allowed only one verified domain.
- Added `pickrankgames.com` to Resend in North Virginia (`us-east-1`).
- Moved authoritative DNS for `pickrankgames.com` from ZenBusiness SystemDNS to Cloudflare Free nameservers `gannon.ns.cloudflare.com` and `val.ns.cloudflare.com`.
- Copied the existing web/mail records into Cloudflare and added the new Resend records for root `pickrankgames.com`.
- Verified `pickrankgames.com` in Resend.
- Updated Vercel `RESEND_FROM_EMAIL` to `PickRank <hello@pickrankgames.com>` for Production and Preview, leaving `RESEND_REPLY_TO_EMAIL` unchanged.
- Redeployed the current Production deployment from `main` commit `5402c0a` so the saved sender value takes effect.

Vercel environment-variable dashboard:

| Variable | Vercel scope shown | Value status |
| --- | --- | --- |
| `RESEND_FROM_EMAIL` | Single sensitive Project variable scoped to Production and Preview | Updated to `PickRank <hello@pickrankgames.com>` and redeployed to Production. Vercel does not reveal sensitive values after save, but the following production send proves the effective value. |
| `RESEND_REPLY_TO_EMAIL` | Single sensitive Project variable scoped to Production and Preview | Vercel confirms presence and shared Production/Preview scope, but does not reveal the stored sensitive value after creation. |

Resend sent-email logs from the production waitlist test show the effective production sender values:

| Sent test | From | Reply-to | Status |
| --- | --- | --- | --- |
| Gmail test to `parkerhlevy@gmail.com` | `PickRank <hello@auth.pickrankgames.com>` | `info@pickrankgames.com` | Delivered |
| Work-email test to `parkerlevy@microsoft.com` | `PickRank <hello@auth.pickrankgames.com>` | `info@pickrankgames.com` | Delivered |
| Gmail root-domain test to `parkerhlevy+pickrank-deliverability-20260723-002@gmail.com` | `PickRank <hello@pickrankgames.com>` | `info@pickrankgames.com` | Delivered |

Because Vercel stores each sender variable as one sensitive entry scoped to both Production and Preview, Preview appears configured to use the same values. This was not independently proven by sending a Preview-environment waitlist email.

Resend Domains dashboard:

| Domain | Resend domain status | Region | Sending status |
| --- | --- | --- | --- |
| `auth.pickrankgames.com` | Deleted after approval | North Virginia (`us-east-1`) | Removed to avoid upgrading beyond the one-domain plan. |
| `pickrankgames.com` | `verified` | North Virginia (`us-east-1`) | Resend says the domain is ready to send emails. |

Resend records for `auth.pickrankgames.com`:

| Record group | Host shown by Resend | Content shown by Resend | Status shown by Resend |
| --- | --- | --- | --- |
| DKIM | `resend._domainkey.auth` | TXT public key beginning `p=MIGfMA0GCSqGSIb3...` | `verified` |
| Return-path / bounce MX | `send.auth` | `feedback-smtp.us-east-1.amazonses.com` priority `10` | `verified` |
| Return-path SPF | `send.auth` | `v=spf1 include:amazonses.com ~all` | `verified` |
| DMARC | `_dmarc` | `v=DMARC1; p=none;` | Optional row with no verified status shown |

Fresh public DNS spot-checks matched the Resend dashboard for `auth.pickrankgames.com`: `resend._domainkey.auth.pickrankgames.com` returns the Resend DKIM TXT public key, `send.auth.pickrankgames.com` returns the Amazon SES SPF TXT record, and `send.auth.pickrankgames.com` returns the Amazon SES feedback MX record. Public DNS still did not show Resend return-path records for root `pickrankgames.com`, and root `pickrankgames.com` still showed only hosted-email SPF.

After the Cloudflare cutover, public DNS spot-checks resolved the new root-domain Resend records: `resend._domainkey.pickrankgames.com` returned the Resend DKIM TXT public key, `send.pickrankgames.com` returned Amazon SES SPF, `send.pickrankgames.com` returned the Amazon SES feedback MX record, and `_dmarc.pickrankgames.com` returned `v=DMARC1; p=none;`.

## Sender Recommendation

Preferred target:

```text
PickRank <hello@pickrankgames.com>
```

This is now the active Production and Preview sender value in Vercel, with root `pickrankgames.com` verified in Resend.

Do not use a Resend testing sender or any non-PickRank sender for production waitlist mail.

## Welcome-Email Risk Review

Current low-risk points:

- Subject is short and specific: `You’re on the PickRank waitlist`.
- Preview text matches a launch-update expectation.
- Body avoids urgent claims, winnings promises, play-now language, eligibility claims, and account-creation prompts.
- HTML includes one homepage link and a plain-text fallback.
- Footer explains why the recipient received the email.

Watch items:

- The header logo is a remote image. If inboxes block or penalize it, test a simpler text-first header before changing the email message.
- The welcome email footer now includes a visible mailto unsubscribe link and the Email API send includes a `List-Unsubscribe` header. Confirm the configured mailto target is monitored.
- Future Resend Broadcasts and the preferred Resend Automation welcome-email path must include `{{{RESEND_UNSUBSCRIBE_URL}}}` or Resend's unsubscribe footer so Resend can manage the live preference page and unsubscribe flow.
- A new or lightly used sending domain can still land in Promotions/Junk even with correct content; DNS alignment and gradual sending matter more than copy changes at this stage.

No additional email copy change is recommended from this audit.

## Cross-Inbox Test Matrix

Use fresh addresses or plus aliases where possible. For every test, submit through the production homepage waitlist form, then confirm Supabase row, Resend contact/segment membership, welcome-email send status, inbox placement, link behavior, image behavior, and reply-to behavior.

| Provider | Address to use | Pass condition | Notes to record |
| --- | --- | --- | --- |
| Gmail | Controlled Gmail inbox | Inbox or Promotions, not Spam | Placement, "mailed-by" and "signed-by" if shown, images, link, reply-to |
| iCloud | Controlled iCloud inbox | Inbox, not Junk | Placement, sender display, images, link, reply-to |
| Outlook | Controlled Outlook/Hotmail inbox | Inbox or Other, not Junk | Placement, sender display, images, link, reply-to |
| Work email | Parker's work provider or another Microsoft/Google Workspace tenant | Inbox, not Junk | Authentication pass indicators if visible, sender alignment, link/image treatment, any warning banner |

## Matrix Run - 2026-07-22

Fresh production testing started at 2026-07-22 20:47 PDT using the verified production sender `PickRank <hello@auth.pickrankgames.com>` and reply-to `info@pickrankgames.com`.

| Provider | Test address | Submit status | Supabase row status | Resend contact / segment status | Resend welcome-email status | Inbox placement | Sender display | Authentication indicators | Image / link behavior | Reply-to behavior |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gmail | `parkerhlevy+pickrank-deliverability-1784778476867@gmail.com` | Production homepage form returned the waitlist success state. Vercel runtime-error check found no project runtime errors in the surrounding two-hour window. | Not directly queryable from this machine: Vercel env pull masks sensitive Production values as `[SENSITIVE]`, and local `.env.local` does not include `SUPABASE_SERVICE_ROLE_KEY`. The successful welcome email is indirect evidence that the Supabase-first workflow created or found the row before Resend sync. | Not directly queryable from this machine for the same masked `RESEND_API_KEY` reason. Gmail receipt is indirect evidence that Resend accepted and sent the welcome email. Segment membership still needs Resend dashboard/API confirmation. | Delivered to Gmail at 2026-07-23 03:47:58 UTC. | Gmail labels: `INBOX`, `CATEGORY_PERSONAL`, `IMPORTANT`, `UNREAD`; no `SPAM` or `CATEGORY_PROMOTIONS` label. | Gmail shows `PickRank hello@auth.pickrankgames.com`. | Gmail raw headers show `dkim=pass` for `auth.pickrankgames.com`, `dkim=pass` for `amazonses.com`, and `spf=pass` for `send.auth.pickrankgames.com`. | Raw MIME contains the remote logo image and the `https://www.pickrankgames.com` link. Direct network checks returned `200` for both the homepage link and the PNG logo asset. Gmail visual image auto-load state was not available through the mailbox connector. | Raw headers show `Reply-To: info@pickrankgames.com`. No reply was sent during this verification-only pass. |
| iCloud | Deferred | Parker decided this is not a near-term priority. | Not checked. | Not checked. | Not checked. | Not checked. | Not checked. | Not checked. | Not checked. | Not checked. |
| Outlook/Hotmail | Deferred | Parker decided this is not a near-term priority. | Not checked. | Not checked. | Not checked. | Not checked. | Not checked. | Not checked. | Not checked. | Not checked. |
| Work email | Deferred | Parker decided this is not a near-term priority. | Not checked. | Not checked. | Not checked. | Not checked. | Not checked. | Not checked. | Not checked. | Not checked. |

No settings were changed during this matrix run. The only live submission with fully inspectable mailbox evidence was the Gmail plus-alias test. The remaining inbox-provider checks are intentionally deferred rather than launch-blocking.

## Root Sender Verification - 2026-07-22

Production was redeployed from the current `main` deployment after the Vercel sender update:

| Deployment | Source | Status | Notes |
| --- | --- | --- | --- |
| `dpl_CJWc3epCEWjhxvCGH3UobkwC5JVv` | `main` commit `5402c0a` | Ready after about 49s | Redeploy of the current Production source with latest Project Settings. |

The first submit immediately after redeploy failed because the browser still had the old pre-redeploy Server Action identifier loaded. Vercel logged `POST / 404` with `Failed to find Server Action`. After reloading the production homepage, the retry succeeded.

| Provider | Test address | Submit status | Resend welcome-email status | Inbox placement | Sender display | Authentication indicators | Reply-to behavior |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Gmail | `parkerhlevy+pickrank-deliverability-20260723-002@gmail.com` | Production homepage form returned `You’re on the list.` Vercel runtime logs show `POST / 200` on `dpl_CJWc3epCEWjhxvCGH3UobkwC5JVv`. | Resend event `8212425d-cb61-4ea0-9127-4385d04d4fd8` shows `Sent` and `Delivered` at 2026-07-22 22:46 PDT. | Gmail labels: `INBOX`, `CATEGORY_UPDATES`, `IMPORTANT`, `UNREAD`; no `SPAM` label. | Gmail and raw headers show `PickRank <hello@pickrankgames.com>`. | Gmail raw headers show `dkim=pass` for `pickrankgames.com`, `dkim=pass` for `amazonses.com`, and `spf=pass` for the `send.pickrankgames.com` return-path. | Raw headers show `Reply-To: info@pickrankgames.com`, unchanged. |

## Legal Beta Welcome Test - 2026-08-09

After the legal beta site-readiness deployment, a fresh production homepage waitlist submission was sent to `parkerhlevy+pickrank-legalbeta-1786334718225@gmail.com`.

| Provider | Submit status | Inbox placement | Sender display | Authentication indicators | Reply-to behavior | Copy review |
| --- | --- | --- | --- | --- | --- | --- |
| Gmail | Production homepage form returned `submitted` for the fresh plus alias. | Gmail labels: `INBOX`, `CATEGORY_PROMOTIONS`, `UNREAD`; no `SPAM` label. | Gmail and raw headers show `PickRank <hello@pickrankgames.com>`. | Gmail raw headers show `dkim=pass` for `pickrankgames.com`, `dkim=pass` for `amazonses.com`, `spf=pass` for `send.pickrankgames.com`, and `dmarc=pass` for `pickrankgames.com`. | Raw headers show `Reply-To: info@pickrankgames.com`, unchanged. | Current welcome email includes why the recipient received it, no-purchase/no-entry-fee/no-prizes language, Privacy Policy link, Playground Sports, LLC postal address, and NFL/no-endorsement language. The repo now adds visible mailto unsubscribe handling for the welcome email; a live Resend Broadcast unsubscribe/preference URL must still be confirmed before broader marketing broadcasts. |

## Unsubscribe Readiness Update - 2026-08-09

Repo-side changes now make the waitlist welcome email unsubscribe-ready without adding a custom unsubscribe database or route:

- The visible HTML and plain-text footer include a mailto `Unsubscribe` path.
- The Resend Email API send payload includes `List-Unsubscribe` using the configured `RESEND_REPLY_TO_EMAIL` address.
- The one-off welcome email does not use `{{{RESEND_UNSUBSCRIBE_URL}}}`, because Resend documents that token for Broadcasts and Automations.
- Future Resend Broadcasts must include `{{{RESEND_UNSUBSCRIBE_URL}}}` as the visible unsubscribe link/button target, or use Resend's built-in unsubscribe footer, before broader outreach.
- Operators must mark manual mailto unsubscribe requests as unsubscribed in Resend.

## Resend Automation Readiness Update - 2026-08-09

The repo now supports a preferred hosted-unsubscribe welcome-email path without changing the current fallback:

- If `RESEND_WAITLIST_WELCOME_EVENT_NAME` is not set, the app keeps the current Email API welcome email with visible mailto unsubscribe plus `List-Unsubscribe`.
- If `RESEND_WAITLIST_WELCOME_EVENT_NAME` is set, the app syncs the Resend contact and triggers `resend.events.send` with the Resend contact ID instead of sending the raw Email API welcome email.
- The Resend Automation template must include a visible unsubscribe link or button using `{{{RESEND_UNSUBSCRIBE_URL}}}`, or Resend's built-in unsubscribe footer.
- Supabase remains the waitlist source of truth and still skips globally unsubscribed Resend contacts before any welcome send or Automation trigger.

Do not set `RESEND_WAITLIST_WELCOME_EVENT_NAME` in Vercel until the Resend Automation is enabled and tested with a fresh inbox alias. The first hosted-unsubscribe test must record inbox placement, sender, reply-to, DKIM, SPF, DMARC, the visible Resend unsubscribe link, and whether the Resend preference page marks the contact unsubscribed globally.

## Resend Automation Hosted-Unsubscribe Test - 2026-08-10

After Parker created and enabled the Resend Automation, Vercel Production and Preview were configured with:

```text
RESEND_WAITLIST_WELCOME_EVENT_NAME=waitlist.joined
```

Production was redeployed from the latest pushed `main` source so the new env var took effect.

| Deployment | Source | Status | Notes |
| --- | --- | --- | --- |
| `dpl_7z8RMBd5PbDH7d9cSXr4NEd8Xyrn` | `main` commit `5c9698b` | Ready | Production alias `https://www.pickrankgames.com` points at the redeployment. |

Fresh production testing used `parkerhlevy+pickrank-resend-auto-20260810-001027@gmail.com`.

| Provider | Submit status | Inbox placement | Sender display | Authentication indicators | Reply-to behavior | Unsubscribe behavior |
| --- | --- | --- | --- | --- | --- | --- |
| Gmail | Production homepage form returned `You’re on the list.` | Gmail labels: `INBOX`, `CATEGORY_PROMOTIONS`, `IMPORTANT`, `UNREAD`; no `SPAM` label. | Gmail and raw headers show `PickRank <hello@pickrankgames.com>`. | Gmail raw headers show `dkim=pass` for `pickrankgames.com`, `dkim=pass` for `amazonses.com`, `spf=pass` for `send.pickrankgames.com`, and `dmarc=pass` for `pickrankgames.com`. | Raw headers show `Reply-To: info@pickrankgames.com`. | The visible footer link points to Resend's hosted unsubscribe URL. Raw headers include `List-Unsubscribe` with the same hosted URL plus `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. |

The final uploaded Resend template source is preserved at `docs/marketing/pickrank-waitlist-welcome-resend-template.html`. The full footer sentence `Unsubscribe from PickRank waitlist and product update emails.` is linked so Resend's generated plain-text part does not run the link label into adjacent copy.

## Later Polish

Rainy-day follow-ups, not launch blockers:

- Retest iCloud, Outlook/Hotmail, and a Microsoft work inbox using fresh production waitlist aliases.
- Add a custom Resend tracking subdomain only if PickRank enables open/click tracking.
- Move DMARC beyond `p=none` only after there is more sending history and no legitimate mail stream is failing authentication.
- Decide whether `RESEND_REPLY_TO_EMAIL` should stay `info@pickrankgames.com` or move to `hello@pickrankgames.com`.
- Confirm the exact live Resend Broadcast unsubscribe/preference URL before any broader marketing broadcast.

## Current Verdict

The repo-side email content is low risk and does not need app-code changes before testing.

Production waitlist mail is now using the verified root-domain sender: `PickRank <hello@pickrankgames.com>`, with `info@pickrankgames.com` as reply-to. Resend and Gmail both confirm the new sender, and Gmail confirms DKIM, SPF, and DMARC pass on the root-domain path. The preferred hosted-unsubscribe welcome-email path is live through Resend Automations, and Gmail confirms both visible hosted unsubscribe and one-click unsubscribe headers.

Next move: treat root-domain waitlist deliverability as good enough for the current priority level. Keep iCloud, Outlook/Hotmail, work-email retesting, tracking metrics, and a stricter DMARC policy as later polish rather than near-term blockers.
