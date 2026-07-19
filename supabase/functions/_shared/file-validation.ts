import { ApiError } from "./errors.ts";

type SupportedImageMimeType = "image/jpeg" | "image/png" | "image/webp";

const extensionByMimeType: Record<SupportedImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

function isSupportedImageMimeType(value: string): value is SupportedImageMimeType {
  return value === "image/jpeg" || value === "image/png" || value === "image/webp";
}

function hasValidMagicBytes(bytes: Uint8Array, mimeType: SupportedImageMimeType): boolean {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

export type ValidatedImageFile = {
  file: File;
  mimeType: SupportedImageMimeType;
  extension: string;
  sizeBytes: number;
};

export async function validateImageFile(
  value: FormDataEntryValue | null,
  maxSizeBytes: number
): Promise<ValidatedImageFile> {
  if (!(value instanceof File)) {
    throw new ApiError("INVALID_FILE", 400, "कृपया मान्य इमेज फाइल चुनें।");
  }

  if (value.size <= 0) {
    throw new ApiError("INVALID_FILE", 400, "चयनित फाइल खाली या अमान्य है।");
  }

  if (value.size > maxSizeBytes) {
    throw new ApiError("FILE_TOO_LARGE", 413);
  }

  if (!isSupportedImageMimeType(value.type)) {
    throw new ApiError("INVALID_FILE", 400, "केवल JPG, JPEG, PNG या WebP इमेज स्वीकार की जाती है।");
  }

  const bytes = new Uint8Array(await value.slice(0, 16).arrayBuffer());

  if (!hasValidMagicBytes(bytes, value.type)) {
    throw new ApiError("INVALID_FILE", 400, "चयनित फाइल का प्रकार मान्य इमेज से मेल नहीं खाता।");
  }

  return {
    file: value,
    mimeType: value.type,
    extension: extensionByMimeType[value.type],
    sizeBytes: value.size
  };
}
