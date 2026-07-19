// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { IncomingMessage, ServerResponse } from "node:http";
import { getLocalAdminSessionToken, verifyLocalAdminSessionToken } from "../local-admin-auth/local-admin-session";
import { hasJsonContentType, hasMultipartContentType, hasRequestedWithHeader, writeFailure } from "./local-portal.responses";
import {
  isRequestFromAllowedDevelopmentHost,
  isValidStateChangingOrigin
} from "./local-portal.origin";
import type { LocalAdminIdentity, LocalPortalConfig } from "./local-portal.types";

export function getLocalAdminIdentity(
  request: IncomingMessage,
  config: LocalPortalConfig
): LocalAdminIdentity | null {
  if (config.state !== "configured" || !config.adminSessionSecret) {
    return null;
  }

  const token = getLocalAdminSessionToken(request);
  const user = verifyLocalAdminSessionToken(token, config.adminSessionSecret);

  return user;
}

export function requireLocalAdmin(
  request: IncomingMessage,
  response: ServerResponse,
  config: LocalPortalConfig
): LocalAdminIdentity | null {
  if (!isRequestFromAllowedDevelopmentHost(request, config.allowLan)) {
    writeFailure(response, 403, "FORBIDDEN", "अनुमत स्थानीय विकास host से अनुरोध भेजें।");
    return null;
  }

  const user = getLocalAdminIdentity(request, config);

  if (!user) {
    writeFailure(response, 401, "UNAUTHORIZED", "प्रशासन सत्र उपलब्ध नहीं है।");
    return null;
  }

  return user;
}

export function validateAdminStateChangingRequest(params: {
  request: IncomingMessage;
  response: ServerResponse;
  config: LocalPortalConfig;
  contentType: "json" | "multipart";
}): boolean {
  if (!isValidStateChangingOrigin(params.request, params.config.allowLan)) {
    writeFailure(params.response, 403, "FORBIDDEN", "अनुरोध origin मान्य नहीं है।");
    return false;
  }

  if (!hasRequestedWithHeader(params.request)) {
    writeFailure(params.response, 400, "VALIDATION_ERROR", "अनुरोध header मान्य नहीं है।");
    return false;
  }

  const hasExpectedContentType =
    params.contentType === "json"
      ? hasJsonContentType(params.request)
      : hasMultipartContentType(params.request);

  if (!hasExpectedContentType) {
    writeFailure(params.response, 415, "VALIDATION_ERROR", "अनुरोध content type समर्थित नहीं है।");
    return false;
  }

  return true;
}

