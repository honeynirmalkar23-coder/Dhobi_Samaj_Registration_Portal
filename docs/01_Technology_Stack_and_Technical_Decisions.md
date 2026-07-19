# Dhobi Samaj Registration Portal
## Technology Stack and Technical Decisions

**Document version:** 1.0  
**Project type:** Community registration, payment-proof submission, acknowledgement generation, and administrative management portal  
**Primary interface language:** Hindi  
**Secondary interface language:** English, where clarification is useful  

---

## 1. Purpose

This document defines the recommended technology stack for the Dhobi Samaj Registration Portal. The selected technologies are intended to provide:

- A modern and responsive user interface
- Secure storage of personal and payment-related information
- Administrator authentication and authorization
- Easy deployment and maintenance
- Low initial operating cost
- A scalable foundation for future features
- Correct rendering of Hindi and Devanagari text
- Reliable generation of acknowledgement and receipt PDFs

---

## 2. Recommended Technology Stack

### 2.1 Frontend

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| TypeScript | Type safety and fewer runtime errors |
| Vite | Fast development and optimized production builds |
| Tailwind CSS | Responsive and consistent styling |
| React Router | Page navigation and protected routes |
| React Hook Form | Efficient form state and validation |
| Zod | Schema-based validation |
| Lucide React | Consistent icons |
| TanStack Table | Admin registration table, sorting, filtering, and pagination |
| TanStack Query | Data fetching, caching, loading states, and retries |

### 2.2 Backend and Database

| Technology | Purpose |
|---|---|
| Supabase | Managed backend platform |
| PostgreSQL | Relational database |
| Supabase Auth | Administrator login and session management |
| Supabase Storage | Applicant photographs, payment screenshots, and QR images |
| Row Level Security | Database-level access control |
| PostgreSQL functions and triggers | Registration ID generation, timestamps, and controlled public operations |
| Supabase Edge Functions | Secure PDF generation and sensitive backend operations when required |

### 2.3 PDF Generation

Recommended approaches, in priority order:

1. **Server-side HTML-to-PDF generation**
   - Best for accurate Hindi rendering
   - Use a Devanagari-compatible font
   - Generate the document through a protected backend function

2. **Client-side PDF generation with embedded Hindi font**
   - Acceptable only after confirming Devanagari text renders correctly
   - Must not expose restricted storage URLs

Recommended fonts:

- Noto Sans Devanagari
- Noto Serif Devanagari
- Mukta
- Hind

The final implementation must be tested using Hindi phrases such as:

- पंजीकरण
- भुगतान सत्यापन लंबित
- स्थायी पता
- परिवार की जनसंख्या
- शिक्षा
- बुजुर्ग

### 2.4 Hosting and Deployment

| Service | Recommended Use |
|---|---|
| Lovable | AI-assisted frontend creation and rapid iteration |
| Vercel | Preferred production deployment for the frontend |
| Netlify | Alternative frontend deployment |
| Supabase Cloud | Database, authentication, storage, and backend functions |

Recommended production configuration:

- Frontend deployed on Vercel
- Backend and database hosted on Supabase
- Custom domain connected after testing
- HTTPS enabled
- Environment variables configured in the hosting dashboard
- Separate development and production Supabase projects when possible

---

## 3. Why This Stack Is Recommended

### 3.1 Fast Development

React, TypeScript, Tailwind CSS, Lovable, and Supabase significantly reduce the amount of custom infrastructure required. The project can focus on business requirements instead of building authentication, file storage, and database hosting from scratch.

### 3.2 Low Initial Cost

The application can begin on free or low-cost plans. Costs may increase only when:

- Storage usage becomes large
- Monthly active users increase
- Database usage increases
- Edge Function execution becomes frequent
- A custom domain is purchased
- Email or WhatsApp integrations are added

### 3.3 Security

The stack supports:

- Secure administrator authentication
- Private file storage
- Signed URLs
- Row Level Security
- Audit logging
- Server-side validation
- Environment-variable-based secrets
- Controlled public search results

### 3.4 Maintainability

A modular React architecture and a relational PostgreSQL database allow the application to be extended with:

- Member profile updates
- Renewal payments
- Family member records
- Certificate generation
- Event registration
- Donations
- SMS or email notifications
- Multiple administrators
- District or village-level filtering
- Reporting and analytics

---

## 4. Frontend Technical Decisions

### 4.1 Responsive Design

The portal must support:

- 320 px mobile screens
- 375 px and 430 px smartphones
- Tablets
- Standard laptops
- Large desktop screens

