# Dhobi Samaj Registration Portal
## Project Goals, Scope, and Delivery Roadmap

**Document version:** 1.0  

---

## 1. Project Vision

To create a simple, secure, Hindi-first digital registration portal for Dhobi Samaj members that reduces manual paperwork, provides traceable registration records, supports UPI-based payment proof submission, and gives administrators a structured system for review and approval.

---

## 2. Primary Goals

### Goal 1: Easy Member Registration

Enable community members to register using a simple mobile-friendly form.

### Goal 2: Unique Registration Identification

Assign every successful registration a unique and searchable registration ID.

### Goal 3: Transparent Payment Submission

Allow users to view the administrator-configured QR code and UPI details and upload payment proof.

### Goal 4: Automatic Acknowledgement

Generate a downloadable acknowledgement containing the submitted details and registration ID.

### Goal 5: Administrative Control

Provide a protected dashboard where administrators can review records, verify payment, approve or reject registrations, and manage payment settings.

### Goal 6: Privacy and Security

Protect addresses, photos, screenshots, and internal notes from public access.

### Goal 7: Future Readiness

Create a modular foundation that can later support payment gateways, notifications, identity cards, renewals, and reporting.

---

## 3. Project Scope

### 3.1 Included in Initial Release

#### Public portal

- Home page
- New registration button
- Registration ID search
- Community information section
- Heritage image gallery
- Education-message image section
- Responsive Hindi-first interface

#### Registration

- Name
- Age
- Education level
- Education details
- Permanent address
- Boys count
- Girls count
- Elders count
- Applicant photograph
- Declaration
- Unique registration ID

#### Payment

- QR code
- UPI ID
- Payee name
- Registration fee
- Instructions
- Payment screenshot upload
- Submission status
- Pending-verification acknowledgement

#### Public status search

- Registration ID lookup
- Masked name
- Registration status
- Payment status
- Last updated date

#### Administration

- Secure login
- Dashboard
- Registration table
- Full record review
- Payment verification
- Registration approval or rejection
- Payment resubmission control
- Internal notes
- CSV export
- Payment settings
- QR code management
- Audit logging
- Acknowledgement and receipt downloads

#### Security

- Supabase Auth
- Row Level Security
- Private storage
- Signed URLs
- Input validation
- File validation
- Protected admin routes
- Environment variables

---

## 4. Out of Scope for Initial Release

The following features are not required for version 1 unless separately approved:

- Automatic payment gateway verification
- OTP login for public users
- WhatsApp Business API integration
- SMS notifications
- Email delivery
- Android or iOS native application
- Multiple organization branches
- Membership renewal
- Donation management
- Identity card printing
- Biometric verification
- Government identity integration
- Automated OCR of payment screenshots
- Public member directory
- Multilingual content-management system

These can be considered later.

---

## 5. Important Business Rules

1. Every registration must receive one unique registration ID.
2. Applicant photographs are required.
3. Family counts cannot be negative.
4. Payment proof submission does not equal payment verification.
5. The first PDF is an acknowledgement, not a final payment receipt.
6. Only administrators can verify payment.
7. Only administrators can approve registration.
8. Public status search must reveal only limited data.
9. Payment settings must be editable only by administrators.
10. Administrative status changes must be logged.
11. A user may replace a rejected payment screenshot only when an administrator enables resubmission.
12. Final approved receipt is available only after payment verification and registration approval.

---

## 6. Suggested Delivery Phases

### Phase 0: Planning and Documentation

Deliverables:

- Technology stack
- Architecture
- Workflows
- Goals and scope
- File structure
- Phase-wise prompts
- Image usage plan

Expected result:

A clear implementation blueprint exists before coding begins.

### Phase 1: Project Foundation

Deliverables:

- React project
- TypeScript
- Tailwind CSS
- Routing
- Shared layout
- Hindi typography
- Reusable components
- Initial route placeholders

Expected result:

The application runs with the full route structure and design foundation.

### Phase 2: Home Page

Deliverables:

- Hero section
- Registration call to action
- Registration ID search interface
- Process section
- Community content
- Uploaded image gallery
- Education quote image cards
- Responsive design

Expected result:

The public landing page is visually complete.

### Phase 3: Registration Form

Deliverables:

- Complete form
- Validation
- Photo upload and preview
- Family total calculation
- Declaration
- Navigation to payment

Expected result:

A user can enter all required registration information.

### Phase 4: Payment Submission

Deliverables:

- QR code display
- UPI information
- Payment instructions
- Screenshot upload
- Submission confirmation
- Acknowledgement trigger

Expected result:

A registered user can submit payment proof.

### Phase 5: Status Search

Deliverables:

- Registration ID search
- Limited result card
- Status badges
- Error and not-found states
- Resubmission interface when permitted

Expected result:

Users can track their registration without viewing sensitive information.

### Phase 6: Administrator Authentication and Dashboard

