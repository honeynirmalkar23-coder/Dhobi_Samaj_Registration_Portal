import { useEffect, useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2, Upload } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { OutlineButton, SecondaryButton } from "../../../components/common/Button";
import { fileUploadLimits } from "../../../config/file-upload.config";
import { useLanguage } from "../../language/LanguageContext";
import { cn } from "../../../lib/cn";
import type { PaymentProofFormInputValues } from "../types/payment.types";
import {
  formatPaymentProofFileSize,
  getPaymentProofValidationError,
  paymentProofFieldIds
} from "../utilities/payment-file.utils";

export function PaymentProofField() {
  const { localized } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const {
    clearErrors,
    formState: { errors },
    setError,
    setValue
  } = useFormContext<PaymentProofFormInputValues>();
  const paymentScreenshot = useWatch<PaymentProofFormInputValues>({
    name: "paymentScreenshot"
  }) as File | null;

  useEffect(() => {
    if (!paymentScreenshot) {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(paymentScreenshot);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [paymentScreenshot]);

  const clearInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const selectScreenshot = (file: File | null) => {
    const validationError = getPaymentProofValidationError(file);

    if (validationError) {
      setError("paymentScreenshot", {
        type: "manual",
        message: validationError
      });
      clearInput();
      return;
    }

    setValue("paymentScreenshot", file, {
      shouldDirty: true,
      shouldValidate: true
    });
    clearErrors("paymentScreenshot");
  };

  const removeScreenshot = () => {
    setValue("paymentScreenshot", null, {
      shouldDirty: true,
      shouldValidate: true
    });
    setError("paymentScreenshot", {
      type: "manual",
      message: localized("कृपया भुगतान स्क्रीनशॉट चुनें।", "Please choose a payment screenshot.")
    });
    clearInput();
  };

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
      <div className="mb-5 space-y-2">
        <h2 className="text-xl font-bold text-maroon-900">
          {localized("भुगतान स्क्रीनशॉट", "Payment screenshot")}
        </h2>
        <p className="text-sm leading-7 text-brown-700">
          {localized(
            "भुगतान करने के बाद साफ और पढ़ने योग्य स्क्रीनशॉट चुनें।",
            "After making payment, choose a clear and readable screenshot."
          )}
        </p>
      </div>

      <input
        aria-describedby={
          errors.paymentScreenshot
            ? `${paymentProofFieldIds.paymentScreenshot}-error`
            : undefined
        }
        aria-invalid={Boolean(errors.paymentScreenshot)}
        accept={fileUploadLimits.paymentProof.allowedMimeTypes.join(",")}
        className="sr-only"
        id={paymentProofFieldIds.paymentScreenshot}
        onChange={(event) => selectScreenshot(event.currentTarget.files?.[0] ?? null)}
        ref={inputRef}
        type="file"
      />

      {!paymentScreenshot || !previewUrl ? (
        <label
          className={cn(
            "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-saffron-500 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-maroon-700/25 bg-cream-50 px-4 py-8 text-center transition-colors hover:border-maroon-700 hover:bg-cream-100",
            errors.paymentScreenshot && "border-maroon-700 bg-maroon-50"
          )}
          htmlFor={paymentProofFieldIds.paymentScreenshot}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            selectScreenshot(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-saffron-100 text-maroon-800">
            <Upload aria-hidden="true" className="h-7 w-7" />
          </span>
          <span className="mt-4 text-base font-bold text-maroon-900">
            {localized("स्क्रीनशॉट चुनें", "Choose screenshot")}
          </span>
          <span className="mt-2 text-sm leading-7 text-brown-700">
            {localized(
              `JPG, JPEG, PNG या WebP. अधिकतम आकार ${fileUploadLimits.paymentProof.maxSizeMb} MB.`,
              `JPG, JPEG, PNG or WebP. Maximum size ${fileUploadLimits.paymentProof.maxSizeMb} MB.`
            )}
          </span>
          <span className="mt-1 text-sm leading-7 text-brown-700">
            {localized(
              "स्क्रीनशॉट में भुगतान ऐप का लेनदेन विवरण स्पष्ट दिखाई देना चाहिए।",
              "The transaction details from the payment app should be clearly visible in the screenshot."
            )}
          </span>
        </label>
      ) : (
        <div className="grid gap-5 overflow-hidden rounded-lg border border-maroon-700/10 bg-cream-50 p-4 xl:grid-cols-[12rem_minmax(0,1fr)]">
          <img
            alt={localized("चयनित भुगतान स्क्रीनशॉट का पूर्वावलोकन", "Selected payment screenshot preview")}
            className="mx-auto aspect-[3/4] w-full max-w-48 rounded-lg border border-maroon-700/10 bg-white object-cover xl:mx-0"
            src={previewUrl}
          />
          <div className="min-w-0 overflow-hidden">
            <p className="font-bold text-maroon-900">{localized("स्क्रीनशॉट चयनित", "Screenshot selected")}</p>
            <dl className="mt-3 space-y-2 text-sm leading-7 text-brown-700">
              <div>
                <dt className="font-semibold">{localized("फाइल नाम", "File name")}</dt>
                <dd className="break-words">{paymentScreenshot.name}</dd>
              </div>
              <div>
                <dt className="font-semibold">{localized("फाइल आकार", "File size")}</dt>
                <dd>{formatPaymentProofFileSize(paymentScreenshot.size)}</dd>
              </div>
              <div>
                <dt className="font-semibold">{localized("फाइल प्रकार", "File type")}</dt>
                <dd>{paymentScreenshot.type}</dd>
              </div>
            </dl>
            <div className="mt-5 grid gap-3">
              <SecondaryButton className="w-full min-w-0 px-4" onClick={() => inputRef.current?.click()}>
                <RefreshCw aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span className="min-w-0 leading-5">
                  {localized("स्क्रीनशॉट बदलें", "Change screenshot")}
                </span>
              </SecondaryButton>
              <OutlineButton className="w-full min-w-0 px-4" onClick={removeScreenshot}>
                <Trash2 aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span className="min-w-0 leading-5">
                  {localized("स्क्रीनशॉट हटाएं", "Remove screenshot")}
                </span>
              </OutlineButton>
            </div>
          </div>
        </div>
      )}

      {errors.paymentScreenshot?.message ? (
        <p
          className="mt-3 text-sm font-semibold leading-7 text-maroon-700"
          id={`${paymentProofFieldIds.paymentScreenshot}-error`}
          role="alert"
        >
          {errors.paymentScreenshot.message}
        </p>
      ) : null}
      <p className="mt-4 flex gap-2 text-sm leading-7 text-brown-700">
        <ImagePlus aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-communityGreen-700" />
        {localized(
          "फॉर्म जमा होने पर स्क्रीनशॉट सुरक्षित निजी स्टोरेज में अपलोड किया जाएगा।",
          "When the form is submitted, the screenshot will be uploaded to secure private storage."
        )}
      </p>
    </section>
  );
}
