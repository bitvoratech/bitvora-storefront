-- ============================================
-- MANUAL IDENTITY REVIEW
-- QoreID is gone. Merchants give both their NIN and CAC number at signup,
-- verify their phone by OTP, and a platform owner then checks the details
-- by hand in the owner console and approves or rejects them.
--
-- verification_status now means:
--   unverified  details or phone OTP still missing
--   pending     phone verified, NIN + CAC submitted, waiting for an owner
--   verified    approved by an owner (can create stores)
--   failed      rejected by an owner; verification_note says why
-- ============================================

alter table merchants
  add column if not exists nin text,
  add column if not exists cac_number text,
  add column if not exists verification_submitted_at timestamptz,
  add column if not exists verification_reviewed_at timestamptz,
  add column if not exists verification_reviewed_by uuid references merchants(id) on delete set null,
  add column if not exists verification_note text;

alter table merchants
  add constraint merchants_nin_format check (nin is null or nin ~ '^[0-9]{11}$') not valid,
  add constraint merchants_cac_format check (cac_number is null or cac_number ~ '^(RC|BN|IT)?[0-9]{1,10}$') not valid;

-- These columns are written only by the server (service role). The merchants
-- UPDATE grant for authenticated users is column-scoped (security_hardening),
-- so it doesn't cover them; this keeps it that way explicitly.
revoke update (nin, cac_number, verification_submitted_at, verification_reviewed_at, verification_reviewed_by, verification_note)
  on public.merchants from anon, authenticated;

-- Owner console queue: pending merchants, oldest submission first.
create index if not exists merchants_pending_review_idx
  on merchants (verification_submitted_at)
  where verification_status = 'pending';
