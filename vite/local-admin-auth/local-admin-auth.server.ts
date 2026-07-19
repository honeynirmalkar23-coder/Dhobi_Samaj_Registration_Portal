// SERVER-SIDE DEVELOPMENT CODE ONLY

import bcrypt from "bcryptjs";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { LocalAdminAuthConfig, LocalAdminAuthMiddleware, LocalAdminUser } from "./local-admin-auth.types";
import {
  clearLocalAdminFailedLogins,
  isLocalAdminLoginRateLimited,
  recordLocalAdminFailedLogin
} from "./local-admin-rate-limit";
import {
  createLocalAdminSessionToken,
  getLocalAdminSessionToken,
  serializeLocalAdminSessionClearCookie,
  serializeLocalAdminSessionCookie,
  verifyLocalAdminSessionToken
} from "./local-admin-session";
import {
  isRequestFromAllowedDevelopmentHost,
  isValidStateChangingOrigin
} from "./local-admin-origin";

const endpointPrefix = "/api/dev-admin-auth";
const maxBodyBytes = 8 * 1024;
const minimumDisplayNameLength = 2;
const maximumDisplayNameLength = 80;
const minimumPasswordLength = 10;
const genericCredentialMessage = "ईमेल या पासवर्ड सही नहीं है।";
const rateLimitMessage = "बहुत अधिक लॉगिन प्रयास किए गए हैं। कृपया कुछ समय बाद पुनः प्रयास करें।";
const invalidProfileMessage = "प्रशासन प्रोफाइल जानकारी मान्य नहीं है।";
const invalidCurrentPasswordMessage = "वर्तमान पासवर्ड सही नहीं है।";

type ConfiguredLocalAdminAuthConfig = Extract<LocalAdminAuthConfig, { state: "configured" }>;

type JsonResponse =
  | {
      success: true;
      data?: unknown;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        missingVariables?: string[];
      };
    };

function isHttpsRequest(request: IncomingMessage): boolean {
  return Boolean((request.socket as { encrypted?: boolean }).encrypted);
}

function writeJson(response: ServerResponse, statusCode: number, body: JsonResponse): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function writeNotFound(response: ServerResponse): void {
  response.statusCode = 404;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.end("Not Found");
}

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeDisplayName(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidDisplayName(value: string): boolean {
  return value.length >= minimumDisplayNameLength && value.length <= maximumDisplayNameLength;
}

function createLocalAdminUser(config: ConfiguredLocalAdminAuthConfig): LocalAdminUser {
  return {
    authenticationMode: "local-dev",
    ...(config.adminName ? { displayName: config.adminName } : {}),
    email: config.adminEmail,
    role: "admin"
  };
}

function createAuthenticatedSessionResponse(user: LocalAdminUser) {
  return {
    authenticated: true,
    user
  };
}

function createUnauthenticatedSessionResponse(config: LocalAdminAuthConfig) {
  return {
    authenticated: false,
    configurationState: config.state,
    missingVariables: config.state === "configured" ? [] : config.missingVariables,
    user: null
  };
}

function hasJsonContentType(request: IncomingMessage): boolean {
  const contentType = request.headers["content-type"];
  const normalizedContentType = Array.isArray(contentType) ? contentType[0] : contentType;

  return Boolean(normalizedContentType?.toLowerCase().startsWith("application/json"));
}

function hasRequestedWithHeader(request: IncomingMessage): boolean {
  const requestedWith = request.headers["x-requested-with"];
  const normalizedRequestedWith = Array.isArray(requestedWith) ? requestedWith[0] : requestedWith;

  return normalizedRequestedWith === "XMLHttpRequest";
}

function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      size += Buffer.byteLength(chunk);

      if (size > maxBodyBytes) {
        reject(new Error("REQUEST_BODY_TOO_LARGE"));
        request.destroy();
        return;
      }

      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("INVALID_JSON"));
      }
    });
    request.on("error", reject);
  });
}

function validatePostRequest(request: IncomingMessage, response: ServerResponse, config: LocalAdminAuthConfig): boolean {
  if (!isRequestFromAllowedDevelopmentHost(request, config.allowLan) || !isValidStateChangingOrigin(request, config.allowLan)) {
    writeJson(response, 403, {
      error: {
        code: "INVALID_ORIGIN",
        message: "अनुमत स्थानीय विकास origin से अनुरोध भेजें।"
      },
      success: false
    });
    return false;
  }

  if (!hasRequestedWithHeader(request)) {
    writeJson(response, 400, {
      error: {
        code: "MISSING_REQUEST_HEADER",
        message: "अनुरोध मान्य नहीं है।"
      },
      success: false
    });
    return false;
  }

  if (!hasJsonContentType(request)) {
    writeJson(response, 415, {
      error: {
        code: "UNSUPPORTED_CONTENT_TYPE",
        message: "केवल JSON अनुरोध स्वीकार किए जाते हैं।"
      },
      success: false
    });
    return false;
  }

  return true;
}

