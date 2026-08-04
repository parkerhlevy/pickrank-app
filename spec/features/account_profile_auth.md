# User Account, Profile, and Authentication Requirements

## Purpose
Define MVP requirements for user accounts, authentication, profile identity, eligibility gates, wallet access, and account-level controls.

## Status
Locked for MVP direction.

## Anchor
MVP account/auth requires a verified user account before paid contest entry, uses Supabase-backed authentication with a unique username/display name, supports basic profile and wallet access, enforces single-entry rules by user account, and includes age, location, and account-status hooks needed before public real-money launch.

---

## Summary
PickRank users need an account before entering paid contests.

During Early Access Beta, PickRank users need an account before entering free beta contests. They must choose a public username, confirm age, supply state/jurisdiction, accept Beta Terms, and accept the Privacy Policy before beta entry. This does not approve public real-money paid entry.

The account system supports:

- sign up
- login
- user identity
- contest entry ownership
- wallet ownership
- leaderboard display
- eligibility checks
- account restrictions
- single-entry enforcement

MVP should stay simple, but must not ignore real-money contest requirements.

---

## MVP Account Requirements

Users must have an account to:

- enter paid contests
- build/save lineups
- view their wallet
- receive payouts
- withdraw cash balance
- view historical entries

Users may be allowed to browse the lobby before account creation, but cannot enter contests without signing in.

---

## Authentication Methods

### MVP Recommended
Use Supabase-backed authentication with supported sign-in methods that preserve return-to-flow behavior.

Supported MVP auth options:

- magic link
- Google OAuth

The current repo implementation uses Google sign-in plus email magic-link sign-in. Additional methods like password auth or one-time email code can remain future options, but they are not required for the current MVP baseline.

### Social login
Do not require social login for MVP, but allow it when it reduces friction and still preserves the same account and contest-entry rules.

Future options:

- Apple
- other provider-backed OAuth methods

---

## Sign Up Flow

Minimum required fields:

- email address
- password or passwordless credential
- username / display name
- date of birth confirmation or age confirmation
- terms acceptance
- privacy policy acceptance

Before paid contest entry, user must also satisfy eligibility requirements.

---

## Login Flow

Users can log in with the supported auth method.

After login:

- return user to previous screen when possible
- preserve intended action when possible

Example:

If user taps `Enter Contest` while logged out:

1. show login/sign-up gate
2. user completes auth
3. return to contest entry/payment flow

---

## Email Verification

Email verification is required before paid contest entry.

Unverified users may be allowed to:

- browse contests
- view How It Works
- view public lobby

Unverified users may not:

- enter paid contests
- receive payouts
- withdraw funds

User-facing copy:

```text
Verify your email to enter contests.
```

---

## Username / Display Name

Users must choose a public display name.

Used for:

- leaderboard
- results reveal
- profile

Rules:

- must be unique
- must be editable only with limits
- must pass profanity/abuse filtering
- should not expose user email

MVP display format:

```text
Username
```

Do not show real name publicly in MVP.

---

## Profile Screen

MVP Profile should include:

- username/display name
- email address
- wallet balances
- account status
- basic settings
- logout

Wallet balances:

```text
Cash Balance: $42.50
Site Credit: $10.00
```

If withdrawal path is enabled:

```text
[ Withdraw ]
```

---

## Wallet Access

Wallet is tied to user account.

Users can access wallet summary through Profile.

MVP wallet UI should show:

- cash balance
- site credit balance
- withdrawal entry point, if enabled

Do not build full transaction history unless required by provider/compliance.

Backend ledger remains required.

---

## Eligibility Gates

Because PickRank involves paid skill-based contests, MVP must include eligibility hooks before public real-money launch.

The current account foundation captures eligibility inputs; it does not independently verify public real-money eligibility.

Treat these as self-attested or account-captured fields until legal/provider systems are connected:

- age confirmation
- state/jurisdiction
- Terms acceptance
- Privacy acceptance

Treat these as real verification only after an approved internal or provider-backed review has checked the account against the relevant source of truth:

- supported jurisdiction approval
- legal age or date-of-birth verification
- identity/KYC status
- payment-provider eligibility
- withdrawal-provider eligibility
- responsible-play or self-exclusion restrictions

### Internal testing status

Internal testing eligibility is a separate account decision from public paid-entry eligibility.

An account may be marked eligible for controlled internal testing when:

- the account belongs to a known founder, operator, QA user, or test identity
- the email/auth identity is recognized by the internal team
- age confirmation, jurisdiction, Terms, and Privacy are captured
- the account has no known restriction, suspension, self-exclusion, or compliance hold
- the enabled flow is free/test entry only and does not move real money

Internal testing eligibility must not unlock production payment capture, withdrawals, public paid contest entry, or cash-balance movement.

### Public paid-entry eligibility

Public paid-entry eligibility requires more than completed profile fields.

Do not mark a public account eligible for real-money paid entry until legal/provider review has defined supported jurisdictions, age thresholds, identity/KYC requirements, payment eligibility, withdrawal requirements, responsible-play requirements, and the server-side checks that enforce them.

