# Dhobi Samaj Registration Portal - Project Audit

Generated: 2026-07-19 23:11:25 IST  
Workspace: `/Users/yogi/web_projects/Dhobi_Samaj_Registration_Portal`  
Auditor: Codex  

## Scope

This audit reviewed the local project source, frontend routes, admin/payment flows, local development backend, Supabase migrations/functions, configuration files, dependency status, and deployment readiness for Vercel.

Not verified: a live Supabase project, real production Vercel deployment, real UPI app scanner behavior on a mobile device, or production email/SMS integrations.

## Executive Summary

The project is in a workable state: the production build passes, TypeScript compilation passes, unit tests pass, and the production dependency security audit currently reports no known vulnerabilities.

The most important fixes before deployment are:

1. Remove and rotate real-looking secrets from `.env.example`.
2. Update the failing E2E test for the new generated QR code behavior.
3. Align the production Supabase payment settings function with the new amount-aware generated QR code flow.
4. Add Vercel SPA rewrite configuration for direct route refreshes.
5. Configure production Supabase Edge Function CORS with the Vercel domain.

## Verification Results

| Check | Result | Notes |
| --- | --- | --- |
| `npm run build` | Passed | `tsc -b && vite build` completed successfully. Vite warned that one JS chunk is larger than 500 kB. |
| `npm test` | Passed | 47 test files passed, 218 tests passed. |
| `npm audit --omit=dev --audit-level=moderate` | Passed | 0 production dependency vulnerabilities found. |
| `npm outdated --json` | Completed with outdated packages | Several major updates are available, including React, React Router, Vite, Tailwind, TypeScript, Zod, and lucide-react. |
| `npm run e2e:local` | Failed | The local workflow test still expects the old uploaded QR image alt text. Current app now generates the QR from UPI amount/details. |
| Git repository status | Not available | This folder is not currently a Git repository, so branch status and uncommitted changes could not be reviewed. |

## Findings

### Critical - Real-looking secrets are present in `.env.example`

Evidence:

- `.env.example:10-12` contains local admin credential settings, including a real-looking password hash.
- `.env.example:14-15` contains a real-looking local admin session secret.
- `.env.example:22-23` contains a real-looking portal signing secret.
- `.gitignore:6-12` ignores `.env.local` and `.env.*.local`, but `.env.example` is intentionally trackable.

Impact:

If this project is pushed to GitHub or deployed from a repository, these values may become exposed. Even if they are intended only for local development, copied secrets become risky because future environments often reuse example values by mistake.

Recommended fix:

Replace all secret-like values in `.env.example` with placeholders such as `replace-with-new-secret`, rotate any secrets that may already have been shared, and keep real values only in `.env.local`, Vercel environment variables, or Supabase secrets.

### High - Production payment settings still depend on an uploaded QR image

Evidence:

- `src/features/payment/utilities/payment-display.utils.ts:15-17` still treats payment as configured only when `settings.qrCodeUrl` exists.
- `supabase/functions/get-public-payment-settings/index.ts:7-18` requires `settings.qr_code_path`.
- `supabase/functions/get-public-payment-settings/index.ts:67-87` attempts to create a signed URL for a stored QR code and disables payments if the signed URL cannot be created.
- `src/features/payment/components/QrCodeDisplay.tsx:17-24` now generates an amount-aware QR code from the UPI deep link and configured fee.

Impact:

The frontend has moved toward a generated QR code that includes the admin-entered amount, but the production Edge Function can still disable payments unless a stored QR image exists. This creates a deployment mismatch: the local page may look correct, while production can still require an uploaded QR image.

Recommended fix:

Decide the final payment model:

- If the generated QR is now the source of truth, remove the hard requirement for `qr_code_path` from public payment settings and configuration checks.
- If uploaded QR must remain mandatory, ensure the uploaded QR itself contains the correct amount and update UI copy/tests accordingly.

