// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { IncomingMessage, ServerResponse } from "node:http";
import {
  handleAdminAuditLogs,
  handleAdminDashboardMetrics,
  handleAdminNotesUpdate,
  handleAdminRegistrationAction,
  handleAdminRegistrationDetails,
  handleAdminRegistrationList
} from "./local-portal.admin-data";
import { getLocalAdminIdentity } from "./local-portal.admin";
import { serveStoredUpload } from "./local-portal.files";
import { handleAcknowledgementPdf } from "./local-portal.pdf";
import {
  handleAdminPaymentSettingsGet,
  handleAdminPaymentSettingsPut,
  handlePublicPaymentSettingsGet
} from "./local-portal.payment-settings";
import { handlePaymentProofSubmit } from "./local-portal.payment-proof";
import { getRateLimitMessage, isRateLimited } from "./local-portal.rate-limit";
import { handleRegistrationCreate } from "./local-portal.registration";
import { writeFailure, writeNotFound } from "./local-portal.responses";
import { handlePublicStatusLookup } from "./local-portal.status";
import { verifySignedPortalToken } from "./local-portal.tokens";
import type { LocalPortalContext } from "./local-portal.types";

export const localPortalEndpointPrefix = "/api/local-portal";

type Middleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void
) => void;

function getRegistrationRouteId(pathname: string, suffix = ""): string | null {
  const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = pathname.match(new RegExp(`^/api/local-portal/admin/registrations/(DS-\\d{4}-\\d{6})${escapedSuffix}$`));

  return match?.[1] ?? null;
}

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

function createConfigurationFailure(context: LocalPortalContext, response: ServerResponse): void {
  writeFailure(
    response,
    503,
    "CONFIGURATION_REQUIRED",
    context.config.state === "missing_signing_secret"
      ? "स्थानीय backend signing secret कॉन्फ़िगर करें।"
      : "स्थानीय backend कॉन्फ़िगरेशन अपूर्ण है।"
  );
}

function enforceRateLimit(params: {
  request: IncomingMessage;
  response: ServerResponse;
  bucket: string;
  max: number;
  windowMs: number;
  subject?: string;
}): boolean {
  if (!isRateLimited(params)) {
    return true;
  }

  writeFailure(params.response, 429, "RATE_LIMITED", getRateLimitMessage());
  return false;
}

function handleFileRequest(params: {
  request: IncomingMessage;
  response: ServerResponse;
  url: URL;
  context: LocalPortalContext;
}): void {
  const { config } = params.context;

  if (params.request.method !== "GET") {
    writeFailure(params.response, 405, "VALIDATION_ERROR", "यह HTTP method समर्थित नहीं है।");
    return;
  }

  if (config.state !== "configured") {
    createConfigurationFailure(params.context, params.response);
    return;
  }

  const qrPayload = verifySignedPortalToken(params.url.searchParams.get("token"), config.signingSecret, "qr");

  if (qrPayload?.path) {
    serveStoredUpload({
      config,
      relativePath: qrPayload.path,
      response: params.response
    });
    return;
  }

  const adminPayload = verifySignedPortalToken(params.url.searchParams.get("token"), config.signingSecret, "admin-file");

  if (!adminPayload?.path) {
    writeFailure(params.response, 403, "FORBIDDEN", "फाइल लिंक मान्य नहीं है।");
    return;
  }

  if (!getLocalAdminIdentity(params.request, config)) {
    writeFailure(params.response, 401, "UNAUTHORIZED", "प्रशासन सत्र उपलब्ध नहीं है।");
    return;
  }

  serveStoredUpload({
    config,
    relativePath: adminPayload.path,
    response: params.response
  });
}

