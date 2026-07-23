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

## Resend Dashboard Checks Still Needed

Record these from Resend before changing production sender values:

1. Domains list includes `auth.pickrankgames.com`, `pickrankgames.com`, or both.
2. Sending capability status for each listed domain.
3. SPF status shown by Resend.
4. DKIM status shown by Resend.
5. DMARC status shown by Resend.
6. Return-path or bounce-domain host shown by Resend.
7. Active production `RESEND_FROM_EMAIL` value in Vercel.
8. Active production `RESEND_REPLY_TO_EMAIL` value in Vercel.

Resend's API can list authenticated domains with `GET /domains`, but it requires a valid `RESEND_API_KEY`. The local repo does not contain a production Resend key, and this audit did not pull Vercel secrets.

## Sender Recommendation

Preferred target:

```text
PickRank <hello@pickrankgames.com>
```

Use that only after `pickrankgames.com` is verified for sending in Resend and its required DNS records are present.

If Resend currently only verifies `auth.pickrankgames.com`, use one of these two paths:

1. Short-term: send from a monitored address on the verified subdomain, such as `PickRank <hello@auth.pickrankgames.com>`, with reply-to set to `hello@pickrankgames.com` or another monitored PickRank mailbox.
2. Better long-term: verify the root sending domain `pickrankgames.com` in Resend, add the required DNS records, then use `PickRank <hello@pickrankgames.com>`.

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
- The footer says unsubscribe links are managed in Resend for future launch broadcasts. Confirm Resend unsubscribe behavior before the first broadcast.
- A new or lightly used sending domain can still land in Promotions/Junk even with correct content; DNS alignment and gradual sending matter more than copy changes at this stage.

No email copy change is recommended from this audit.

## Cross-Inbox Test Matrix

Use fresh addresses or plus aliases where possible. For every test, submit through the production homepage waitlist form, then confirm Supabase row, Resend contact/segment membership, welcome-email send status, inbox placement, link behavior, image behavior, and reply-to behavior.

| Provider | Address to use | Pass condition | Notes to record |
| --- | --- | --- | --- |
| Gmail | Controlled Gmail inbox | Inbox or Promotions, not Spam | Placement, "mailed-by" and "signed-by" if shown, images, link, reply-to |
| iCloud | Controlled iCloud inbox | Inbox, not Junk | Placement, sender display, images, link, reply-to |
| Outlook | Controlled Outlook/Hotmail inbox | Inbox or Other, not Junk | Placement, sender display, images, link, reply-to |
| Work email | Parker's work provider or another Microsoft/Google Workspace tenant | Inbox, not Junk | Authentication pass indicators if visible, sender alignment, link/image treatment, any warning banner |

## Current Verdict

The repo-side email content is low risk and does not need app-code changes before testing.

The likely deliverability gap is sender-domain alignment: repo examples prefer `hello@pickrankgames.com`, but public DNS currently shows Resend return-path records for `auth.pickrankgames.com`, not for `pickrankgames.com`.

Next move: verify the active production sender and domain state in Resend/Vercel, then either align production mail to the verified `auth.pickrankgames.com` sender for the immediate test or verify `pickrankgames.com` in Resend before sending the next production matrix.
