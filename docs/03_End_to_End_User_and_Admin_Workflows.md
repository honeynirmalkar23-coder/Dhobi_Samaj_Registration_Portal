# Dhobi Samaj Registration Portal
## End-to-End User and Administrator Workflows

**Document version:** 1.0  

---

## 1. Purpose

This document describes the complete functional flow of the portal from a user's first visit through administrator verification and final registration approval.

---

## 2. Public User Journey

```text
Home Page
   ↓
New Registration
   ↓
Fill Personal and Family Details
   ↓
Upload Applicant Photo
   ↓
Submit Registration
   ↓
Unique Registration ID Created
   ↓
Payment Page
   ↓
Scan QR / Pay Through UPI
   ↓
Upload Payment Screenshot
   ↓
Submit Payment Proof
   ↓
Acknowledgement PDF Downloaded
   ↓
Redirect to Home Page
   ↓
Search Registration ID
   ↓
View Current Status
```

---

## 3. Home Page Flow

### Entry point

The user opens the portal home page.

### Visible options

- नया पंजीकरण
- पंजीकरण आईडी खोजें
- प्रशासन लॉगिन
- Community information
- Education messages
- Heritage gallery
- Registration process explanation

### New registration action

When the user clicks `नया पंजीकरण`, the application redirects to:

```text
/registration
```

### Registration search action

The user enters a registration ID such as:

```text
DS-2026-000001
```

The application:

1. Trims spaces
2. Converts the value to uppercase
3. Validates the format
4. Searches the privacy-safe public endpoint
5. Displays the status or a generic not-found message

---

## 4. Registration Form Flow

### Required fields

- नाम
- उम्र
- शिक्षा स्तर
- कक्षा / डिग्री / विषय, when applicable
- स्थायी पता
- लड़कों की संख्या
- लड़कियों की संख्या
- बुजुर्गों की संख्या
- सदस्य का फोटो
- Declaration acceptance

### Validation sequence

1. User enters details
2. Frontend validates the form
3. User corrects any highlighted errors
4. Applicant photo is validated
5. Form is submitted once
6. Backend validates all values again
7. Photo is uploaded to private storage
8. Registration record is created
9. Unique registration ID is generated
10. Initial statuses are assigned

### Initial status

```text
registration_status = awaiting_payment
payment_status = not_submitted
```

### Successful result

The user is redirected to:

```text
/payment/DS-YYYY-XXXXXX
```

### Failure handling

If registration creation fails:

- The user remains on the page
- Entered fields remain available
- A clear Hindi error message is shown
- Repeated button clicks do not create duplicate registrations

---

## 5. Payment Flow

### Payment page content

The page displays:

- Registration ID
- Applicant name
- Basic registration summary
- QR code
- UPI ID
- Payee name
- Registration fee
- Payment instructions
- Public support contact
- UPI app button

### Payment action

The user:

1. Scans the QR code or copies the UPI ID
2. Makes the payment outside the portal
3. Takes a screenshot
4. Returns to the portal
5. Uploads the screenshot
6. Confirms that the proof belongs to the registration
7. Clicks `भुगतान प्रमाण जमा करें`

### Backend action

The system:

1. Validates the registration ID
2. Confirms that payment submission is allowed
3. Validates the screenshot
4. Stores the screenshot in private storage
5. Updates the statuses
6. Stores the submission timestamp
7. Generates the acknowledgement PDF
8. Starts the download
9. Displays a success message
10. Redirects to the home page

### Updated status

```text
registration_status = submitted
payment_status = pending_verification
```

### Important payment rule

The acknowledgement must state:

```text
भुगतान सत्यापन लंबित
```

It must not claim that the payment has been successfully verified.

---

## 6. Acknowledgement Flow

The acknowledgement PDF contains:

- Portal name
- Registration ID
- Submission date and time
- Applicant details
- Education details
- Permanent address
- Family member counts
- Applicant photograph
- Payment screenshot
- Payment status
- Registration status
- Verification disclaimer
- Administrator contact

Recommended filename:

```text
Dhobi-Samaj-Acknowledgement-DS-2026-000001.pdf
```

### PDF failure flow

If the screenshot is successfully submitted but PDF generation fails:

- The payment proof remains stored
- The registration remains submitted
- The user sees a retry button
- The user can later search the ID and download the acknowledgement

---

## 7. Public Status Search Flow

### Search request

The user enters a registration ID.

### Returned public information

- Registration ID
- Masked applicant name
- Registration date
- Registration status
- Payment status
- Last updated date

### Example masked name

```text
यो**** कु**** बं***
```

### Status scenarios

#### Awaiting payment

```text
पंजीकरण स्थिति: भुगतान की प्रतीक्षा
भुगतान स्थिति: भुगतान प्रमाण जमा नहीं
```

#### Pending verification

```text
पंजीकरण स्थिति: जमा किया गया
भुगतान स्थिति: सत्यापन लंबित
```

#### Under review

```text
पंजीकरण स्थिति: समीक्षा में
भुगतान स्थिति: सत्यापन लंबित
```

#### Approved

```text
पंजीकरण स्थिति: स्वीकृत
भुगतान स्थिति: भुगतान सत्यापित
```

#### Payment rejected

```text
पंजीकरण स्थिति: समीक्षा में
भुगतान स्थिति: भुगतान प्रमाण अस्वीकृत
```

When resubmission is allowed, the user receives a button to submit a new screenshot.

