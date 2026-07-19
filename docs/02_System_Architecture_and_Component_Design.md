# Dhobi Samaj Registration Portal
## System Architecture and Component Design

**Document version:** 1.0  
**Architecture style:** Modular web application with managed backend services  

---

## 1. Architecture Overview

The portal is divided into five major layers:

1. Public user interface
2. Administrator interface
3. Application service layer
4. Database and storage layer
5. Document generation and audit layer

```text
┌─────────────────────────────────────────────────────────────┐
│                         End Users                           │
│  Home │ Registration │ Payment │ Status Search │ PDF       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Web Application                    │
│  UI Components │ Forms │ Validation │ Routing │ State      │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Service Layer                    │
│ Auth │ Database Functions │ Edge Functions │ Storage API    │
└───────────────┬─────────────────────┬───────────────────────┘
                │                     │
                ▼                     ▼
┌───────────────────────────┐   ┌─────────────────────────────┐
│ PostgreSQL Database       │   │ Private Object Storage      │
│ Registrations             │   │ Applicant Photos            │
│ Payment Settings          │   │ Payment Proofs              │
│ Admin Profiles            │   │ QR Code Images              │
│ Audit Logs                │   │ Generated Documents         │
└───────────────────────────┘   └─────────────────────────────┘
```

---

## 2. Main System Actors

### 2.1 Public User

A public user can:

- Visit the home page
- View community information and images
- Start a new registration
- Enter personal, educational, address, and family details
- Upload a photograph
- Receive a unique registration ID
- View payment instructions
- Upload a payment screenshot
- Download an acknowledgement
- Search the registration status

### 2.2 Administrator

An administrator can:

- Log in securely
- View registrations
- Search, sort, filter, and export records
- Review applicant photographs
- Review payment screenshots
- Verify or reject payment proof
- Approve or reject registration
- Enable payment resubmission
- Add internal notes
- Configure QR code, UPI ID, fee, and instructions
- Download acknowledgement and final receipts
- Review audit history
- Log out

---

## 3. Application Modules

### 3.1 Public Website Module

Contains:

- Home page
- Hero section
- New registration call to action
- Registration ID search
- Portal workflow explanation
- Community information
- Education message section
- Heritage image gallery
- Footer and contact information

### 3.2 Registration Module

Responsibilities:

- Display the registration form
- Validate user inputs
- Upload applicant photograph
- Create registration record
- Generate unique registration ID
- Store initial statuses
- Redirect to the payment page

### 3.3 Payment Module

Responsibilities:

- Load active payment settings
- Show QR code
- Show UPI ID
- Show payment amount and instructions
- Generate UPI deep link
- Upload payment screenshot
- Change status to pending verification
- Trigger acknowledgement PDF generation
- Redirect to home page

### 3.4 Status Search Module

Responsibilities:

- Validate registration ID
- Query only privacy-safe fields
- Mask the applicant name
- Display registration status
- Display payment status
- Show rejection or resubmission instructions
- Prevent public exposure of personal records

### 3.5 Administrator Authentication Module

Responsibilities:

- Administrator login
- Session handling
- Role verification
- Route protection
- Unauthorized access handling
- Logout

### 3.6 Administrator Registration Management Module

Responsibilities:

- Registration listing
- Search
- Filters
- Sorting
- Pagination
- Detailed record view
- Status updates
- Payment verification
- Rejection reasons
- Internal notes
- CSV export
- Document download

### 3.7 Payment Settings Module

Responsibilities:

- Enable or disable payment
- Upload QR code
- Configure UPI ID
- Configure payee name
- Configure registration fee
- Configure payment title
- Configure payment instructions
- Configure public contact
- Preview the payment page

### 3.8 PDF Document Module

Produces:

1. Pending-verification acknowledgement
2. Final approved receipt

The document module must support Hindi and include the applicant information, registration reference, status, and relevant images.

### 3.9 Audit Module

Records administrative actions for accountability.

---

## 4. Recommended Database Schema

### 4.1 `registrations`

```text
id UUID PRIMARY KEY
registration_id TEXT UNIQUE NOT NULL
full_name TEXT NOT NULL
age INTEGER NOT NULL
education_level TEXT NOT NULL
education_details TEXT
permanent_address TEXT NOT NULL
boys_count INTEGER NOT NULL DEFAULT 0
girls_count INTEGER NOT NULL DEFAULT 0
elders_count INTEGER NOT NULL DEFAULT 0
total_family_members INTEGER NOT NULL
applicant_photo_path TEXT NOT NULL
payment_screenshot_path TEXT
registration_status TEXT NOT NULL
payment_status TEXT NOT NULL
rejection_reason TEXT
allow_payment_resubmission BOOLEAN NOT NULL DEFAULT FALSE
admin_notes TEXT
submitted_at TIMESTAMPTZ
approved_at TIMESTAMPTZ
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### 4.2 `payment_settings`

```text
id UUID PRIMARY KEY
payment_enabled BOOLEAN NOT NULL DEFAULT FALSE
qr_code_path TEXT
upi_id TEXT
payee_name TEXT
amount NUMERIC(10,2)
payment_title TEXT
instructions TEXT
public_contact TEXT
payment_deadline TIMESTAMPTZ
updated_by UUID
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### 4.3 `admin_profiles`

