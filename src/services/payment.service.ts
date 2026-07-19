import type { PaymentProofFormInputValues, PublicPaymentSettings } from "../features/payment/types/payment.types";
import { invokeEdgeFunction } from "./edge-functions.service";
import { serviceFailure, serviceSuccess } from "./api.types";
import type { ServiceResult } from "./api.types";
import { dataBackendMode } from "./backend/backend-mode";

export type PublicPaymentSettingsResult = PublicPaymentSettings & {
  updatedAt: string | null;
};

type PublicPaymentSettingsEdgeResult = {
  paymentEnabled: boolean;
  qrCodeSignedUrl: string | null;
  upiId: string | null;
  payeeName: string | null;
  amount: number | null;
  paymentTitle: string | null;
  instructions: string | null;
  publicContact: string | null;
  paymentDeadline: string | null;
  updatedAt: string | null;
};

export type SubmitPaymentProofResult = {
  registrationId: string;
  registrationStatus: "submitted";
  paymentStatus: "pending_verification";
  submittedAt: string;
  acknowledgementAvailable?: boolean;
  acknowledgementNumber?: string;
  acknowledgementDownloadUrl?: string;
};

export type AcknowledgementPdfResult = {
  blob: Blob;
  filename: string;
};

export function getPaymentAccessTokenStorageKey(registrationId: string): string {
  return `dhobi-payment-access:${registrationId}`;
}

export function storePaymentAccessToken(registrationId: string, token: string): void {
  sessionStorage.setItem(getPaymentAccessTokenStorageKey(registrationId), token);
}

export function getPaymentAccessToken(registrationId: string): string | null {
  return sessionStorage.getItem(getPaymentAccessTokenStorageKey(registrationId));
}

export function removePaymentAccessToken(registrationId: string): void {
  sessionStorage.removeItem(getPaymentAccessTokenStorageKey(registrationId));
}

export function getAcknowledgementFilename(registrationId: string): string {
  return `Acknowledgement_${registrationId}.pdf`;
}

function isLocalPortalAcknowledgementUrl(downloadUrl: string): boolean {
  try {
    return new URL(downloadUrl, window.location.origin).pathname.startsWith("/api/local-portal/acknowledgements/");
  } catch {
    return downloadUrl.startsWith("/api/local-portal/acknowledgements/");
  }
}

function createAcknowledgementDownloadRequest(params: {
  downloadUrl: string;
  paymentAccessToken: string;
}): RequestInit {
  if (isLocalPortalAcknowledgementUrl(params.downloadUrl)) {
    return {
      credentials: "include",
      headers: {
        "X-Payment-Access-Token": params.paymentAccessToken
      }
    };
  }

  return {
    credentials: "omit"
  };
}

export async function getPublicPaymentSettings(): Promise<ServiceResult<PublicPaymentSettingsResult>> {
  if (dataBackendMode === "local-dev") {
    const { getLocalPublicPaymentSettings } = await import("./backend/local-portal.client");

    return getLocalPublicPaymentSettings();
  }

  return getSupabasePublicPaymentSettings();
}

async function getSupabasePublicPaymentSettings(): Promise<ServiceResult<PublicPaymentSettingsResult>> {
  const result = await invokeEdgeFunction<PublicPaymentSettingsEdgeResult>(
    "get-public-payment-settings",
    {}
  );

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: {
      paymentEnabled: result.data.paymentEnabled,
      qrCodeUrl: result.data.qrCodeSignedUrl,
      upiId: result.data.upiId,
      payeeName: result.data.payeeName,
      amount: result.data.amount,
      paymentTitle: result.data.paymentTitle,
      instructions: result.data.instructions,
      publicContact: result.data.publicContact,
      paymentDeadline: result.data.paymentDeadline,
      updatedAt: result.data.updatedAt
    }
  };
}

export async function submitPaymentProof(params: {
  registrationId: string;
  paymentAccessToken: string;
  values: PaymentProofFormInputValues;
}): Promise<ServiceResult<SubmitPaymentProofResult>> {
  if (dataBackendMode === "local-dev") {
    const { submitLocalPaymentProof } = await import("./backend/local-portal.client");

    return submitLocalPaymentProof(params);
  }

  return submitSupabasePaymentProof(params);
}

export async function downloadAcknowledgementPdf(params: {
  downloadUrl: string;
  registrationId: string;
  paymentAccessToken: string;
}): Promise<ServiceResult<AcknowledgementPdfResult>> {
  try {
    const requestOptions = createAcknowledgementDownloadRequest(params);

    console.log("DOWNLOAD URL", params.downloadUrl);
    console.log("FETCH OPTIONS", requestOptions);

    debugger;

    const response = await fetch(params.downloadUrl, requestOptions);

    console.log("FETCH RESPONSE", response);
    console.log("STATUS", response.status);
    console.log("CONTENT TYPE", response.headers.get("content-type"));

    if (!response.ok) {
      return serviceFailure("ACKNOWLEDGEMENT_DOWNLOAD_FAILED", "पावती डाउनलोड नहीं हो सकी।", response.status);
    }

    const contentType = response.headers.get("Content-Type") ?? response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("application/pdf")) {
      return serviceFailure("INVALID_ACKNOWLEDGEMENT_TYPE", "पावती PDF स्वरूप में उपलब्ध नहीं है।", response.status);
    }

    const blob = await response.blob();

    if (blob.size <= 0) {
      return serviceFailure("EMPTY_ACKNOWLEDGEMENT", "पावती PDF खाली है।", response.status);
    }

    return serviceSuccess({
      blob,
      filename: getAcknowledgementFilename(params.registrationId)
    });
  } catch {
    return serviceFailure("ACKNOWLEDGEMENT_NETWORK_ERROR", "पावती डाउनलोड के दौरान नेटवर्क समस्या आई।");
  }
}

async function submitSupabasePaymentProof(params: {
  registrationId: string;
  paymentAccessToken: string;
  values: PaymentProofFormInputValues;
}): Promise<ServiceResult<SubmitPaymentProofResult>> {
  const formData = new FormData();

  formData.append("registrationId", params.registrationId);
  formData.append("paymentAccessToken", params.paymentAccessToken);
  formData.append("declarationAccepted", String(params.values.declarationAccepted));

  if (params.values.paymentScreenshot) {
    formData.append("paymentScreenshot", params.values.paymentScreenshot);
  }

  return invokeEdgeFunction<SubmitPaymentProofResult>("submit-payment-proof", formData);
}
