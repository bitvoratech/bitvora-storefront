-- ============================================
-- KEEP ONLY THE LAST 4 DIGITS OF APPROVED NINs
-- Once an owner approves a merchant, the full NIN is no longer needed. The
-- app now replaces it with *******1234 on approval; this allows that format
-- and masks NINs that were approved before.
-- ============================================

alter table merchants drop constraint if exists merchants_nin_format;
alter table merchants
  add constraint merchants_nin_format
  check (nin is null or nin ~ '^[0-9]{11}$' or nin ~ '^\*{7}[0-9]{4}$') not valid;

update merchants
  set nin = repeat('*', 7) || right(nin, 4)
  where verification_status = 'verified' and nin ~ '^[0-9]{11}$';

update merchant_verifications
  set reference = repeat('*', 7) || right(reference, 4)
  where type = 'nin' and reference ~ '^[0-9]{11}$';

-- Leftover from the old automatic check, which could hold a full NIN.
update merchants
  set verification_reference = repeat('*', 7) || right(verification_reference, 4)
  where verification_type = 'nin' and verification_reference ~ '^[0-9]{11}$';
