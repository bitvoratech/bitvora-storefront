-- Payment proofs are saved by the storefront's savePaymentProof server action
-- through the service role (rate-limited, Cloudinary URL checked), so the
-- anon column grant and policy from restrict_payment_proof_upload are no
-- longer used. Drop them so the public API can't write to orders at all.
drop policy if exists "Customers can upload payment proof on pending orders" on orders;
revoke update on public.orders from anon;