Deliverables:

- Admin login
- Protected routes
- Dashboard cards
- Registration table
- Full details
- Filters, search, pagination, and export

Expected result:

Administrators can securely access and manage registration data.

### Phase 7: Payment Settings

Deliverables:

- QR upload
- UPI ID
- Payee name
- Fee
- Instructions
- Enable or disable payment
- Payment page preview

Expected result:

The administrator controls all payment-page content.

### Phase 8: Supabase Backend and Security

Deliverables:

- Database tables
- Storage buckets
- Authentication
- Row Level Security
- Functions
- Triggers
- Audit logs
- Environment configuration

Expected result:

The portal uses a secure production backend.

### Phase 9: PDF Documents

Deliverables:

- Pending-verification acknowledgement
- Final approved receipt
- Correct Hindi text
- Applicant photo
- Payment proof
- Document status and disclaimer

Expected result:

Users and administrators can download valid A4 documents.

### Phase 10: Testing and Deployment

Deliverables:

- Responsive testing
- Browser testing
- Security review
- End-to-end testing
- Performance improvements
- Production deployment
- Setup documentation

Expected result:

A stable production-ready portal is deployed online.

---

## 7. Milestone Plan

| Milestone | Completion Criteria |
|---|---|
| M1: Foundation Ready | Project runs and all routes exist |
| M2: Public UI Ready | Home page and images are complete |
| M3: Registration Ready | Form validation and photo handling work |
| M4: Payment Submission Ready | QR and screenshot flow works |
| M5: Status Search Ready | Public lookup is privacy-safe |
| M6: Admin Dashboard Ready | Admin can review and update records |
| M7: Backend Secured | RLS, storage, and auth are configured |
| M8: PDFs Ready | Hindi acknowledgement and receipt render correctly |
| M9: Production Release | Full workflow passes testing and is deployed |

---

## 8. Definition of Done

The project is complete only when all of the following are true:

### Public functionality

- Home page is responsive
- All supplied images are used appropriately
- Registration form validates correctly
- Photo upload works
- Registration ID is unique
- Payment page loads administrator settings
- Payment screenshot upload works
- Acknowledgement downloads
- User returns to the home page
- Public search returns only safe information

### Administrator functionality

- Administrator can log in
- Protected pages reject unauthorized users
- Registration table works
- Full details are visible to administrators
- Payment can be verified or rejected
- Registration can be approved or rejected
- Resubmission can be enabled
- Payment settings can be changed
- Audit logs are created
- CSV export works
- Final approved receipt can be generated

### Security and reliability

- No hardcoded credentials
- No exposed secret keys
- Row Level Security enabled
- Private files cannot be publicly enumerated
- Invalid files are rejected
- Duplicate submission is prevented
- Hindi renders correctly in the interface and PDF
- Error states are handled
- Production environment variables are documented
- Database backups are planned

---

## 9. Suggested Quality Targets

- Mobile usability: no horizontal scrolling
- Accessibility: keyboard-accessible forms and sufficient contrast
- Form validation: clear Hindi messages
- Page performance: optimized and lazy-loaded images
- Public privacy: no sensitive information in search responses
- Reliability: no duplicate registrations from repeated clicks
- PDF quality: A4 printable and correct Devanagari rendering
- Administrator usability: search and filters return results quickly
- Auditability: every important status change is recorded

---

## 10. Risks and Mitigation

| Risk | Mitigation |
|---|---|
| Screenshot is fraudulent | Manual admin verification; future payment gateway |
| Hindi breaks in PDF | Use embedded Devanagari font and test before release |
| Personal data becomes public | Private storage, RLS, signed URLs |
| Duplicate registration IDs | Server-side sequence and transaction |
| User loses connection | Preserve form state and prevent duplicate submit |
| Admin credentials leak | Supabase Auth, strong passwords, no hardcoding |
| Images are too large | Validation, compression, responsive loading |
| Watermarked images cause legal issue | Obtain publication permission or replace them |
| Payment details are outdated | Admin-managed settings and timestamps |
| Registration enumeration | Rate limiting and limited search response |

---

## 11. Post-Launch Roadmap

### Version 1.1

- Mobile number field
- Email field
- Better search verification
- Receipt re-download
- Improved administrator reports

### Version 1.2

- Email acknowledgement
- WhatsApp notification through an approved provider
- Multiple administrator roles
- Dashboard charts
- Excel export

### Version 2.0

- Razorpay or another payment gateway
- Automatic transaction confirmation
- Membership renewal
- Digital membership card
- Event and donation modules
- Regional administration hierarchy

---

## 12. Success Criteria

The project succeeds when:

- Community members can complete registration without assistance
- Administrators no longer depend entirely on manual paper records
- Every submission is traceable through a registration ID
- Payment proofs can be reviewed in one dashboard
- Users can check status independently
- Personal data remains protected
- The portal can be maintained and extended without rewriting the entire system