export function createLocalPortalBackendMiddleware(context: LocalPortalContext): Middleware {
  return (request, response, next) => {
    const url = new URL(request.url ?? "/", "http://local-dev.invalid");
    const pathname = normalizePath(url.pathname);

    if (!pathname.startsWith(localPortalEndpointPrefix)) {
      next();
      return;
    }

    if (context.config.state !== "configured" || !context.db) {
      createConfigurationFailure(context, response);
      return;
    }

    const config = context.config;
    const db = context.db;

    const run = async () => {
      if (pathname === `${localPortalEndpointPrefix}/admin/payment-settings`) {
        if (request.method === "GET") {
          handleAdminPaymentSettingsGet({
            config,
            db,
            request,
            response
          });
          return;
        }

        await handleAdminPaymentSettingsPut({
          config,
          db,
          request,
          response
        });
        return;
      }

      if (pathname === `${localPortalEndpointPrefix}/public/payment-settings`) {
        if (!enforceRateLimit({
          bucket: "public-payment-settings",
          max: 120,
          request,
          response,
          windowMs: 60 * 60 * 1000
        })) {
          return;
        }

        handlePublicPaymentSettingsGet({
          config,
          db,
          request,
          response
        });
        return;
      }

      if (pathname === `${localPortalEndpointPrefix}/registration`) {
        if (!enforceRateLimit({
          bucket: "registration-create",
          max: 10,
          request,
          response,
          windowMs: 60 * 60 * 1000
        })) {
          return;
        }

        await handleRegistrationCreate({
          config,
          db,
          request,
          response
        });
        return;
      }

      if (pathname === `${localPortalEndpointPrefix}/payment-proof`) {
        if (!enforceRateLimit({
          bucket: "payment-proof",
          max: 20,
          request,
          response,
          windowMs: 60 * 60 * 1000
        })) {
          return;
        }

        await handlePaymentProofSubmit({
          config,
          db,
          request,
          response
        });
        return;
      }

      if (pathname === `${localPortalEndpointPrefix}/status`) {
        if (!enforceRateLimit({
          bucket: "status-lookup",
          max: 60,
          request,
          response,
          windowMs: 60 * 60 * 1000
        })) {
          return;
        }

        await handlePublicStatusLookup({
          db,
          request,
          response
        });
        return;
      }

      if (pathname.startsWith(`${localPortalEndpointPrefix}/acknowledgements/`)) {
        if (!enforceRateLimit({
          bucket: "pdf-download",
          max: 30,
          request,
          response,
          windowMs: 60 * 60 * 1000
        })) {
          return;
        }

        handleAcknowledgementPdf({
          config,
          db,
          request,
          response,
          url
        });
        return;
      }

      if (pathname === `${localPortalEndpointPrefix}/files`) {
        handleFileRequest({
          context,
          request,
          response,
          url
        });
        return;
      }

      if (pathname === `${localPortalEndpointPrefix}/admin/dashboard/metrics`) {
        handleAdminDashboardMetrics({
          config,
          db,
          request,
          response
        });
        return;
      }

      if (pathname === `${localPortalEndpointPrefix}/admin/registrations`) {
        handleAdminRegistrationList({
          config,
          db,
          request,
          response,
          url
        });
        return;
      }

      const actionRegistrationId = getRegistrationRouteId(pathname, "/action");

      if (actionRegistrationId) {
        await handleAdminRegistrationAction({
          config,
          db,
          registrationId: actionRegistrationId,
          request,
          response
        });
        return;
      }

      const notesRegistrationId = getRegistrationRouteId(pathname, "/notes");

      if (notesRegistrationId) {
        await handleAdminNotesUpdate({
          config,
          db,
          registrationId: notesRegistrationId,
          request,
          response
        });
        return;
      }

      const detailsRegistrationId = getRegistrationRouteId(pathname);

      if (detailsRegistrationId) {
        handleAdminRegistrationDetails({
          config,
          db,
          registrationId: detailsRegistrationId,
          request,
          response
        });
        return;
      }

      if (pathname === `${localPortalEndpointPrefix}/admin/audit-logs`) {
        handleAdminAuditLogs({
          config,
          db,
          request,
          response,
          url
        });
        return;
      }

      writeNotFound(response);
    };

    void run().catch(() => {
      if (!response.headersSent) {
        writeFailure(response, 500, "INTERNAL_ERROR", "स्थानीय विकास backend में समस्या हुई।");
      }
    });
  };
}

export function createLocalPortalNotFoundMiddleware(): Middleware {
  return (request, response, next) => {
    const url = new URL(request.url ?? "/", "http://local-dev.invalid");

    if (!url.pathname.startsWith(localPortalEndpointPrefix)) {
      next();
      return;
    }

    writeNotFound(response);
  };
}