```text
user_id UUID PRIMARY KEY
full_name TEXT NOT NULL
role TEXT NOT NULL
active BOOLEAN NOT NULL DEFAULT TRUE
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### 4.4 `admin_audit_logs`

```text
id UUID PRIMARY KEY
admin_user_id UUID NOT NULL
registration_record_id UUID
action TEXT NOT NULL
previous_value JSONB
new_value JSONB
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### 4.5 Optional `generated_documents`

```text
id UUID PRIMARY KEY
registration_record_id UUID NOT NULL
document_type TEXT NOT NULL
document_path TEXT
receipt_number TEXT
generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
generated_by UUID
```

---

## 5. Registration Status Model

### Registration status values

```text
awaiting_payment
submitted
under_review
approved
rejected
archived
```

### Payment status values

```text
not_submitted
pending_verification
verified
rejected
```

### Valid state progression

```text
Registration created
        ↓
awaiting_payment
        ↓
Payment proof submitted
        ↓
submitted
        ↓
under_review
        ↓
approved
```

Payment progression:

```text
not_submitted
        ↓
pending_verification
        ↓
verified
```

Rejected payment progression:

```text
pending_verification
        ↓
rejected
        ↓
resubmission enabled
        ↓
pending_verification
```

Status changes should be controlled through backend operations rather than unrestricted frontend updates.

---

## 6. Storage Architecture

```text
applicant-photos/
  YYYY/
    registration-id/
      profile-original.ext
      profile-optimized.webp

payment-proofs/
  YYYY/
    registration-id/
      proof-timestamp.ext

payment-qr-codes/
  active/
    payment-qr.ext
  archive/
    timestamp-payment-qr.ext

generated-documents/
  YYYY/
    registration-id/
      acknowledgement.pdf
      approved-receipt.pdf
```

Recommended practice:

- Use private buckets
- Generate signed URLs when administrators view files
- Do not expose internal storage paths in public responses
- Retain previous QR code versions when settings change
- Restrict upload types and maximum sizes

---

## 7. Page and Route Architecture

### Public routes

```text
/
├── Home
├── Registration ID search
└── Community image sections

/registration
└── New registration form

/payment/:registrationId
└── Payment instructions and proof upload

/status
└── Registration status search
```

### Administrator routes

```text
/admin/login
/admin/dashboard
/admin/registrations/:id
/admin/payment-settings
/admin/audit-logs
```

All `/admin/*` routes except `/admin/login` must require a valid administrator session and role.

---

## 8. API and Service Operations

### Public operations

```text
create_registration
get_public_registration_status
get_active_payment_settings
submit_payment_proof
generate_acknowledgement
```

### Administrator operations

```text
get_registration_list
get_registration_details
update_registration_status
verify_payment
reject_payment
approve_registration
reject_registration
enable_payment_resubmission
update_payment_settings
generate_final_receipt
export_registrations
get_audit_logs
```

---

## 9. Component Architecture

```text
App
├── PublicLayout
│   ├── Header
│   ├── MainContent
│   └── Footer
├── AdminLayout
│   ├── AdminSidebar
│   ├── AdminHeader
│   └── AdminContent
├── Pages
│   ├── HomePage
│   ├── RegistrationPage
│   ├── PaymentPage
│   ├── StatusPage
│   ├── AdminLoginPage
│   ├── AdminDashboardPage
│   ├── AdminRegistrationDetailsPage
│   ├── AdminPaymentSettingsPage
│   └── NotFoundPage
├── SharedComponents
│   ├── FormField
│   ├── FileUploader
│   ├── ImagePreview
│   ├── StatusBadge
│   ├── SearchInput
│   ├── ConfirmationDialog
│   ├── LoadingState
│   ├── EmptyState
│   ├── ErrorState
│   └── Pagination
└── Services
    ├── registrationService
    ├── paymentService
    ├── adminService
    ├── storageService
    └── pdfService
```

---

## 10. Security Architecture

### 10.1 Public Data Protection

The public search result should contain only:

- Registration ID
- Masked name
- Created date
- Registration status
- Payment status
- Last updated date

It must not contain:

- Full address
- Applicant photo URL
- Payment screenshot URL
- Administrator notes
- Internal UUID
- Complete database record

### 10.2 Administrator Authorization

Administrator authorization requires:

1. Authenticated Supabase user
2. Active record in `admin_profiles`
3. Authorized role
4. Protected database policy

Hiding admin buttons in the browser is not sufficient authorization.

### 10.3 File Access

Files should be accessed through time-limited signed URLs. Permanent public URLs should not be used for applicant photographs or payment proofs.

---

## 11. Reliability and Error Handling

The application should provide clear handling for:

- Invalid registration ID
- Duplicate submission
- Upload failure
- Database failure
- Missing QR code
- Disabled payment
- Expired administrator session
- PDF generation failure
- Unauthorized access
- Invalid file format
- Oversized file
- Slow network

A failure in PDF generation must not remove or invalidate a successfully submitted payment screenshot.

---

## 12. Future Architecture Extensions

The architecture should allow future support for:

- Verified mobile number
- OTP-based status lookup
- Email acknowledgement
- WhatsApp notifications
- Online payment gateway
- Renewal registration
- Member identity card
- District and village hierarchy
- Event and donation modules
- Multilingual interface
- Multiple admin roles
- Automated backups
- Advanced reports

---

## 13. Architecture Summary

The architecture separates public access, administrative access, database operations, file storage, and document generation. Sensitive information is protected at the database and storage levels, while the frontend provides a simple Hindi-first experience for community members.
