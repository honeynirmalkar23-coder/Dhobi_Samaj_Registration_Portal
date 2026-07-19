# Supabase Backend Setup

This file documents Phase 08 backend setup for the Dhobi Samaj Registration Portal.

## 1. Install Supabase CLI

Install the Supabase CLI using the official method for your platform, then verify:

```bash
supabase --version
```

## 2. Initialize And Link

The repository already contains `supabase/config.toml`, migrations, and Edge Functions.

For a hosted project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Do not commit access tokens or service-role keys.

## 3. Local Development

Start local Supabase:

```bash
npx supabase start
```

Apply a clean local database rebuild:

```bash
npx supabase db reset
```

The migrations create private storage buckets:

- `applicant-photos`
- `payment-proofs`
- `payment-qr-codes`

## 4. Edge Function Secrets

Set server-side function secrets only in Supabase:

```bash
supabase secrets set ALLOWED_ORIGINS="http://localhost:5173,https://your-production-origin.example"
supabase secrets set RATE_LIMIT_SALT="use-a-long-random-secret"
```

Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions at runtime.
Never add `SUPABASE_SERVICE_ROLE_KEY` to Vite env files or `src/`.

## 5. Serve Edge Functions Locally

```bash
npx supabase functions serve create-registration
npx supabase functions serve get-public-payment-settings
npx supabase functions serve submit-payment-proof
npx supabase functions serve get-public-registration-status
```

## 6. Deploy Edge Functions

```bash
npx supabase functions deploy create-registration
npx supabase functions deploy get-public-payment-settings
npx supabase functions deploy submit-payment-proof
npx supabase functions deploy get-public-registration-status
```

## 7. Frontend Environment

Create `.env.local`:

```bash
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_PUBLIC_ANON_KEY"
```

The browser must use only the Supabase URL and anon key.

## 8. First Administrator

Create the first administrator through the Supabase dashboard or a trusted server/admin tool.
Set trusted app metadata:

```json
{
  "role": "admin"
}
```

The portal checks `app_metadata.role`; it does not trust `user_metadata`, email addresses, or browser-provided roles.

## 9. Generate Database Types

After migrations are applied:

```bash
npm run supabase:types
```

Review generated changes before committing.

## 10. RLS Testing

Test as:

- Anonymous user: cannot directly select/insert/update application tables or read private storage.
- Authenticated non-admin: cannot access admin data.
- Authenticated admin: can read allowed admin data and call trusted RPCs.

Recommended commands when Supabase CLI tests exist:

```bash
npx supabase test db
```

## 11. Backup Recommendations

- Enable automated database backups in production.
- Keep storage lifecycle policies conservative.
- Export audit logs before destructive infrastructure changes.
- Test restore procedures before public launch.

## 12. Production Checklist

- Migrations applied from versioned SQL.
- `ALLOWED_ORIGINS` contains only approved origins.
- `RATE_LIMIT_SALT` is set and strong.
- Service-role key is not present in browser code.
- RLS is enabled on every application table.
- Private buckets are not public.
- Edge Functions are deployed.
- First administrator has trusted `app_metadata.role = "admin"`.
- `npm test` and `npm run build` pass.
- Public registration, payment proof, status lookup, and admin review are tested on a safe project.

Phase 08 intentionally does not implement PDF generation, receipt download, email, SMS, WhatsApp, payment-gateway integration, OCR, or automatic bank/UPI verification.
