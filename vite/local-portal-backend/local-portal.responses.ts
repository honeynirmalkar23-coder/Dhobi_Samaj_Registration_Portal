// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { IncomingMessage, ServerResponse } from "node:http";
import type { ApiFailure, ApiSuccess } from "./local-portal.types";

const maxJsonBodyBytes = 256 * 1024;

export function writeJson<T>(response: ServerResponse, statusCode: number, body: ApiSuccess<T> | ApiFailure): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

export function writeSuccess<T>(response: ServerResponse, data: T, statusCode = 200): void {
  writeJson(response, statusCode, {
    data,
    success: true
  });
}

export function writeFailure(
  response: ServerResponse,
  statusCode: number,
  code: string,
  message: string
): void {
  writeJson(response, statusCode, {
    error: {
      code,
      message
    },
    success: false
  });
}

export function writeNotFound(response: ServerResponse): void {
  response.statusCode = 404;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.end("Not Found");
}

export function hasJsonContentType(request: IncomingMessage): boolean {
  const header = request.headers["content-type"];
  const value = Array.isArray(header) ? header[0] : header;

  return Boolean(value?.toLowerCase().startsWith("application/json"));
}

export function hasMultipartContentType(request: IncomingMessage): boolean {
  const header = request.headers["content-type"];
  const value = Array.isArray(header) ? header[0] : header;

  return Boolean(value?.toLowerCase().startsWith("multipart/form-data"));
}

export function hasRequestedWithHeader(request: IncomingMessage): boolean {
  const header = request.headers["x-requested-with"];
  const value = Array.isArray(header) ? header[0] : header;

  return value === "XMLHttpRequest";
}

export function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolveBody, reject) => {
    let body = "";
    let size = 0;

    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      size += Buffer.byteLength(chunk);

      if (size > maxJsonBodyBytes) {
        reject(new Error("REQUEST_BODY_TOO_LARGE"));
        request.destroy();
        return;
      }

      body += chunk;
    });
    request.on("end", () => {
      try {
        resolveBody(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("INVALID_JSON"));
      }
    });
    request.on("error", reject);
  });
}

export function getJsonRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

