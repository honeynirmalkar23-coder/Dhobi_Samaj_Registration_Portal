# Dhobi Samaj Registration Portal
## Recommended Project Directory Structure

**Document version:** 1.0  

---

## 1. Recommended Root Structure

```text
dhobi-samaj-registration-portal/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deployment-check.yml
├── docs/
│   ├── 01_Technology_Stack_and_Technical_Decisions.md
│   ├── 02_System_Architecture_and_Component_Design.md
│   ├── 03_End_to_End_User_and_Admin_Workflows.md
│   ├── 04_Project_Goals_Scope_and_Delivery_Roadmap.md
│   ├── 05_Recommended_Project_Directory_Structure.md
│   └── 06_Phase_Wise_Implementation_Prompts_and_Expected_Outcomes.md
├── public/
│   ├── favicon.ico
│   ├── manifest.webmanifest
│   ├── images/
│   │   ├── brand/
│   │   │   ├── logo-placeholder.svg
│   │   │   └── social-preview.png
│   │   └── community/
│   │       ├── dhobi-work-black-white.jpeg
│   │       ├── dhobi-work-colour.jpeg
│   │       ├── heritage-portrait.jpeg
│   │       ├── education-quote-one.jpeg
│   │       ├── heritage-painting.jpeg
│   │       ├── heritage-photo-one.jpeg
│   │       ├── heritage-group.jpeg
│   │       ├── heritage-photo-two.jpeg
│   │       └── education-quote-two.jpeg
│   └── fonts/
│       └── README.md
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   ├── providers.tsx
│   │   └── route-guards/
│   │       ├── AdminRoute.tsx
│   │       └── PublicOnlyRoute.tsx
│   ├── assets/
│   │   └── styles/
│   │       ├── globals.css
│   │       └── print.css
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── DashboardMetricCard.tsx
│   │   │   ├── RegistrationDataTable.tsx
│   │   │   ├── RegistrationDetailsPanel.tsx
│   │   │   ├── PaymentProofViewer.tsx
│   │   │   ├── PaymentSettingsForm.tsx
│   │   │   └── StatusActionPanel.tsx
│   │   ├── common/
│   │   │   ├── AppErrorBoundary.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchInput.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── forms/
│   │   │   ├── FormField.tsx
│   │   │   ├── NumberField.tsx
│   │   │   ├── SelectField.tsx
│   │   │   ├── TextAreaField.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   └── DeclarationField.tsx
│   │   ├── layout/
│   │   │   ├── PublicHeader.tsx
│   │   │   ├── PublicFooter.tsx
│   │   │   ├── PublicLayout.tsx
│   │   │   └── AdminLayout.tsx
│   │   └── public/
│   │       ├── HeroSection.tsx
│   │       ├── RegistrationSearchCard.tsx
│   │       ├── PortalProcessSection.tsx
│   │       ├── CommunityAboutSection.tsx
│   │       ├── EducationQuotesSection.tsx
│   │       ├── HeritageGallery.tsx
│   │       ├── PaymentSummaryCard.tsx
│   │       └── PublicStatusResult.tsx
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── navigation.config.ts
│   │   ├── images.config.ts
│   │   ├── statuses.config.ts
│   │   └── validation.config.ts
│   ├── constants/
│   │   ├── education-levels.ts
│   │   ├── file-limits.ts
│   │   ├── registration-statuses.ts
│   │   └── payment-statuses.ts
│   ├── features/
│   │   ├── admin-auth/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── schemas/
│   │   ├── admin-dashboard/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   ├── payment/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── schemas/
│   │   ├── registration/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   └── types/
│   │   ├── status-search/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── schemas/
│   │   └── payment-settings/
│   │       ├── api/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── schemas/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDebounce.ts
│   │   ├── useFilePreview.ts
│   │   └── useToast.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── storage.ts
│   │   │   └── database.types.ts
│   │   ├── pdf/
│   │   │   ├── acknowledgement-template.ts
│   │   │   ├── approved-receipt-template.ts
│   │   │   └── document-utils.ts
│   │   ├── validation/
│   │   │   ├── file-validation.ts
│   │   │   ├── registration-id.ts
│   │   │   └── upi-validation.ts
│   │   └── utilities/
│   │       ├── dates.ts
│   │       ├── download.ts
│   │       ├── formatters.ts
│   │       ├── mask-personal-data.ts
│   │       └── retry.ts
│   ├── pages/
│   │   ├── public/
│   │   │   ├── HomePage.tsx
│   │   │   ├── RegistrationPage.tsx
│   │   │   ├── PaymentPage.tsx
│   │   │   ├── StatusPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   └── admin/
│   │       ├── AdminLoginPage.tsx
│   │       ├── AdminDashboardPage.tsx
│   │       ├── AdminRegistrationDetailsPage.tsx
│   │       ├── AdminPaymentSettingsPage.tsx
│   │       └── AdminAuditLogPage.tsx
│   ├── services/
│   │   ├── admin.service.ts
│   │   ├── audit.service.ts
│   │   ├── document.service.ts
│   │   ├── payment-settings.service.ts
│   │   ├── payment.service.ts
│   │   ├── registration.service.ts
│   │   └── status-search.service.ts
│   ├── types/
│   │   ├── admin.types.ts
│   │   ├── common.types.ts
│   │   ├── payment.types.ts
│   │   ├── registration.types.ts
│   │   └── status.types.ts
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 001_create_admin_profiles.sql
│   │   ├── 002_create_registrations.sql
│   │   ├── 003_create_payment_settings.sql
│   │   ├── 004_create_audit_logs.sql
│   │   ├── 005_create_storage_buckets.sql
│   │   ├── 006_create_registration_id_function.sql
│   │   ├── 007_create_public_status_function.sql
│   │   ├── 008_create_rls_policies.sql
│   │   ├── 009_create_updated_at_triggers.sql
│   │   └── 010_create_indexes.sql
│   ├── functions/
│   │   ├── create-registration/
│   │   │   └── index.ts
│   │   ├── submit-payment-proof/
│   │   │   └── index.ts
│   │   ├── generate-acknowledgement/
│   │   │   ├── index.ts
│   │   │   └── template.html
│   │   ├── generate-approved-receipt/
│   │   │   ├── index.ts
│   │   │   └── template.html
│   │   └── export-registrations/
│   │       └── index.ts
│   └── seed.sql
├── tests/
│   ├── unit/
│   │   ├── registration-validation.test.ts
│   │   ├── registration-id.test.ts
│   │   ├── file-validation.test.ts
│   │   └── status-mapping.test.ts
│   ├── integration/
│   │   ├── registration-flow.test.ts
│   │   ├── payment-flow.test.ts
│   │   └── admin-authorization.test.ts
│   └── e2e/
│       ├── public-registration.spec.ts
│       ├── payment-submission.spec.ts
│       ├── status-search.spec.ts
│       └── admin-review.spec.ts
├── .env.example
├── .gitignore
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── README.md
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts
```