---

## 8. Administrator Login Flow

```text
/admin/login
   ↓
Enter Email and Password
   ↓
Supabase Authentication
   ↓
Admin Profile and Role Check
   ↓
Access Granted
   ↓
/admin/dashboard
```

### Login failure

The administrator sees a generic invalid-credentials message. The application must not reveal whether the email exists.

### Session expiry

When a session expires:

- Protected operations stop
- The administrator is redirected to login
- Unsaved changes are protected where practical

---

## 9. Administrator Dashboard Flow

The dashboard displays summary cards:

- Total registrations
- Awaiting payment
- Pending verification
- Approved
- Rejected
- Submitted today

The registration list provides:

- Registration ID
- Name
- Age
- Education
- Family total
- Registration status
- Payment status
- Submission date
- Actions

The administrator may:

- Search by name or registration ID
- Filter by status
- Filter by payment status
- Filter by date
- Sort records
- Change page
- Export filtered data to CSV
- Open a full record

---

## 10. Registration Review Flow

```text
Open Registration
   ↓
Review Applicant Details
   ↓
Review Applicant Photo
   ↓
Review Payment Screenshot
   ↓
Select Administrative Action
```

Possible actions:

- Mark as under review
- Verify payment
- Reject payment proof
- Allow payment resubmission
- Approve registration
- Reject registration
- Archive registration
- Add internal note
- Download files
- Download acknowledgement
- Generate final receipt

---

## 11. Payment Verification Flow

### Payment accepted

```text
pending_verification
   ↓
Administrator verifies payment
   ↓
payment_status = verified
   ↓
Audit log created
```

### Payment rejected

The administrator must enter a reason.

```text
pending_verification
   ↓
Administrator rejects payment proof
   ↓
payment_status = rejected
   ↓
Rejection reason stored
   ↓
Optional resubmission enabled
   ↓
Audit log created
```

### Resubmission

When resubmission is enabled:

1. User searches the registration ID
2. Portal displays rejection information
3. Portal shows a payment-proof upload option
4. User submits a new screenshot
5. Payment status returns to `pending_verification`
6. Previous screenshot remains archived or is retained for audit

---

## 12. Registration Approval Flow

Recommended approval condition:

- Payment status must be `verified`
- Required registration information must be complete
- Administrator has reviewed the record

```text
under_review
   ↓
Payment verified
   ↓
Registration approved
   ↓
registration_status = approved
   ↓
approved_at stored
   ↓
Final receipt generated
   ↓
Audit log created
```

The user can then search the registration ID and see:

```text
पंजीकरण स्थिति: स्वीकृत
भुगतान स्थिति: भुगतान सत्यापित
```

---

## 13. Final Receipt Flow

The final receipt is generated only after approval.

It includes:

- Receipt number
- Registration ID
- Applicant details
- Payment amount
- Payment verification date
- Approval date
- Registration status
- Administrator reference
- Verified mark

Recommended filename:

```text
Dhobi-Samaj-Approved-Receipt-DS-2026-000001.pdf
```

---

## 14. Payment Settings Flow

The administrator opens:

```text
/admin/payment-settings
```

The administrator can configure:

- Payment enabled or disabled
- QR code
- UPI ID
- Payee name
- Registration fee
- Payment title
- Instructions
- Public contact
- Payment deadline

### Save sequence

1. Validate fields
2. Upload new QR image if selected
3. Update the single active settings record
4. Store `updated_by`
5. Store `updated_at`
6. Record audit log
7. Refresh the payment-page preview

### Payment disabled flow

The public payment page shows:

```text
ऑनलाइन भुगतान फिलहाल उपलब्ध नहीं है।
कृपया प्रशासन से संपर्क करें।
```

Screenshot submission remains disabled.

---

## 15. Error and Recovery Flows

### Invalid registration ID

- Show generic not-found message
- Do not reveal internal data

### Duplicate payment submission

- Prevent repeated upload
- Show current payment status
- Allow resubmission only when enabled

### Unsupported file

- Reject the file
- Show supported formats and maximum size

### Network failure

- Preserve form state
- Show retry action
- Do not create duplicate records

### Missing payment settings

- Show contact administrator message
- Prevent incomplete payment submission

### Unauthorized administrator

- Redirect to login or access-denied page
- Do not return protected data

---

## 16. Complete Status Matrix

| Registration Status | Payment Status | User Meaning | Admin Action |
|---|---|---|---|
| awaiting_payment | not_submitted | Registration created; payment proof missing | Wait or provide support |
| submitted | pending_verification | Proof received; verification pending | Review proof |
| under_review | pending_verification | Registration is being reviewed | Verify or reject payment |
| under_review | rejected | Payment proof rejected | Allow resubmission |
| under_review | verified | Payment verified; approval pending | Approve or reject |
| approved | verified | Registration completed | Issue final receipt |
| rejected | rejected/verified | Registration rejected | Review history |
| archived | any | Record archived | Restore only if policy allows |

---

## 17. End-to-End Acceptance Scenario

The complete project is considered functionally connected when:

1. A user creates a registration
2. A unique ID is generated
3. The user reaches the payment page
4. Payment settings load from the administrator configuration
5. The user uploads a valid screenshot
6. An acknowledgement downloads
7. The public status search shows pending verification
8. The administrator sees the record
9. The administrator verifies the payment
10. The administrator approves the registration
11. The final receipt is generated
12. The public search shows approved status
