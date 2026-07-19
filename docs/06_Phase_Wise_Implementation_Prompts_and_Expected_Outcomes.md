# Dhobi Samaj Registration Portal
## Phase-Wise Implementation Prompts and Expected Outcomes

**Document version:** 1.0  
**Recommended usage:** Paste one prompt into Lovable at a time. Review and test the result before starting the next phase.

---

# Phase 1: Project Foundation and Design System

## Prompt

```text
Create the foundation for a production-ready, mobile-first web application named:

“धोबी समाज पंजीकरण पोर्टल”
English subtitle: “Dhobi Samaj Registration Portal”

Use the existing Lovable project and do not unnecessarily replace working code.

Technology requirements:
- React
- TypeScript
- Tailwind CSS
- Reusable UI components
- Supabase-ready architecture
- Clean folder structure
- Responsive mobile, tablet and desktop layouts
- Hindi-first interface with supporting English text where useful

Create these routes:
1. /
2. /registration
3. /payment/:registrationId
4. /status
5. /admin/login
6. /admin/dashboard
7. /admin/registrations/:id
8. /admin/payment-settings

Create a shared application layout containing:
- Header
- Navigation
- Footer
- Loading state
- Error state
- Toast notifications
- Confirmation dialog
- Empty-state component

Brand style:
- Respectful community and social-service appearance
- Warm cream background
- Deep maroon primary colour
- Saffron accent colour
- Muted green secondary colour
- Dark readable text
- Soft shadows
- Rounded cards
- Avoid excessive gradients
- Avoid flashy animations

Use a Hindi-compatible font throughout the application.
Ensure Hindi characters display correctly on every page.

Header:
- Community logo placeholder
- धोबी समाज पंजीकरण पोर्टल
- होम
- नया पंजीकरण
- पंजीकरण खोजें
- प्रशासन लॉगिन

Footer:
- धोबी समाज पंजीकरण पोर्टल
- Contact placeholder
- Privacy notice
- Copyright text
- प्रशासन लॉगिन link

Create centralized configuration files for:
- Portal name
- Portal subtitle
- Contact details
- Navigation
- Image paths
- Registration statuses
- Payment statuses

Use accessible form controls, keyboard navigation, meaningful labels, alt text and sufficient colour contrast.

Do not create fake registration data yet.
Do not hardcode administrator credentials.
Prepare the project for Supabase integration in later phases.
```

## Expected outcome

- Application runs without errors
- All routes exist
- Shared public and admin layouts exist
- Hindi typography is configured
- Design tokens and reusable components are available
- No backend integration has been added prematurely

## Verification checklist

- Test every route manually
- Confirm navigation works
- Confirm no hardcoded admin credentials exist
- Confirm mobile layout is not horizontally scrollable
- Confirm Hindi text renders correctly

---

# Phase 2: Home Page and Community Image Gallery

## Prompt

```text
Continue from the existing Dhobi Samaj Registration Portal project.

Build the complete home page without removing the existing design system or routes.

Use the uploaded images from:

/images/community/dhobi-work-black-white.jpeg
/images/community/dhobi-work-colour.jpeg
/images/community/heritage-portrait.jpeg
/images/community/education-quote-one.jpeg
/images/community/heritage-painting.jpeg
/images/community/heritage-photo-one.jpeg
/images/community/heritage-group.jpeg
/images/community/heritage-photo-two.jpeg
/images/community/education-quote-two.jpeg

Home-page sections:

1. Hero section
Use dhobi-work-black-white.jpeg as the hero background.
Add a dark overlay so the text remains readable.

Hero text:
“धोबी समाज पंजीकरण पोर्टल”

Supporting text:
“समाज के सदस्यों के लिए सरल, सुरक्षित और डिजिटल पंजीकरण सुविधा”

Primary button:
“नया पंजीकरण करें”

Secondary button:
“पंजीकरण स्थिति देखें”

The buttons should navigate to /registration and /status.

2. Registration ID search card
Create a prominent search section containing:
- Label: “पंजीकरण आईडी खोजें”
- Input placeholder: “उदाहरण: DS-2026-000001”
- Search button: “खोजें”

Normalize the registration ID to uppercase.
Trim spaces.
Validate the format before searching.
For now, prepare the component for backend integration and show a clear placeholder message when Supabase is not connected.

3. Portal process section
Create four process cards:
- विवरण भरें
- भुगतान करें
- भुगतान प्रमाण अपलोड करें
- पावती प्राप्त करें

4. About section
Use dhobi-work-colour.jpeg.
Heading:
“हमारे समाज के बारे में”

Add editable placeholder content describing community registration, educational awareness, social cooperation and transparent record management.

5. Inspiration section
Use heritage-portrait.jpeg and heritage-painting.jpeg.
Heading:
“प्रेरणा और समाज सेवा”

Do not claim the identity of people in the images.
Treat them as community heritage and inspiration images unless verified captions are provided.

6. Education message section
Show:
- education-quote-one.jpeg
- education-quote-two.jpeg

Display both images completely using object-contain.
Do not crop their text.

7. Heritage gallery
Display:
- heritage-photo-one.jpeg
- heritage-group.jpeg
- heritage-photo-two.jpeg

Use a responsive gallery with accessible alt text.
Allow images to open in a simple lightbox.

8. Final call-to-action section
Heading:
“आज ही अपना पंजीकरण पूरा करें”

Buttons:
- “नया पंजीकरण”
- “पंजीकरण खोजें”

Optimize all images:
- Lazy loading below the hero
- Responsive image sizes
- Correct aspect ratios
- No stretched images
```