---

## 2. Folder Responsibilities

### `docs/`

Contains planning, architecture, workflow, and implementation documents.

### `public/images/community/`

Contains the user-provided community photographs and quote images.

Recommended professional filenames:

```text
dhobi-work-black-white.jpeg
dhobi-work-colour.jpeg
heritage-portrait.jpeg
education-quote-one.jpeg
heritage-painting.jpeg
heritage-photo-one.jpeg
heritage-group.jpeg
heritage-photo-two.jpeg
education-quote-two.jpeg
```

### `src/app/`

Contains application initialization, routing, providers, and route guards.

### `src/components/`

Contains reusable visual components.

### `src/features/`

Contains feature-specific logic. Each feature may include its own:

- API functions
- Components
- Hooks
- Validation schemas
- Types

### `src/config/`

Contains editable application configuration, including image paths and status labels.

### `src/lib/`

Contains framework and infrastructure helpers, such as Supabase clients, PDF utilities, validation, and common utilities.

### `src/pages/`

Contains route-level page components.

### `src/services/`

Provides a clean layer between UI components and backend calls.

### `supabase/migrations/`

Contains versioned SQL database changes.

### `supabase/functions/`

Contains backend operations requiring protected execution.

### `tests/`

Contains unit, integration, and end-to-end tests.