function clearSessionCookie(response: ServerResponse): void {
  response.setHeader("Set-Cookie", serializeLocalAdminSessionClearCookie());
}

function setSessionCookie(
  request: IncomingMessage,
  response: ServerResponse,
  config: ConfiguredLocalAdminAuthConfig,
  user: LocalAdminUser
): void {
  const token = createLocalAdminSessionToken({
    ...(user.displayName ? { displayName: user.displayName } : {}),
    email: user.email,
    secret: config.sessionSecret,
    ttlSeconds: config.sessionTtlSeconds
  });

  response.setHeader("Set-Cookie", serializeLocalAdminSessionCookie({
    maxAgeSeconds: config.sessionTtlSeconds,
    secure: isHttpsRequest(request),
    token
  }));
}

async function handleLogin(
  request: IncomingMessage,
  response: ServerResponse,
  config: LocalAdminAuthConfig
): Promise<void> {
  if (request.method !== "POST") {
    writeJson(response, 405, {
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "यह HTTP method समर्थित नहीं है।"
      },
      success: false
    });
    return;
  }

  if (!validatePostRequest(request, response, config)) {
    return;
  }

  if (config.state !== "configured") {
    writeJson(response, 503, {
      error: {
        code: "CONFIGURATION_REQUIRED",
        message: "स्थानीय विकास लॉगिन कॉन्फ़िगरेशन अपूर्ण है।",
        missingVariables: config.missingVariables
      },
      success: false
    });
    return;
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    writeJson(response, error instanceof Error && error.message === "REQUEST_BODY_TOO_LARGE" ? 413 : 400, {
      error: {
        code: error instanceof Error && error.message === "REQUEST_BODY_TOO_LARGE" ? "REQUEST_TOO_LARGE" : "INVALID_JSON",
        message: "लॉगिन अनुरोध मान्य नहीं है।"
      },
      success: false
    });
    return;
  }

  const bodyRecord = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const email = normalizeEmail(bodyRecord.email);
  const password = typeof bodyRecord.password === "string" ? bodyRecord.password : "";

  if (isLocalAdminLoginRateLimited(request, email)) {
    writeJson(response, 429, {
      error: {
        code: "RATE_LIMITED",
        message: rateLimitMessage
      },
      success: false
    });
    return;
  }

  const emailMatches = email === config.adminEmail;
  const passwordMatches = password ? await bcrypt.compare(password, config.passwordHash) : false;

  if (!emailMatches || !passwordMatches) {
    recordLocalAdminFailedLogin(request, email);
    writeJson(response, 401, {
      error: {
        code: "INVALID_CREDENTIALS",
        message: genericCredentialMessage
      },
      success: false
    });
    return;
  }

  clearLocalAdminFailedLogins(request, email);

  const user = createLocalAdminUser(config);
  setSessionCookie(request, response, config, user);
  writeJson(response, 200, {
    data: createAuthenticatedSessionResponse(user),
    success: true
  });
}

function handleSession(
  request: IncomingMessage,
  response: ServerResponse,
  config: LocalAdminAuthConfig
): void {
  if (request.method !== "GET") {
    writeJson(response, 405, {
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "यह HTTP method समर्थित नहीं है।"
      },
      success: false
    });
    return;
  }

  if (!isRequestFromAllowedDevelopmentHost(request, config.allowLan)) {
    writeJson(response, 403, {
      error: {
        code: "INVALID_ORIGIN",
        message: "अनुमत स्थानीय विकास host से अनुरोध भेजें।"
      },
      success: false
    });
    return;
  }

  if (config.state !== "configured") {
    writeJson(response, 200, {
      data: createUnauthenticatedSessionResponse(config),
      success: true
    });
    return;
  }

  const token = getLocalAdminSessionToken(request);
  const user = verifyLocalAdminSessionToken(token, config.sessionSecret);

  if (!user) {
    if (token) {
      clearSessionCookie(response);
    }
    writeJson(response, 200, {
      data: createUnauthenticatedSessionResponse(config),
      success: true
    });
    return;
  }

  writeJson(response, 200, {
    data: createAuthenticatedSessionResponse(user),
    success: true
  });
}