## Expected outcome

- Complete public home page
- All supplied images are integrated
- Search interface is visible
- New registration and status buttons work
- Mobile and desktop layouts are polished

## Verification checklist

- Quote images are not cropped
- Watermarked images are used only when publication rights are available
- Hero text is readable
- Every image has meaningful alt text
- Gallery loads efficiently

---

# Phase 3: Registration Form

## Prompt

```text
Continue from the current Dhobi Samaj Registration Portal.

Build the complete /registration page.

Page heading:
“नया सदस्य पंजीकरण”

Supporting message:
“कृपया सभी आवश्यक जानकारी सावधानीपूर्वक भरें।”

Create these sections and fields:

व्यक्तिगत जानकारी:
- नाम: required, 2 to 100 characters
- उम्र: required, 1 to 120

शैक्षणिक जानकारी:
- शिक्षा स्तर: required select
  Options:
  कोई औपचारिक शिक्षा नहीं
  प्राथमिक
  माध्यमिक
  उच्च माध्यमिक
  आईटीआई
  डिप्लोमा
  स्नातक
  स्नातकोत्तर
  पीएचडी
  अन्य
- कक्षा / डिग्री / विषय: optional

पता:
- स्थायी पता: required, 10 to 500 characters

परिवार की जनसंख्या:
- लड़कों की संख्या: required, minimum 0, maximum 99
- लड़कियों की संख्या: required, minimum 0, maximum 99
- बुजुर्गों की संख्या: required, minimum 0, maximum 99
- Automatically show the total

सदस्य का फोटो:
- Required
- JPG, JPEG, PNG or WebP
- Maximum 5 MB
- Show preview
- Replace and remove actions

Declaration:
“मैं पुष्टि करता/करती हूं कि मेरे द्वारा दी गई जानकारी सही है और पंजीकरण के उद्देश्य से सुरक्षित रूप से संग्रहीत की जा सकती है।”

Buttons:
- वापस जाएं
- सहेजें और भुगतान पर जाएं

Behaviour:
- Use React Hook Form and Zod
- Show field-level Hindi errors
- Preserve entered data after validation errors
- Disable repeated submission
- Prepare TypeScript types
- Prepare backend integration

After successful backend creation:
- Generate registration ID in DS-YYYY-000001 format
- Set registration_status = awaiting_payment
- Set payment_status = not_submitted
- Redirect to /payment/{registrationId}

The registration ID must later be generated securely on the backend.
Do not use Math.random for the final ID.
```

## Expected outcome

- Complete validated form
- Image preview works
- Total family count updates automatically
- Submission state is handled
- Backend service interface is prepared

## Verification checklist

- Negative family values are rejected
- Oversized and unsupported photos are rejected
- Repeated clicks do not submit twice
- Hindi error messages are understandable

---

# Phase 4: Payment and Payment-Proof Submission

## Prompt

```text
Continue from the existing project.

Build the dynamic payment page:
/payment/:registrationId

Show:
- Registration ID
- Applicant name
- Education
- Total family members
- Current status

Load active payment settings:
- QR code
- UPI ID
- Payee name
- Amount
- Instructions
- Public support contact

Add:
- Copy UPI ID button
- UPI deep-link button
- Payment screenshot upload
- Screenshot preview
- Required declaration checkbox
- Submit button

Notice:
“QR कोड या UPI के माध्यम से भुगतान करने के बाद भुगतान का स्क्रीनशॉट अपलोड करें। स्क्रीनशॉट अपलोड करना भुगतान की अंतिम पुष्टि नहीं है। भुगतान का सत्यापन प्रशासन द्वारा किया जाएगा।”

Screenshot rules:
- JPG, JPEG, PNG or WebP
- Maximum 5 MB
- PDF and executable files are not accepted

On successful submission:
- Upload screenshot securely
- Set payment_status = pending_verification
- Set registration_status = submitted
- Store submitted_at
- Generate acknowledgement PDF
- Download the PDF
- Show success message
- Redirect to home after approximately 4 seconds

Acknowledgement status:
“भुगतान सत्यापन लंबित”

Never show “Payment Successful” before administrator verification.

Handle:
- Invalid ID
- Already submitted proof
- Payment disabled
- Upload failure
- Network failure
- PDF generation failure
```

