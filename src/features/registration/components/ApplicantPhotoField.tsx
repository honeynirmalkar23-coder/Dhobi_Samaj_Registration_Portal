import { useEffect, useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2, Upload } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { OutlineButton, SecondaryButton } from "../../../components/common/Button";
import { fileUploadLimits } from "../../../config/file-upload.config";
import { useLanguage } from "../../language/LanguageContext";
import { cn } from "../../../lib/cn";
import type { RegistrationFormInputValues } from "../types/registration-form.types";
import {
  formatFileSize,
  getPhotoValidationError,
  registrationFieldIds
} from "../utilities/registration-form.utils";
import { RegistrationSection } from "./RegistrationSection";

export function ApplicantPhotoField() {
  const { localized } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const {
    clearErrors,
    formState: { errors },
    setError,
    setValue
  } = useFormContext<RegistrationFormInputValues>();
  const applicantPhoto = useWatch<RegistrationFormInputValues>({
    name: "applicantPhoto"
  }) as File | null;

  useEffect(() => {
    if (!applicantPhoto) {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(applicantPhoto);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [applicantPhoto]);

  const clearInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const selectPhoto = (file: File | null) => {
    const validationError = getPhotoValidationError(file);

    if (validationError) {
      setError("applicantPhoto", {
        type: "manual",
        message: validationError
      });
      clearInput();
      return;
    }

    setValue("applicantPhoto", file, {
      shouldDirty: true,
      shouldValidate: true
    });
    clearErrors("applicantPhoto");
  };

  const removePhoto = () => {
    setValue("applicantPhoto", null, {
      shouldDirty: true,
      shouldValidate: true
    });
    setError("applicantPhoto", {
      type: "manual",
      message: localized("कृपया सदस्य का फोटो चुनें।", "Please choose the member photo.")
    });
    clearInput();
  };

  return (
    <RegistrationSection
      description={localized("फोटो चुनें।", "Choose a photo.")}
      title={localized("फोटो", "Photo")}
    >
      <input
        accept={fileUploadLimits.memberPhoto.allowedMimeTypes.join(",")}
        className="sr-only"
        id={registrationFieldIds.applicantPhoto}
        onChange={(event) => selectPhoto(event.currentTarget.files?.[0] ?? null)}
        ref={inputRef}
        type="file"
      />

      {!applicantPhoto || !previewUrl ? (
        <label
          className={cn(
            "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-saffron-500 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-maroon-700/25 bg-cream-50 px-4 py-8 text-center transition-colors hover:border-maroon-700 hover:bg-cream-100",
            errors.applicantPhoto && "border-maroon-700 bg-maroon-50"
          )}
          htmlFor={registrationFieldIds.applicantPhoto}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            selectPhoto(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-saffron-100 text-maroon-800">
            <Upload aria-hidden="true" className="h-7 w-7" />
          </span>
          <span className="mt-4 text-base font-bold text-maroon-900">
            {localized("फोटो चुनें", "Choose photo")}
          </span>
          <span className="mt-2 text-sm leading-7 text-brown-700">
            {localized(
              `JPG, JPEG, PNG या WebP. अधिकतम आकार ${fileUploadLimits.memberPhoto.maxSizeMb} MB.`,
              `JPG, JPEG, PNG or WebP. Maximum size ${fileUploadLimits.memberPhoto.maxSizeMb} MB.`
            )}
          </span>
          <span className="mt-1 text-sm leading-7 text-brown-700">
            {localized(
              "साफ, सामने से लिया गया और अच्छी रोशनी वाला फोटो चुनें।",
              "Choose a clear, front-facing photo with good lighting."
            )}
          </span>
        </label>
      ) : (
        <div className="grid gap-5 rounded-lg border border-maroon-700/10 bg-cream-50 p-4 md:grid-cols-[10rem_minmax(0,1fr)]">
            <img
            alt={localized("चयनित सदस्य फोटो का पूर्वावलोकन", "Selected member photo preview")}
            className="aspect-square w-full rounded-lg border border-maroon-700/10 bg-white object-cover"
            src={previewUrl}
          />
          <div className="min-w-0">
            <p className="font-bold text-maroon-900">{localized("फोटो चयनित", "Photo selected")}</p>
            <dl className="mt-3 space-y-2 text-sm leading-7 text-brown-700">
              <div>
                <dt className="font-semibold">{localized("फाइल नाम", "File name")}</dt>
                <dd className="break-words">{applicantPhoto.name}</dd>
              </div>
              <div>
                <dt className="font-semibold">{localized("फाइल आकार", "File size")}</dt>
                <dd>{formatFileSize(applicantPhoto.size)}</dd>
              </div>
              <div>
                <dt className="font-semibold">{localized("फाइल प्रकार", "File type")}</dt>
                <dd>{applicantPhoto.type}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <SecondaryButton onClick={() => inputRef.current?.click()}>
                <RefreshCw aria-hidden="true" className="h-5 w-5" />
                {localized("फोटो बदलें", "Change photo")}
              </SecondaryButton>
              <OutlineButton onClick={removePhoto}>
                <Trash2 aria-hidden="true" className="h-5 w-5" />
                {localized("फोटो हटाएं", "Remove photo")}
              </OutlineButton>
            </div>
          </div>
        </div>
      )}

      {errors.applicantPhoto?.message ? (
        <p
          className="mt-3 text-sm font-semibold leading-7 text-maroon-700"
          id={`${registrationFieldIds.applicantPhoto}-error`}
          role="alert"
        >
          {errors.applicantPhoto.message}
        </p>
      ) : null}
      <p className="mt-4 flex gap-2 text-sm leading-7 text-brown-700">
        <ImagePlus aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-communityGreen-700" />
        {localized(
          "फॉर्म जमा होने पर फोटो सुरक्षित निजी स्टोरेज में अपलोड किया जाएगा।",
          "When the form is submitted, the photo will be uploaded to secure private storage."
        )}
      </p>
    </RegistrationSection>
  );
}
