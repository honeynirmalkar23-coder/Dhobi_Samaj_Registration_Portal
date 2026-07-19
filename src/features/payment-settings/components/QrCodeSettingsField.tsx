import { useEffect, useRef, useState } from "react";
import { Expand, ImagePlus, RefreshCw, Trash2, Upload } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { OutlineButton, SecondaryButton } from "../../../components/common/Button";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { fileUploadLimits } from "../../../config/file-upload.config";
import { useLanguage } from "../../language/LanguageContext";
import { cn } from "../../../lib/cn";
import type { PaymentSettingsFormValues } from "../types/payment-settings.types";
import {
  formatQrCodeFileSize,
  getQrCodeValidationError
} from "../utilities/qr-code-file.utils";
import { paymentSettingsFieldIds } from "../utilities/payment-settings.utils";

type QrCodeSettingsFieldProps = {
  existingQrCodeUrl?: string | null;
  previewUrl: string | null;
};

export function QrCodeSettingsField({ existingQrCodeUrl = null, previewUrl }: QrCodeSettingsFieldProps) {
  const { localized } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const {
    clearErrors,
    formState: { errors },
    setError,
    setValue
  } = useFormContext<PaymentSettingsFormValues>();
  const paymentEnabled = useWatch<PaymentSettingsFormValues>({
    name: "paymentEnabled"
  }) as boolean;
  const qrCodeFile = useWatch<PaymentSettingsFormValues>({
    name: "qrCodeFile"
  }) as File | null;
  const existingQrCodePath = useWatch<PaymentSettingsFormValues>({
    name: "existingQrCodePath"
  }) as string;
  const qrError = errors.qrCodeFile?.message;
  const displayPreviewUrl = previewUrl ?? (existingQrCodePath ? existingQrCodeUrl : null);
  const hasDisplayQrCode = Boolean(qrCodeFile || displayPreviewUrl);

  useEffect(() => {
    if (!qrCodeFile && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [qrCodeFile]);

  const clearInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const selectQrCode = (file: File | null) => {
    const validationError = getQrCodeValidationError(file, paymentEnabled);

    if (validationError) {
      setError("qrCodeFile", {
        type: "manual",
        message: validationError
      });
      clearInput();
      return;
    }

    setValue("qrCodeFile", file, {
      shouldDirty: true,
      shouldValidate: true
    });
    clearErrors("qrCodeFile");
  };

  const removeQrCode = () => {
    clearErrors("qrCodeFile");
    setValue("qrCodeFile", null, {
      shouldDirty: true,
      shouldValidate: true
    });
    setValue("existingQrCodePath", "", {
      shouldDirty: true,
      shouldValidate: true
    });
    clearInput();
  };

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
      <div className="mb-5 space-y-2">
        <h2 className="text-xl font-bold text-maroon-900">
          {localized("भुगतान QR कोड", "Payment QR code")}
        </h2>
        <p className="text-sm leading-7 text-brown-700">
          {localized(
            "प्रशासन द्वारा सत्यापित भुगतान QR कोड चुनें।",
            "Choose the payment QR code verified by the administration."
          )}
        </p>
      </div>

      <input
        aria-label={localized("QR कोड इमेज", "QR code image")}
        aria-describedby={
          qrError
            ? `${paymentSettingsFieldIds.qrCodeFile}-hint ${paymentSettingsFieldIds.qrCodeFile}-error`
            : `${paymentSettingsFieldIds.qrCodeFile}-hint`
        }
        aria-invalid={Boolean(qrError)}
        accept={fileUploadLimits.paymentQr.allowedMimeTypes.join(",")}
        className="sr-only"
        id={paymentSettingsFieldIds.qrCodeFile}
        onChange={(event) => selectQrCode(event.currentTarget.files?.[0] ?? null)}
        ref={inputRef}
        type="file"
      />
      <p className="sr-only" id={`${paymentSettingsFieldIds.qrCodeFile}-hint`}>
        {localized(
          `JPG, JPEG, PNG या WebP — अधिकतम ${fileUploadLimits.paymentQr.maxSizeMb} MB`,
          `JPG, JPEG, PNG or WebP — maximum ${fileUploadLimits.paymentQr.maxSizeMb} MB`
        )}
      </p>

      {!hasDisplayQrCode ? (
        <label
          className={cn(
            "focus-ring flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-maroon-700/25 bg-cream-50 px-4 py-8 text-center transition-colors hover:border-maroon-700 hover:bg-cream-100",
            qrError && "border-maroon-700 bg-maroon-50"
          )}
          htmlFor={paymentSettingsFieldIds.qrCodeFile}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            selectQrCode(event.dataTransfer.files?.[0] ?? null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-saffron-100 text-maroon-800">
            <Upload aria-hidden="true" className="h-7 w-7" />
          </span>
          <span className="mt-4 text-base font-bold text-maroon-900">
            {localized("QR कोड इमेज चुनें", "Choose QR code image")}
          </span>
          <span className="mt-2 text-sm leading-7 text-brown-700">
            {localized(
              `JPG, JPEG, PNG या WebP — अधिकतम ${fileUploadLimits.paymentQr.maxSizeMb} MB`,
              `JPG, JPEG, PNG or WebP — maximum ${fileUploadLimits.paymentQr.maxSizeMb} MB`
            )}
          </span>
          <span className="mt-1 text-sm leading-7 text-brown-700">
            {localized(
              "स्पष्ट, सीधा और बिना कटे हुए QR कोड की इमेज चुनें।",
              "Choose a clear, straight and uncropped QR code image."
            )}
          </span>
        </label>
      ) : (
        <div className="grid gap-5 rounded-lg border border-maroon-700/10 bg-cream-50 p-4 md:grid-cols-[14rem_minmax(0,1fr)]">
          <div className="rounded-lg border border-maroon-700/10 bg-white p-3">
            <img
              alt={localized("चयनित भुगतान QR कोड का पूर्वावलोकन", "Selected payment QR code preview")}
              className="aspect-square w-full object-contain"
              src={displayPreviewUrl ?? ""}
            />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-maroon-900">
              {localized("QR कोड चयनित", "QR code selected")}
            </p>
            <dl className="mt-3 space-y-2 text-sm leading-7 text-brown-700">
              <div>
                <dt className="font-semibold">{localized("फाइल नाम", "File name")}</dt>
                <dd className="break-words">{qrCodeFile?.name ?? localized("मौजूदा QR कोड", "Existing QR code")}</dd>
              </div>
              <div>
                <dt className="font-semibold">{localized("फाइल प्रकार", "File type")}</dt>
                <dd>{qrCodeFile?.type ?? localized("सुरक्षित स्टोरेज इमेज", "Secure storage image")}</dd>
              </div>
              <div>
                <dt className="font-semibold">{localized("फाइल आकार", "File size")}</dt>
                <dd>{qrCodeFile ? formatQrCodeFileSize(qrCodeFile.size) : localized("पहले से सहेजा गया", "Already saved")}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <SecondaryButton onClick={() => inputRef.current?.click()}>
                <RefreshCw aria-hidden="true" className="h-5 w-5" />
                {localized("QR कोड बदलें", "Change QR code")}
              </SecondaryButton>
              <OutlineButton onClick={removeQrCode}>
                <Trash2 aria-hidden="true" className="h-5 w-5" />
                {localized("QR कोड हटाएं", "Delete QR code")}
              </OutlineButton>
              <OutlineButton onClick={() => setIsPreviewOpen(true)}>
                <Expand aria-hidden="true" className="h-5 w-5" />
                {localized("बड़ा पूर्वावलोकन देखें", "View larger preview")}
              </OutlineButton>
            </div>
          </div>
        </div>
      )}

      {qrError ? (
        <p
          className="mt-3 text-sm font-semibold leading-7 text-maroon-700"
          id={`${paymentSettingsFieldIds.qrCodeFile}-error`}
          role="alert"
        >
          {qrError}
        </p>
      ) : null}

      <p className="mt-4 flex gap-2 text-sm leading-7 text-brown-700">
        <ImagePlus aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-communityGreen-700" />
        {localized(
          "सहेजने पर QR कोड सुरक्षित निजी स्टोरेज में रखा जाएगा।",
          "Once saved, the QR code will be kept in secure private storage."
        )}
      </p>

      <ConfirmDialog
        confirmLabel={localized("ठीक है", "OK")}
        description={localized(
          "यह केवल चुनी गई QR इमेज का बड़ा पूर्वावलोकन है।",
          "This is only a larger preview of the selected QR image."
        )}
        isOpen={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        onConfirm={() => setIsPreviewOpen(false)}
        showCancel={false}
        title={localized("QR कोड पूर्वावलोकन", "QR code preview")}
      >
        {displayPreviewUrl ? (
          <img
            alt={localized("चयनित भुगतान QR कोड का पूर्वावलोकन", "Selected payment QR code preview")}
            className="mx-auto max-h-[65vh] w-full object-contain"
            src={displayPreviewUrl}
          />
        ) : null}
      </ConfirmDialog>
    </section>
  );
}