## Expected outcome

- Payment page loads registration and payment settings
- Screenshot upload works
- Status changes are prepared
- Acknowledgement download is triggered
- User returns to home

## Verification checklist

- No final-payment claim is shown
- Failed PDF generation does not delete the screenshot
- Payment-disabled state blocks upload
- Duplicate proof submission is prevented

---

# Phase 5: Public Registration Status Search

## Prompt

```text
Build the complete /status page and connect the home-page search bar.

Search field:
- Registration ID
- Uppercase normalization
- Space trimming
- Format validation
- Search button

Display only:
- Registration ID
- Masked name
- Registration date
- Registration status
- Payment status
- Last updated date

Do not display:
- Full address
- Applicant photo
- Payment screenshot
- Private storage URL
- Internal notes
- Internal UUID

Hindi registration status labels:
- awaiting_payment: भुगतान की प्रतीक्षा
- submitted: जमा किया गया
- under_review: समीक्षा में
- approved: स्वीकृत
- rejected: अस्वीकृत
- archived: संग्रहित

Hindi payment status labels:
- not_submitted: भुगतान प्रमाण जमा नहीं
- pending_verification: सत्यापन लंबित
- verified: भुगतान सत्यापित
- rejected: भुगतान प्रमाण अस्वीकृत

When payment is rejected, show the rejection guidance.
Show a new upload option only when the backend allows resubmission.

Protect the search from enumeration using reasonable throttling and generic not-found responses.
```

## Expected outcome

- Privacy-safe status lookup
- Hindi badges
- Helpful not-found and rejection states
- Optional resubmission path

## Verification checklist

- Full personal information never appears publicly
- Invalid IDs do not create detailed error leaks
- Search results work on mobile

---

# Phase 6: Administrator Authentication and Dashboard

## Prompt

```text
Implement secure administrator authentication using Supabase Auth.

Do not hardcode credentials.
Do not create public admin sign-up.

Build /admin/login with:
- Email
- Password
- Show or hide password
- Loading state
- Invalid credentials error
- Back to home

Protect:
- /admin/dashboard
- /admin/registrations/:id
- /admin/payment-settings

Verify both authenticated session and active admin role.

Dashboard cards:
- Total registrations
- Awaiting payment
- Pending verification
- Approved
- Rejected
- Submitted today

Registration table:
- Registration ID
- Name
- Age
- Education
- Family total
- Registration status
- Payment status
- Submission date
- Actions

Features:
- Search
- Status filters
- Date filter
- Sorting
- Pagination
- Mobile card layout
- CSV export

Details view:
- Complete applicant data
- Applicant photo
- Payment screenshot
- Statuses
- Timestamps
- Admin notes

Actions:
- Mark under review
- Verify payment
- Reject payment
- Approve registration
- Reject registration
- Allow resubmission
- Add note
- Download files
- Download acknowledgement
- Archive

Require confirmations for destructive actions.
Require rejection reasons.
Use signed URLs for private files.
Add logout.
```

## Expected outcome

- Protected administrator portal
- Complete dashboard
- Full record review
- Administrative status controls
- CSV export and secure logout

## Verification checklist

- Anonymous users cannot load admin data
- Non-admin authenticated users are denied
- Reject actions require a reason
- Private file URLs expire

---

# Phase 7: Payment Settings Management

## Prompt

```text
Build /admin/payment-settings.

Only administrators may access it.

Fields:
- Payment enabled toggle
- QR code upload
- UPI ID
- Payee name
- Registration fee
- Payment title
- Payment instructions
- Public contact
- Optional payment deadline

Rules:
- UPI ID and payee name are required when payment is enabled
- QR image supports JPG, PNG and WebP
- Maximum QR file size is 3 MB
- Store one active settings record
- Store updated_by and updated_at
- Show real-time preview
- Allow save and reset
- Add preview payment page action

When payment is disabled, the public page must show:
“ऑनलाइन भुगतान फिलहाल उपलब्ध नहीं है। कृपया प्रशासन से संपर्क करें।”

Do not hardcode the QR image URL in the frontend.
```

## Expected outcome

- Administrator-controlled payment page
- QR and UPI changes appear on the public payment page
- Payment can be disabled safely

## Verification checklist

- Invalid UPI values are rejected
- Replaced QR image is shown correctly
- Public page uses stored settings

---

# Phase 8: Supabase Database and Security

## Prompt