The registration and payment processes must remain easy to use on mobile devices because many users may access the portal through a phone.

### 4.2 Hindi-First Interface

All major interface labels should be in Hindi. English may be shown below selected labels when it improves clarity.

Examples:

- नया पंजीकरण
- पंजीकरण आईडी खोजें
- भुगतान प्रमाण जमा करें
- प्रशासन लॉगिन
- सत्यापन लंबित

The application must use UTF-8 throughout.

### 4.3 Form Validation

Validation must occur at two levels:

1. Frontend validation for immediate user feedback
2. Backend/database validation for security and data integrity

Client-side validation alone is not sufficient.

### 4.4 Image Handling

Supported formats:

- JPG
- JPEG
- PNG
- WebP

Recommended limits:

- Applicant photograph: maximum 5 MB
- Payment screenshot: maximum 5 MB
- Payment QR image: maximum 3 MB

The portal should:

- Show image previews
- Reject invalid formats
- Prevent executable or unsupported uploads
- Compress large images when appropriate
- Preserve sufficient quality for administrative review
- Store files in private storage buckets

---

## 5. Backend Technical Decisions

### 5.1 Registration ID Generation

Recommended format:

```text
DS-YYYY-000001
```

Example:

```text
DS-2026-000001
```

The registration ID must be generated by the database or a secure server-side function. It must not rely on browser-only code or `Math.random()`.

The generation process must prevent duplicate IDs during simultaneous registrations.

### 5.2 Database Access

Anonymous users may:

- Submit a new registration through a controlled operation
- Submit a payment screenshot for their own registration flow
- Search a registration ID and receive a limited status response

Anonymous users must not:

- List all registrations
- View full addresses
- View photographs
- View payment screenshots
- Access administrator notes
- Change approval or payment status

Administrators may:

- View complete records
- Review photographs and payment proofs
- Update payment and registration statuses
- Manage payment settings
- Export data
- Add notes
- Access audit history

### 5.3 Storage Buckets

Recommended buckets:

```text
applicant-photos
payment-proofs
payment-qr-codes
```

All personal and payment-related storage should remain private.

### 5.4 Audit Logging

Administrative actions should be recorded, including:

- Payment verified
- Payment rejected
- Registration approved
- Registration rejected
- Resubmission enabled
- Record archived
- Payment settings changed

Audit records should include:

- Administrator ID
- Action
- Registration reference
- Previous value
- New value
- Timestamp

---

## 6. Payment Technical Decision

The first version uses:

- QR code display
- UPI ID display
- Manual payment by the user
- Payment screenshot upload
- Administrator verification

A screenshot does not prove that payment has been received. Therefore:

- The first downloaded document must be called an acknowledgement
- It must display `भुगतान सत्यापन लंबित`
- It must not state `Payment Successful`
- A final approved receipt should be available only after administrator verification

A future version may integrate a payment gateway such as Razorpay. That would provide transaction verification, webhooks, and automatic payment confirmation.

---

## 7. Security Requirements

The following requirements are mandatory:

- No administrator password in frontend source code
- No service-role key in browser code
- Row Level Security enabled
- Private storage for applicant photos and payment proofs
- Signed URLs for temporary file viewing
- File type and size restrictions
- Server-side registration ID generation
- Server-side status transitions
- Limited public search output
- Admin route protection
- Session expiration handling
- Input validation and sanitization
- Duplicate-submit prevention
- Audit logging
- HTTPS in production
- Regular database backups

---

## 8. Environment Variables

Typical frontend variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_NAME=Dhobi Samaj Registration Portal
VITE_APP_ENV=production
```

Sensitive variables, including a Supabase service-role key, must be stored only in protected server-side environments or Edge Function secrets.

---

## 9. Recommended Development Tools

- Visual Studio Code
- Git
- GitHub
- Node.js LTS
- npm or pnpm
- Supabase CLI
- Chrome Developer Tools
- Postman or Bruno for API testing
- Playwright for end-to-end tests
- Vitest for frontend unit tests

---

## 10. Final Stack Summary

```text
Frontend:
React + TypeScript + Vite + Tailwind CSS

Forms and Validation:
React Hook Form + Zod

Routing:
React Router

Backend:
Supabase

Database:
PostgreSQL

Authentication:
Supabase Auth

Storage:
Supabase Storage

Authorization:
Row Level Security

PDF:
Server-side Hindi-compatible HTML-to-PDF generation

Hosting:
Vercel + Supabase

Development Support:
Lovable + GitHub
```

This stack provides a strong balance of simplicity, security, scalability, and affordable operation for the initial release.
