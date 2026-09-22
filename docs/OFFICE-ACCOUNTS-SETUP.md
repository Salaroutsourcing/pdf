# Recommended next stage: Supabase office accounts

Status: implementation plan, not an enabled sign-in system. The current release saves an office name and tool preferences in the browser. It does not authenticate staff or synchronize anything.

## Product direction

“Your office. Your PDF workspace.” Keep everyday PDF processing local and free to use. Introduce accounts to synchronize office branding and preferred tools, not to collect documents. A later paid team plan could add centrally managed presets and staff administration, after validating demand with real offices.

Start with three pilot offices. Observe whether workers install the app, return to it and complete their regular tasks. Ask which document workflows cost them time. Do not invent customer counts or testimonials.

## Recommended service and boundaries

Use Supabase Auth for verified email sign-in and Postgres for office metadata. Supabase supports passwordless email links/OTPs and database row-level security. This is a recommended architecture, not a claim that an account or paid plan has been created.

Keep PDFs, signature images, OCR text and generated files on the user's device. The account backend only needs office IDs, names, membership, role and favorite tool IDs. No document storage bucket is needed for this phase.

## Setup sequence

1. Create separate development and production Supabase projects in a suitable region. Confirm the current service plan and budget before purchasing anything.
2. Configure the final HTTPS website URL and exact permitted authentication callback URLs. Configure a verified sender/SMTP provider for real staff email; test delivery, expiry and rate limits before launch.
3. Enable verified email OTP sign-in. Add accessible sign-in, signed-out, expired-link, sign-out and error states. Never represent an entered office name as authentication.
4. Add the data model below through versioned migrations. Enable RLS and revoke default anonymous grants on every exposed table. Give authenticated users only the operations required by policy.
5. Build authenticated office creation and invitations as server-side operations. Verify the caller's session and role on every operation. Make creation of the office and owner membership atomic.
6. Connect the frontend using the project URL and publishable key. Keep secret/service-role keys server-side only. Do not add secrets to this repository or browser code.
7. Add account controls: edit branding, list/revoke members, export/delete account preferences and sign out. Keep public tool use available without an account.
8. Test isolation using two offices and several roles before enabling sign-in on the public site.

## Data model

| Table | Fields | Access |
| --- | --- | --- |
| offices | id UUID, name, created_at | Members read; owner/admin can update allowed branding fields. |
| memberships | office_id, user_id, role (owner/admin/member), created_at | Membership determines access. Clients cannot assign or elevate their own role. |
| preferences | office_id, user_id, favorite_tool_ids | A current member can read/update their own preferences. Validate tool IDs. |
| invitations | office_id, email, token_hash, expires_at, accepted_at, role | Server-managed; no anonymous listing or direct client updates. |

Enforce unique office/user memberships, valid roles, bounded names and foreign keys. Avoid policies that recursively query the same protected membership table. Use narrowly scoped helper functions with a fixed search path where needed, and limit who can execute them. Do not trust an office ID or a role supplied by the browser without database authorization.

Invitation acceptance must require a verified matching email, an unexpired single-use token, and an atomic transaction. Store token hashes rather than raw tokens. Never allow an invitee to select their own role. Prevent deleting or demoting the last owner without an explicit ownership transfer.

## Required acceptance tests

- Signed-out requests cannot read or change any office metadata.
- Office A users cannot read/update Office B by changing URL, JSON payload or office ID.
- Members cannot create invitations or elevate roles; revoked members immediately lose access.
- Owner/admin operations validate the acting user, target office and allowed changes.
- Expired, reused or wrong-email invitations fail without revealing membership data.
- Account deletion and sign-out clear local session state; core PDF tools remain usable.
- Network inspection confirms no PDF contents, filenames, signature images or OCR text are sent to the account backend.

## References

- [Supabase passwordless email sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)

Do not claim team accounts are available until the backend, frontend and isolation tests are implemented and deployed.