```text
Connect the project to Supabase.

Create:
- registrations
- payment_settings
- admin_profiles
- admin_audit_logs

Create private storage buckets:
- applicant-photos
- payment-proofs
- payment-qr-codes

Create database constraints:
- Age 1 to 120
- Family counts non-negative
- Unique registration ID
- Allowed registration statuses
- Allowed payment statuses

Implement secure server-side registration ID generation:
DS-YYYY-000001

Prevent duplicates during simultaneous submissions.

Enable Row Level Security.

Anonymous users may:
- Create a registration through a controlled operation
- Submit proof for the correct registration flow
- Retrieve only privacy-safe public status
- Read active public payment settings

Anonymous users may not:
- List registrations
- Read full addresses
- Read images or screenshots
- Change statuses
- Read admin notes

Administrators may:
- Read full records
- Update statuses
- Access private files
- Manage payment settings
- Read audit logs

Add:
- updated_at trigger
- indexes
- signed URL usage
- duplicate-submit protection
- file type and size checks
- environment variables
- audit logging

Never expose the service-role key or internal UUIDs publicly.
```

## Expected outcome

- Fully connected Supabase backend
- Secure database and storage
- RLS policies
- Registration ID function
- Public status function
- Audit trail

## Verification checklist

- Test policies with anonymous and admin sessions
- Confirm private images cannot be publicly listed
- Confirm duplicate IDs cannot occur
- Confirm public search is limited

---

# Phase 9: Hindi Acknowledgement and Final Receipt

## Prompt

```text
Create two PDF documents.

Document 1:
“धोबी समाज पंजीकरण पावती”
Status:
“भुगतान सत्यापन लंबित”
Watermark:
“सत्यापन लंबित”

Document 2:
“धोबी समाज पंजीकरण रसीद”
Status:
“भुगतान सत्यापित एवं पंजीकरण स्वीकृत”

Both must support Hindi correctly.

Include:
- Portal name
- Registration ID
- Date
- Applicant details
- Education
- Address
- Family counts
- Applicant photo
- Payment screenshot or proof reference
- Payment amount
- Payment status
- Registration status
- Contact
- Disclaimer
- A4 print layout

The final receipt additionally includes:
- Receipt number
- Verification date
- Approval date
- Approved by
- Verified mark

Never issue the final receipt before payment verification and approval.

Test these Hindi phrases:
पंजीकरण
भुगतान सत्यापन लंबित
स्थायी पता
परिवार की जनसंख्या
शिक्षा
बुजुर्ग

Do not complete this phase until Devanagari renders correctly.
```

## Expected outcome

- Pending acknowledgement PDF
- Approved receipt PDF
- Correct Hindi rendering
- Clear document status
- A4 printable layout

## Verification checklist

- No broken Hindi glyphs
- Applicant image is not distorted
- Pending document cannot be mistaken for final receipt
- Approved receipt is unavailable before approval

---

# Phase 10: Testing, Optimization, and Deployment

## Prompt

```text
Perform a production-readiness pass without unnecessarily redesigning the application.

Test the complete flow:
1. Home
2. Registration
3. Validation
4. Photo upload
5. Unique ID
6. Payment page
7. QR and UPI settings
8. Screenshot upload
9. Acknowledgement
10. Home redirect
11. Public status search
12. Admin login
13. Admin review
14. Payment verification
15. Registration approval
16. Final receipt
17. Approved public status

Test:
- 320 px mobile
- 375 px mobile
- Tablet
- Laptop
- Desktop
- Chrome
- Safari
- Edge
- Slow network
- Failed upload
- Missing QR
- Invalid ID
- Duplicate submit
- Expired admin session
- Direct admin route access

Improve:
- Loading skeletons
- Error messages
- Empty states
- Disabled states
- Toasts
- Dialogs
- Accessibility
- Keyboard navigation
- Image loading
- PDF layout
- Hindi typography
- Page metadata
- Favicon
- 404 page

Security review:
- No hardcoded password
- No exposed service-role key
- Private storage
- Limited public search
- RLS enabled
- File restrictions
- Audit logs

Performance:
- Lazy-load images
- Compress uploads
- Paginate admin results
- Reduce unnecessary queries

Prepare a README with:
- Local setup
- Supabase setup
- Environment variables
- First admin creation
- Payment settings
- Storage buckets
- RLS summary
- Deployment
- Backup recommendations
```

## Expected outcome

- Production-ready application
- Full end-to-end workflow verified
- Security review completed
- Deployment instructions available
- Portal deployed online

## Final acceptance checklist

- [ ] Every public route works
- [ ] Every admin route is protected
- [ ] Registration ID generation is secure
- [ ] Photo upload works
- [ ] Screenshot upload works
- [ ] Payment settings are administrator-controlled
- [ ] Pending acknowledgement works
- [ ] Final approved receipt works
- [ ] Hindi renders correctly
- [ ] Public search is privacy-safe
- [ ] RLS is enabled
- [ ] Audit logs work
- [ ] Mobile and desktop layouts are tested
- [ ] Production deployment is complete