async function handleProfile(
  request: IncomingMessage,
  response: ServerResponse,
  config: LocalAdminAuthConfig
): Promise<void> {
  if (request.method !== "POST") {
    writeJson(response, 405, {
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "यह HTTP method समर्थित नहीं है।"
      },
      success: false
    });
    return;
  }

  if (!validatePostRequest(request, response, config)) {
    return;
  }

  if (config.state !== "configured") {
    writeJson(response, 503, {
      error: {
        code: "CONFIGURATION_REQUIRED",
        message: "स्थानीय विकास लॉगिन कॉन्फ़िगरेशन अपूर्ण है।",
        missingVariables: config.missingVariables
      },
      success: false
    });
    return;
  }

  const token = getLocalAdminSessionToken(request);

  if (!verifyLocalAdminSessionToken(token, config.sessionSecret)) {
    if (token) {
      clearSessionCookie(response);
    }
    writeJson(response, 401, {
      error: {
        code: "UNAUTHENTICATED",
        message: "प्रशासन सत्र मान्य नहीं है।"
      },
      success: false
    });
    return;
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    writeJson(response, error instanceof Error && error.message === "REQUEST_BODY_TOO_LARGE" ? 413 : 400, {
      error: {
        code: error instanceof Error && error.message === "REQUEST_BODY_TOO_LARGE" ? "REQUEST_TOO_LARGE" : "INVALID_JSON",
        message: invalidProfileMessage
      },
      success: false
    });
    return;
  }

  const bodyRecord = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const displayName = normalizeDisplayName(bodyRecord.displayName);
  const email = normalizeEmail(bodyRecord.email);
  const currentPassword = typeof bodyRecord.currentPassword === "string" ? bodyRecord.currentPassword : "";
  const newPassword = typeof bodyRecord.newPassword === "string" ? bodyRecord.newPassword : "";

  if (
    !isValidDisplayName(displayName) ||
    !isValidEmail(email) ||
    !currentPassword ||
    (newPassword && newPassword.length < minimumPasswordLength)
  ) {
    writeJson(response, 400, {
      error: {
        code: "INVALID_PROFILE_INPUT",
        message: invalidProfileMessage
      },
      success: false
    });
    return;
  }

  const currentPasswordMatches = await bcrypt.compare(currentPassword, config.passwordHash);

  if (!currentPasswordMatches) {
    writeJson(response, 401, {
      error: {
        code: "INVALID_CURRENT_PASSWORD",
        message: invalidCurrentPasswordMessage
      },
      success: false
    });
    return;
  }

  config.adminName = displayName;
  config.adminEmail = email;

  if (newPassword) {
    config.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  clearLocalAdminFailedLogins(request, email);

  const user = createLocalAdminUser(config);
  setSessionCookie(request, response, config, user);
  writeJson(response, 200, {
    data: {
      authenticationMode: "local-dev",
      passwordChanged: Boolean(newPassword),
      saveMessage: "स्थानीय विकास प्रशासन विवरण इस चल रहे Vite सर्वर सत्र के लिए अपडेट हो गए हैं। स्थायी बदलाव के लिए .env.local भी अपडेट करें।",
      user
    },
    success: true
  });
}

function handleLogout(
  request: IncomingMessage,
  response: ServerResponse,
  config: LocalAdminAuthConfig
): void {
  if (request.method !== "POST") {
    writeJson(response, 405, {
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "यह HTTP method समर्थित नहीं है।"
      },
      success: false
    });
    return;
  }

  if (!validatePostRequest(request, response, config)) {
    return;
  }

  clearSessionCookie(response);
  writeJson(response, 200, {
    data: {},
    success: true
  });
}

export function createLocalAdminAuthMiddleware(config: LocalAdminAuthConfig): LocalAdminAuthMiddleware {
  return (request, response, next) => {
    const url = new URL(request.url ?? "/", "http://local-dev.invalid");

    if (!url.pathname.startsWith(endpointPrefix)) {
      next();
      return;
    }

    if (config.state === "disabled") {
      writeNotFound(response);
      return;
    }

    const handleRequest = async () => {
      if (url.pathname === `${endpointPrefix}/login`) {
        await handleLogin(request, response, config);
        return;
      }

      if (url.pathname === `${endpointPrefix}/session`) {
        handleSession(request, response, config);
        return;
      }

      if (url.pathname === `${endpointPrefix}/profile`) {
        await handleProfile(request, response, config);
        return;
      }

      if (url.pathname === `${endpointPrefix}/logout`) {
        handleLogout(request, response, config);
        return;
      }

      writeNotFound(response);
    };

    void handleRequest().catch(() => {
      if (!response.headersSent) {
        writeJson(response, 500, {
          error: {
            code: "LOCAL_AUTH_ERROR",
            message: "स्थानीय विकास लॉगिन सेवा में समस्या हुई।"
          },
          success: false
        });
      }
    });
  };
}