### Age gate
User must confirm they meet the required minimum age.

Recommended MVP placeholder:

```text
I confirm I am at least 18 years old.
```

Final age threshold may depend on legal review and jurisdiction.

### Location / jurisdiction gate
User eligibility may depend on state or location.

MVP should support storing:

- user state / jurisdiction
- eligibility status
- eligibility checked timestamp

Do not allow paid contest entry if user is in a blocked or unknown jurisdiction once legal rules are defined.

### Identity / KYC gate
KYC may be required for withdrawals or real-money contest participation depending on provider/legal review.

MVP should support status fields even if KYC is not fully implemented at first.

Recommended statuses:

- `not_required`
- `required`
- `pending`
- `verified`
- `failed`

---

## Account Status

Each account should have a status.

Recommended statuses:

```text
active
restricted
suspended
closed
```

### Active
User can use the app normally, subject to eligibility.

### Restricted
User can log in but cannot enter contests, withdraw, or receive new payouts until resolved.

### Suspended
User cannot enter contests or perform wallet actions.

### Closed
Account is no longer active.

---

## Contest Entry Permission Checks

Before entering a paid contest, backend must verify:

- user is authenticated
- email is verified
- account status is `active`
- user meets age requirement
- user is in an eligible jurisdiction
- user does not already have an entry in the contest
- contest state is `open`
- payment can be completed

If any check fails, entry is blocked.

---

## Single-Entry Enforcement

MVP rule:

```text
One entry per user per contest.
```

Enforcement must be backend-driven.

Do not rely only on hiding buttons in UI.

Backend should enforce a uniqueness constraint on:

```text
user_id + contest_id
```

If user already entered:

- show `Edit Lineup`
- do not show payment flow
- do not allow duplicate entry creation

---

## Account Recovery

MVP should support basic account recovery through auth provider.

Examples:

- password reset
- magic link re-login
- email code re-login

Do not build custom recovery flows unless needed.

---

## Notifications Preference Placeholder

MVP should support notification preference fields because lineup reminders are already part of the product logic.

Recommended fields:

- `email_notifications_enabled`
- `push_notifications_enabled`
- `lineup_reminders_enabled`

Actual push notification implementation can be defined separately.

---

## Privacy / Public Identity

Publicly visible:

- username/display name
- leaderboard rank
- score
- payout amount in final leaderboard if applicable

Not publicly visible:

- email
- cash balance
- site credit balance
- payment method
- withdrawal status
- legal name
- date of birth
- location/jurisdiction

---

## Data Model

### User

Recommended fields:

- `user_id`
- `email`
- `email_verified`
- `username`
- `display_name`
- `date_of_birth`
- `age_confirmed`
- `terms_accepted_at`
- `privacy_policy_accepted_at`
- `account_status`
- `created_at`
- `updated_at`
- `last_login_at`

### User Eligibility

Recommended fields:

- `user_id`
- `jurisdiction`
- `eligibility_status`
- `eligibility_checked_at`
- `age_gate_status`
- `kyc_status`
- `kyc_provider_id`
- `restriction_reason`
- `updated_at`

### User Preferences

Recommended fields:

- `user_id`
- `email_notifications_enabled`
- `push_notifications_enabled`
- `lineup_reminders_enabled`
- `marketing_emails_enabled`
- `updated_at`

---

## User-Facing Copy

### Logged-out entry gate
```text
Create an account or log in to enter this contest.
```

### Email verification gate
```text
Verify your email to enter contests.
```

### Eligibility blocked
```text
Paid contests are not available for your account at this time.
```

### Already entered
```text
You're already entered. Edit your lineup until lock.
```

### Account restricted
```text
Your account is restricted from entering contests. Contact support if you think this is a mistake.
```

---

## Backend Requirements

- All paid contest actions require authenticated user ID.
- Entry creation must validate account eligibility server-side.
- Wallet balances must be linked to user ID.
- Usernames must be unique.
- Public leaderboard should use display name, not email.
- Restricted/suspended users cannot enter paid contests.
- Withdrawals require active account and any required verification.
- Account state changes should be auditable.

---

## MVP Constraints

Build for MVP:

- sign up/login
- email verification before paid entry
- unique username/display name
- basic Profile screen
- wallet balance access from Profile
- account status field
- age gate placeholder
- jurisdiction/eligibility status fields
- KYC status placeholder
- backend single-entry enforcement
- basic logout/account recovery through auth provider

Do not build for MVP:

- social graph
- friend profiles
- avatars/photo upload
- public bios
- follow/friend system
- username marketplace
- full account deletion UI unless legally required
- custom auth infrastructure if provider handles it
- advanced notification preference center

---

## Future Expansion

Potential future additions:

- social login
- profile avatars
- public user stats
- historical performance profile
- friend leaderboard
- referral system
- responsible gaming / play limit controls
- self-exclusion tooling
- enhanced KYC flow
- location verification integrations
- account deletion/export workflow
