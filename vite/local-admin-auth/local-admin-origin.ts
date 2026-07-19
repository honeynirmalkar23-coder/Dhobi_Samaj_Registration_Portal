// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { IncomingMessage } from "node:http";

function normalizeHost(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function stripPort(host: string): string {
  if (host.startsWith("[")) {
    return host.slice(1, host.indexOf("]"));
  }

  return host.split(":")[0] ?? "";
}

function isLocalHost(host: string): boolean {
  const hostname = stripPort(host);

  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function getRequestProtocol(request: IncomingMessage): "http:" | "https:" {
  return (request.socket as { encrypted?: boolean }).encrypted ? "https:" : "http:";
}

export function isRequestFromAllowedDevelopmentHost(
  request: IncomingMessage,
  allowLan: boolean
): boolean {
  const host = normalizeHost(request.headers.host);

  if (!host) {
    return false;
  }

  return allowLan || isLocalHost(host);
}

export function isValidStateChangingOrigin(
  request: IncomingMessage,
  allowLan: boolean
): boolean {
  const host = normalizeHost(request.headers.host);
  const originHeader = request.headers.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;

  if (!host || !origin || !isRequestFromAllowedDevelopmentHost(request, allowLan)) {
    return false;
  }

  try {
    const originUrl = new URL(origin);

    return originUrl.protocol === getRequestProtocol(request) && normalizeHost(originUrl.host) === host;
  } catch {
    return false;
  }
}