For the user's stated requirement, the generated QR from amount + UPI details should be treated as the source of truth.

### High - Local E2E workflow is failing because it expects old QR behavior

Evidence:

- `e2e/local-workflow.spec.ts:135-139` checks for the old static QR alt text.
- `npm run e2e:local` failed at `e2e/local-workflow.spec.ts:139`.
- Failure trace was written to `.playwright-output/local-workflow-complete-lo-e0373-n-review-and-audit-workflow-chromium/trace.zip`.

Impact:

The main local registration/payment/admin review workflow cannot currently be used as a regression gate. Because the recent QR fix changed expected behavior, the test needs to verify the new amount-aware generated QR code instead of the old uploaded QR image.

Recommended fix:

Update the E2E assertion to look for the generated payment QR image and verify that the displayed fee/payment amount matches the admin-configured fee.

### High - Supabase Edge Function CORS must be configured before Vercel deployment

Evidence:

- `supabase/functions/_shared/cors.ts:3-12` defaults allowed origins to localhost-style development origins.
- `supabase/functions/_shared/cors.ts:14-23` supports an `ALLOWED_ORIGINS` environment variable.
- `supabase/functions/_shared/cors.ts:30-31` rejects requests from origins outside the allowed set.

Impact:

If the Vercel production domain is not added to `ALLOWED_ORIGINS`, browser requests from the deployed app to Supabase Edge Functions may fail even if the app builds successfully.

Recommended fix:

Set the Supabase Edge Function secret:

```bash
supabase secrets set ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app,https://your-custom-domain.com
```

Include only the domains that should be allowed.

### Medium - Missing explicit Vercel SPA fallback configuration

Evidence:

- `src/config/routes.config.ts:1-12` defines client-side routes such as `/admin/login`, `/payment/:registrationId`, and `/registration/:registrationId/status`.
- No `vercel.json` file was found in the project root.

Impact:

Vite single-page apps need a rewrite so direct navigation or refresh on nested routes serves `index.html`. Without this, routes can work during client-side navigation but return 404 on direct load in production.

Recommended fix:

Add a root `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Medium - Registration page still shows stale development-only copy

Evidence:

- `src/pages/public/RegistrationPage.tsx:49-53` displays a development notice saying secure server submission will be connected later.
- `src/features/registration/components/RegistrationForm.tsx:87-103` actually submits registration data through `createRegistration`, stores a payment token, and navigates to the payment route.

Impact:

Users may think registration is not functional or not production-ready even though the submission flow exists.

Recommended fix:

Replace the development notice with production-safe copy, or hide it outside local development mode.

### Medium - Privacy and terms content is still placeholder text

Evidence:

- `src/features/language/language.copy.ts:38-39` contains Hindi footer copy indicating privacy policy and terms are upcoming.
- `src/features/language/language.copy.ts:230-231` contains equivalent English placeholder copy.

Impact:

Before collecting personal details, photo uploads, documents, or payment screenshots in production, the portal should provide real privacy and terms information.

Recommended fix:

Add final privacy policy and terms pages or remove the links until the content is ready.

### Medium - JavaScript bundle is large

Evidence:

- `npm run build` produced `dist/assets/index-BpCm_1es.js` at about 891 kB before gzip.
- Vite reported: "Some chunks are larger than 500 kB after minification."

Impact:

The app will work, but first load can be slower on low-end devices or mobile networks.

Recommended fix:

Use route-level lazy loading for admin pages, public registration/payment pages, and heavier dependencies such as PDF/QR/admin-only modules where possible.

### Low - The project directory is not currently a Git repository

Evidence:

- `git status --short` returned: `fatal: not a git repository`.

Impact:

Audit cannot confirm what changes are committed, staged, ignored, or ready to deploy. Vercel deployment from GitHub/GitLab/Bitbucket will require the project to be in a Git repository.

Recommended fix:

Initialize or restore Git metadata before deployment, then commit the cleaned configuration and tested source state.

### Low - Several dependencies have major newer versions available

Evidence:

`npm outdated --json` reported newer major versions for packages including:

- `react` and `react-dom`: current `18.3.1`, latest `19.2.7`
- `react-router-dom`: current `6.30.4`, latest `7.18.1`
- `vite`: current `6.4.3`, latest `8.1.5`
- `tailwindcss`: current `3.4.19`, latest `4.3.3`
- `typescript`: current `5.9.3`, latest `7.0.2`
- `zod`: current `3.25.76`, latest `4.4.3`
- `lucide-react`: current `0.468.0`, latest `1.25.0`

Impact:

There are no current production audit vulnerabilities, so this is not urgent. However, major upgrades should be planned and tested deliberately.

Recommended fix:

Handle major upgrades in separate branches/tasks. Do not upgrade all major frameworks immediately before deployment unless there is a specific need.

### Low - Development server binds to all interfaces

Evidence:

- `vite.config.ts:34-36` sets dev server host to `0.0.0.0`.

Impact:

This is useful for local network testing. It also means the dev server may be reachable from other devices on the same network.

Recommended fix:

Keep this only if LAN testing is needed. Otherwise bind to localhost. The current local backend has origin checks, which reduces risk.

## Strengths

- TypeScript is configured strictly with `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noUnusedLocals`, and `noUnusedParameters`.
- Unit coverage is broad for the current codebase: 218 tests are passing.
- Production dependency security audit reports 0 known vulnerabilities.
- Local development-only plugins are gated behind development mode and local-dev backend mode in `vite.config.ts:15-24`.
- Supabase migrations include RLS policies and admin helper functions.
- Supabase Edge Functions use server-side clients and include rate-limit helpers.
- Uploaded files are validated for size and image magic bytes in the local backend.
- Payment QR generation now includes the configured amount through the UPI deep link.
- Admin credential/profile management exists in the admin area.

## Deployment Readiness Checklist

Before deploying to Vercel:

1. Replace secret-like values in `.env.example` with placeholders and rotate any exposed values.
2. Add `vercel.json` with SPA fallback rewrites.
3. Set Vercel environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Do not set local-dev variables in Vercel:
   - Do not use `VITE_ADMIN_AUTH_MODE=local-dev`
   - Do not use `VITE_DATA_BACKEND_MODE=local-dev`
   - Do not use `DEV_ADMIN_*` values
5. Deploy Supabase migrations.
6. Deploy Supabase Edge Functions.
7. Configure Supabase Edge Function secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RATE_LIMIT_SALT`
   - `ALLOWED_ORIGINS`
8. Create the production admin user in Supabase Auth and assign the admin role in JWT app metadata.
9. Decide whether generated QR codes replace uploaded QR images, then update the Supabase public payment function accordingly.
10. Update the E2E test for amount-aware QR code behavior.
11. Add final privacy policy and terms copy.
12. Run the full verification set again:
    - `npm run build`
    - `npm test`
    - `npm audit --omit=dev --audit-level=moderate`
    - `npm run e2e:local`

## Admin Credentials Note

The local development admin credentials should not be treated as production credentials. Production admin login should be managed through Supabase Auth, with the admin role assigned in the user's app metadata. Any values currently visible in local example files should be replaced and rotated before sharing or deployment.

## QR Payment Flow Note

The current frontend direction is correct for the requested behavior: the generated QR should include the amount configured by the admin. The remaining risk is backend/configuration inconsistency, especially in Supabase public payment settings, where stored QR image requirements still exist.

## Recommended Next Fix Order

1. Clean `.env.example` secrets.
2. Add `vercel.json`.
3. Fix Supabase public payment settings so generated amount-aware QR works in production.
4. Update the failing E2E test.
5. Replace stale development/privacy/terms copy.
6. Add route-level code splitting if performance becomes a concern.

