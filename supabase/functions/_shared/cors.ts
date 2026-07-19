import { ApiError } from "./errors.ts";

const defaultLocalOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  "http://localhost:5176",
  "http://127.0.0.1:5176"
]);

function getAllowedOrigins(): Set<string> {
  const configuredOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins && configuredOrigins.length > 0) {
    return new Set(configuredOrigins);
  }

  return defaultLocalOrigins;
}

export function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigins = getAllowedOrigins();

  if (origin && !allowedOrigins.has(origin)) {
    throw new ApiError("VALIDATION_ERROR", 403, "अनुमत origin से अनुरोध नहीं आया है।");
  }

  return {
    "access-control-allow-origin": origin || "http://localhost:5173",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-max-age": "86400",
    vary: "origin"
  };
}

export function handleOptions(request: Request): Response | null {
  if (request.method !== "OPTIONS") {
    return null;
  }

  return new Response(null, {
    headers: getCorsHeaders(request),
    status: 204
  });
}