---

## 3. Suggested Configuration File

Example `src/config/app.config.ts`:

```ts
export const appConfig = {
  name: "धोबी समाज पंजीकरण पोर्टल",
  englishName: "Dhobi Samaj Registration Portal",
  shortName: "Dhobi Samaj Portal",
  description:
    "समाज के सदस्यों के लिए सरल, सुरक्षित और डिजिटल पंजीकरण सुविधा",
  registrationIdPrefix: "DS",
  publicContact: "",
};
```

---

## 4. Suggested Image Configuration

Example `src/config/images.config.ts`:

```ts
export const communityImages = {
  hero: "/images/community/dhobi-work-black-white.jpeg",
  about: "/images/community/dhobi-work-colour.jpeg",
  inspirationPortrait: "/images/community/heritage-portrait.jpeg",
  educationQuoteOne: "/images/community/education-quote-one.jpeg",
  heritagePainting: "/images/community/heritage-painting.jpeg",
  heritagePhotoOne: "/images/community/heritage-photo-one.jpeg",
  heritageGroup: "/images/community/heritage-group.jpeg",
  heritagePhotoTwo: "/images/community/heritage-photo-two.jpeg",
  educationQuoteTwo: "/images/community/education-quote-two.jpeg",
} as const;
```

---

## 5. Suggested Status Configuration

Example `src/config/statuses.config.ts`:

```ts
export const registrationStatusLabels = {
  awaiting_payment: "भुगतान की प्रतीक्षा",
  submitted: "जमा किया गया",
  under_review: "समीक्षा में",
  approved: "स्वीकृत",
  rejected: "अस्वीकृत",
  archived: "संग्रहित",
} as const;

export const paymentStatusLabels = {
  not_submitted: "भुगतान प्रमाण जमा नहीं",
  pending_verification: "सत्यापन लंबित",
  verified: "भुगतान सत्यापित",
  rejected: "भुगतान प्रमाण अस्वीकृत",
} as const;
```

---

## 6. Environment File

Example `.env.example`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_ENV=development
VITE_APP_NAME=Dhobi Samaj Registration Portal
```

Never commit the real `.env` file.

---

## 7. Naming Conventions

### Files

- React components: `PascalCase.tsx`
- Hooks: `useSomething.ts`
- Services: `something.service.ts`
- Types: `something.types.ts`
- Schemas: `something.schema.ts`
- SQL migrations: ordered numeric prefix
- Images: lowercase kebab-case

### Variables and functions

- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Components: `PascalCase`
- Database columns: `snake_case`

### Routes

Use lowercase kebab-case:

```text
/admin/payment-settings
```

---

## 8. Recommended Git Branches

```text
main
develop
feature/home-page
feature/registration-form
feature/payment-flow
feature/status-search
feature/admin-dashboard
feature/payment-settings
feature/pdf-generation
fix/<issue-name>
```

---

## 9. Minimum Structure for a Simpler First Build

When using Lovable for the first iteration, the project may begin with:

```text
src/
├── components/
├── pages/
├── services/
├── lib/
├── config/
├── types/
├── App.tsx
└── main.tsx
```

The larger feature-based structure should be introduced before the codebase becomes difficult to manage.

---

## 10. Structural Rules

- Do not place all application logic in `App.tsx`
- Do not directly call Supabase from every UI component
- Do not store status strings in multiple files
- Do not hardcode image paths throughout the application
- Do not store secrets in the frontend
- Do not put database migrations in informal notes
- Keep public and admin page components separate
- Keep PDF generation separate from registration form code
- Add tests for registration ID generation and security-sensitive operations
