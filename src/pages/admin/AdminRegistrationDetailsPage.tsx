import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ErrorState } from "../../components/common/ErrorState";
import { OutlineButton, PrimaryButton, SecondaryButton } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionContainer } from "../../components/common/SectionContainer";
import { StatusBadge } from "../../components/common/StatusBadge";
import { routePaths } from "../../config/routes.config";
import { useLanguage } from "../../features/language/LanguageContext";
import { usePageMetadata } from "../../hooks/usePageMetadata";
import { formatPublicDate } from "../../lib/utilities/dates";
import {
  isValidRegistrationId,
  normalizeRegistrationId
} from "../../lib/validation/registration-id";
import {
  loadAdminRegistrationDetails,
  runAdminRegistrationAction,
  updateAdminNotes
} from "../../services/admin-registration.service";
import type { AdminRegistrationDetails } from "../../services/admin-registration.service";

function getStatusPath(registrationId: string): string {
  const params = new URLSearchParams({
    registrationId
  });

  return `${routePaths.status}?${params.toString()}`;
}

function DetailItem({
  label,
  value
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const { localized } = useLanguage();

  return (
    <div className="rounded-lg border border-maroon-700/10 bg-cream-50 p-4">
      <dt className="text-sm font-semibold text-brown-700">{label}</dt>
      <dd className="mt-1 break-words font-bold text-maroon-900">
        {value === null || value === undefined || value === "" ? localized("उपलब्ध नहीं", "Unavailable") : value}
      </dd>
    </div>
  );
}

function AdministrativeActionGuide() {
  const { localized } = useLanguage();
  const reviewSteps = [
    {
      description: localized(
        "नाम, उम्र, शिक्षा, पता, परिवार विवरण और सदस्य फोटो को पंजीकरण जानकारी से मिलाएं।",
        "Check the name, age, education, address, family details and member photo against the registration information."
      ),
      title: localized("रिकॉर्ड की समीक्षा करें", "Review the record")
    },
    {
      description: localized(
        "भुगतान स्क्रीनशॉट खोलकर राशि, UPI/प्राप्तकर्ता विवरण, तारीख और लेनदेन विवरण पढ़ने योग्य हैं या नहीं जांचें।",
        "Open the payment screenshot and check whether the amount, UPI/payee details, date and transaction details are readable."
      ),
      title: localized("भुगतान प्रमाण जांचें", "Check payment proof")
    },
    {
      description: localized(
        "जांच शुरू करने पर समीक्षा में मार्क करें। भुगतान केवल तब सत्यापित करें जब प्रमाण और बाहरी भुगतान मिलान स्पष्ट हो।",
        "Mark under review when checking starts. Verify payment only when the proof and external payment confirmation are clear."
      ),
      title: localized("समीक्षा और भुगतान सत्यापन", "Review and verify payment")
    },
    {
      description: localized(
        "पंजीकरण स्वीकृत करें केवल तब जब भुगतान सत्यापित हो चुका हो और सदस्य की जानकारी सही हो।",
        "Approve registration only after payment is verified and the member details are acceptable."
      ),
      title: localized("अंतिम स्वीकृति दें", "Give final approval")
    }
  ];
  const correctionActions = [
    localized(
      "भुगतान प्रमाण गलत, धुंधला या राशि/UPI से मेल नहीं खाता है तो भुगतान अस्वीकार करें और सार्वजनिक कारण लिखें।",
      "Reject payment and write a public reason if the proof is wrong, unclear or does not match the amount/UPI details."
    ),
    localized(
      "भुगतान अस्वीकार करने के बाद नया स्क्रीनशॉट चाहिए तो भुगतान पुनः जमा सक्षम करें।",
      "After rejecting payment, enable payment resubmission when a new screenshot is required."
    ),
    localized(
      "सदस्य जानकारी स्वीकार योग्य नहीं है तो पंजीकरण अस्वीकार करें और स्पष्ट सार्वजनिक कारण दें।",
      "Reject registration with a clear public reason when the member information cannot be accepted."
    ),
    localized(
      "संग्रहित करें विकल्प केवल पुराने, पूर्ण या आगे कार्रवाई न चाहिए ऐसे रिकॉर्ड के लिए उपयोग करें।",
      "Use archive only for old, completed or no-longer-actionable records."
    )
  ];

  return (
    <div className="mb-6 grid gap-4">
      <div className="rounded-lg border border-saffron-500/30 bg-saffron-50 p-4">
        <h3 className="text-lg font-bold text-maroon-900">
          {localized("सत्यापन और स्वीकृति कैसे करें", "How to verify and approve")}
        </h3>
        <p className="mt-2 text-sm leading-7 text-brown-800">
          {localized(
            "स्क्रीनशॉट जमा होना भुगतान सत्यापित होने के बराबर नहीं है। भुगतान सत्यापन और पंजीकरण स्वीकृति दो अलग प्रशासनिक कदम हैं।",
            "A submitted screenshot is not the same as verified payment. Payment verification and registration approval are two separate administrative steps."
          )}
        </p>
      </div>

      <ol className="grid gap-3 lg:grid-cols-2">
        {reviewSteps.map((step, index) => (
          <li
            className="flex gap-3 rounded-lg border border-maroon-700/10 bg-cream-50 p-4"
            key={step.title}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-maroon-700 text-sm font-bold text-white">
              {index + 1}
            </span>
            <span>
              <span className="block font-bold text-maroon-900">{step.title}</span>
              <span className="mt-1 block text-sm leading-7 text-brown-700">{step.description}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="rounded-lg border border-communityGreen-600/25 bg-communityGreen-50 p-4">
        <h3 className="font-bold text-maroon-900">
          {localized("गलती या अपूर्ण जानकारी होने पर", "When information is incorrect or incomplete")}
        </h3>
        <ul className="mt-3 grid gap-2 text-sm leading-7 text-brown-800">
          {correctionActions.map((action) => (
            <li className="flex gap-2" key={action}>
              <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-communityGreen-700" />
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AdminRegistrationDetailsPage() {
  const { localized } = useLanguage();
  const { registrationId } = useParams();
  const normalizedRegistrationId = normalizeRegistrationId(registrationId ?? "");
  const isValidRouteId = isValidRegistrationId(registrationId ?? "");
  const [details, setDetails] = useState<AdminRegistrationDetails | null>(null);
  const [notes, setNotes] = useState("");
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "not_found" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);

  usePageMetadata({
    title: isValidRouteId
      ? localized("पंजीकरण विवरण", "Registration details")
      : localized("अमान्य पंजीकरण आईडी", "Invalid registration ID"),
    description: localized("प्रशासन पंजीकरण विवरण।", "Administrative registration details.")
  });

  const loadDetails = useCallback(async () => {
    if (!isValidRouteId) {
      return;
    }

    setLoadState("loading");
    const result = await loadAdminRegistrationDetails(normalizedRegistrationId);

    if (!result.ok) {
      setMessage(result.message);
      setLoadState("error");
      return;
    }

    if (!result.data) {
      setLoadState("not_found");
      return;
    }

    setDetails(result.data);
    setNotes(result.data.adminNotes ?? "");
    setLoadState("loaded");
  }, [isValidRouteId, normalizedRegistrationId]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const runAction = async (
    action: Parameters<typeof runAdminRegistrationAction>[0]["action"],
    publicMessage?: string | null
  ) => {
    if (!details) {
      return;
    }

    setMessage(null);
    const actionPayload: Parameters<typeof runAdminRegistrationAction>[0] = {
      action,
      expectedVersion: details.version,
      registrationId: details.registrationId
    };

    if (publicMessage !== undefined) {
      actionPayload.publicMessage = publicMessage;
    }

    const result = await runAdminRegistrationAction(actionPayload);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setDetails(result.data);
    setNotes(result.data.adminNotes ?? "");
    setMessage(localized("प्रशासनिक कार्रवाई सफलतापूर्वक पूरी हुई।", "Administrative action completed successfully."));
  };

  const saveNotes = async () => {
    if (!details) {
      return;
    }

    const result = await updateAdminNotes({
      adminNotes: notes,
      expectedVersion: details.version,
      registrationId: details.registrationId
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setDetails(result.data);
    setMessage(localized("प्रशासनिक टिप्पणी सहेजी गई।", "Administrative note saved."));
  };

  if (!isValidRouteId) {
    return (
      <ErrorState
        action={
          <PrimaryButton to={routePaths.adminDashboard}>{localized("डैशबोर्ड पर वापस जाएं", "Back to dashboard")}</PrimaryButton>
        }
        description={localized(
          "प्रशासन पंजीकरण विवरण खोलने के लिए मान्य पंजीकरण आईडी आवश्यक है।",
          "A valid registration ID is required to open administrative registration details."
        )}
        title={localized("अमान्य पंजीकरण आईडी", "Invalid registration ID")}
      />
    );
  }

  if (loadState === "loading") {
    return (
      <div className="rounded-lg border border-maroon-700/10 bg-white p-6 shadow-subtle">
        <LoadingSpinner label={localized("पंजीकरण विवरण लोड हो रहा है…", "Registration details are loading…")} />
      </div>
    );
  }

  if (loadState === "not_found") {
    return (
      <ErrorState
        action={<PrimaryButton to={routePaths.adminDashboard}>{localized("डैशबोर्ड पर वापस जाएं", "Back to dashboard")}</PrimaryButton>}
        description={localized("इस पंजीकरण आईडी से कोई रिकॉर्ड नहीं मिला।", "No record was found for this registration ID.")}
        title={localized("पंजीकरण रिकॉर्ड नहीं मिला", "Registration record not found")}
      />
    );
  }

  if (loadState === "error" || !details) {
    return (
      <ErrorState
        action={<PrimaryButton onClick={() => void loadDetails()}>{localized("पुनः प्रयास करें", "Try again")}</PrimaryButton>}
        description={message ?? localized("पंजीकरण विवरण प्राप्त नहीं हो सका।", "Registration details could not be loaded.")}
        title={localized("विवरण उपलब्ध नहीं हुआ", "Details are unavailable")}
      />
    );
  }

  const latestProof = details.paymentProofs[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description={localized(
          "यह विवरण केवल अधिकृत प्रशासकों के लिए है। निजी फाइलें छोटे समय के signed URL से दिखाई जाती हैं।",
          "These details are only for authorized administrators. Private files are shown through short-lived signed URLs."
        )}
        title={localized("पंजीकरण विवरण", "Registration details")}
      />

      {message ? (
        <div className="rounded-lg border border-saffron-500/30 bg-saffron-50 px-4 py-3 text-sm font-semibold leading-7 text-brown-800">
          {message}
        </div>
      ) : null}

      <SectionContainer title={localized("पंजीकरण संदर्भ", "Registration reference")} variant="card">
        <dl className="grid gap-4 md:grid-cols-3">
          <DetailItem label={localized("पंजीकरण आईडी", "Registration ID")} value={details.registrationId} />
          <div className="rounded-lg border border-maroon-700/10 bg-cream-50 p-4">
            <dt className="text-sm font-semibold text-brown-700">{localized("पंजीकरण स्थिति", "Registration status")}</dt>
            <dd className="mt-2"><StatusBadge status={details.registrationStatus} type="registration" /></dd>
          </div>
          <div className="rounded-lg border border-maroon-700/10 bg-cream-50 p-4">
            <dt className="text-sm font-semibold text-brown-700">{localized("भुगतान स्थिति", "Payment status")}</dt>
            <dd className="mt-2"><StatusBadge status={details.paymentStatus} type="payment" /></dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <PrimaryButton to={routePaths.adminDashboard}>{localized("डैशबोर्ड पर वापस जाएं", "Back to dashboard")}</PrimaryButton>
          <OutlineButton to={getStatusPath(details.registrationId)}>{localized("सार्वजनिक स्थिति पृष्ठ देखें", "View public status page")}</OutlineButton>
        </div>
      </SectionContainer>

      <SectionContainer title={localized("व्यक्तिगत जानकारी", "Personal information")} variant="card">
        <dl className="grid gap-4 md:grid-cols-2">
          <DetailItem label={localized("नाम", "Name")} value={details.fullName} />
          <DetailItem label={localized("उम्र", "Age")} value={details.age} />
          <DetailItem label={localized("शिक्षा स्तर", "Education level")} value={details.educationLevel} />
          <DetailItem label={localized("शिक्षा विवरण", "Education details")} value={details.educationDetails} />
          <DetailItem label={localized("स्थायी पता", "Permanent address")} value={details.permanentAddress} />
          <DetailItem label={localized("कुल परिवार सदस्य", "Total family members")} value={details.totalFamilyMembers} />
          <DetailItem label={localized("लड़कों की संख्या", "Number of boys")} value={details.boysCount} />
          <DetailItem label={localized("लड़कियों की संख्या", "Number of girls")} value={details.girlsCount} />
          <DetailItem label={localized("बुजुर्गों की संख्या", "Number of elders")} value={details.eldersCount} />
          <DetailItem label={localized("बनाया गया", "Created")} value={formatPublicDate(details.createdAt, { includeTime: true })} />
        </dl>
      </SectionContainer>

      <SectionContainer title={localized("फोटो और भुगतान प्रमाण", "Photo and payment proof")} variant="card">
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-bold text-maroon-900">{localized("सदस्य फोटो", "Member photo")}</h3>
            {details.applicantPhotoSignedUrl ? (
              <img
                alt={localized("सदस्य फोटो", "Member photo")}
                className="mt-3 aspect-square w-full max-w-sm rounded-lg border border-maroon-700/10 bg-cream-50 object-cover"
                src={details.applicantPhotoSignedUrl}
              />
            ) : (
              <p className="mt-3 text-sm leading-7 text-brown-700">
                {localized("सुरक्षित फोटो लिंक उपलब्ध नहीं हुआ।", "Secure photo link is unavailable.")}
              </p>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-maroon-900">{localized("वर्तमान भुगतान प्रमाण", "Current payment proof")}</h3>
            {latestProof?.signedUrl ? (
              <img
                alt={localized("भुगतान प्रमाण", "Payment proof")}
                className="mt-3 aspect-[3/4] w-full max-w-sm rounded-lg border border-maroon-700/10 bg-cream-50 object-contain"
                src={latestProof.signedUrl}
              />
            ) : (
              <p className="mt-3 text-sm leading-7 text-brown-700">
                {localized("भुगतान प्रमाण उपलब्ध नहीं है।", "Payment proof is unavailable.")}
              </p>
            )}
          </div>
        </div>
      </SectionContainer>

      <SectionContainer title={localized("भुगतान प्रमाण इतिहास", "Payment proof history")} variant="card">
        {details.paymentProofs.length === 0 ? (
          <p className="text-sm leading-7 text-brown-700">
            {localized("अभी कोई भुगतान प्रमाण जमा नहीं है।", "No payment proof has been submitted yet.")}
          </p>
        ) : (
          <div className="grid gap-3">
            {details.paymentProofs.map((proof) => (
              <article className="rounded-lg border border-maroon-700/10 bg-cream-50 p-4" key={proof.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="break-words font-bold text-maroon-900">
                    {proof.originalFilename ?? proof.id}
                  </h3>
                  <StatusBadge status={proof.proofStatus === "verified" ? "verified" : proof.proofStatus === "rejected" ? "rejected" : "pending_verification"} type="payment" />
                </div>
                <p className="mt-2 text-sm leading-7 text-brown-700">
                  {localized("जमा", "Submitted")}: {formatPublicDate(proof.submittedAt, { includeTime: true })}
                </p>
              </article>
            ))}
          </div>
        )}
      </SectionContainer>

      <SectionContainer title={localized("प्रशासनिक कार्रवाई", "Administrative actions")} variant="card">
        <AdministrativeActionGuide />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <SecondaryButton onClick={() => void runAction("mark_under_review")}>{localized("समीक्षा में मार्क करें", "Mark under review")}</SecondaryButton>
          <SecondaryButton onClick={() => void runAction("verify_payment")}>{localized("भुगतान सत्यापित करें", "Verify payment")}</SecondaryButton>
          <OutlineButton
            onClick={() => {
              const reason = window.prompt(localized(
                "भुगतान अस्वीकृति का सार्वजनिक कारण लिखें।",
                "Write the public reason for payment rejection."
              ));
              if (reason) void runAction("reject_payment", reason);
            }}
          >
            {localized("भुगतान अस्वीकार करें", "Reject payment")}
          </OutlineButton>
          <PrimaryButton onClick={() => void runAction("approve_registration")}>{localized("पंजीकरण स्वीकृत करें", "Approve registration")}</PrimaryButton>
          <OutlineButton
            onClick={() => {
              const reason = window.prompt(localized(
                "पंजीकरण अस्वीकृति का सार्वजनिक कारण लिखें।",
                "Write the public reason for registration rejection."
              ));
              if (reason) void runAction("reject_registration", reason);
            }}
          >
            {localized("पंजीकरण अस्वीकार करें", "Reject registration")}
          </OutlineButton>
          <OutlineButton onClick={() => void runAction("enable_payment_resubmission")}>
            {localized("भुगतान पुनः जमा सक्षम करें", "Enable payment resubmission")}
          </OutlineButton>
          <OutlineButton
            onClick={() => {
              if (window.confirm(localized(
                "क्या आप इस रिकॉर्ड को संग्रहित करना चाहते हैं?",
                "Do you want to archive this record?"
              ))) {
                void runAction("archive_registration");
              }
            }}
          >
            {localized("संग्रहित करें", "Archive")}
          </OutlineButton>
        </div>
      </SectionContainer>

      <SectionContainer title={localized("आंतरिक प्रशासनिक टिप्पणी", "Internal administrative note")} variant="card">
        <label className="block text-sm font-semibold text-brown-800" htmlFor="admin-notes">
          {localized("प्रशासनिक टिप्पणी", "Administrative note")}
        </label>
        <textarea
          className="focus-ring mt-2 min-h-36 w-full rounded-md border border-maroon-700/20 bg-cream-50 px-3 py-2 leading-7 text-brown-900"
          id="admin-notes"
          maxLength={5000}
          onChange={(event) => setNotes(event.currentTarget.value)}
          value={notes}
        />
        <div className="mt-4">
          <PrimaryButton onClick={() => void saveNotes()}>{localized("टिप्पणी सहेजें", "Save note")}</PrimaryButton>
        </div>
      </SectionContainer>
    </div>
  );
}
