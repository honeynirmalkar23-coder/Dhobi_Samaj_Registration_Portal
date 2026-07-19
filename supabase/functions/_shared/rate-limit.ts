import { ApiError } from "./errors.ts";
import { getClientFingerprint, getServiceRoleClient, sha256Hex } from "./security.ts";

export const rateLimitConfig = {
  createRegistration: {
    action: "create-registration",
    limit: 5,
    windowSeconds: 60 * 60
  },
  submitPaymentProof: {
    action: "submit-payment-proof",
    limit: 10,
    windowSeconds: 60 * 60
  },
  statusLookup: {
    action: "get-public-registration-status",
    limit: 30,
    windowSeconds: 60 * 60
  },
  publicPaymentSettings: {
    action: "get-public-payment-settings",
    limit: 60,
    windowSeconds: 60 * 60
  },
  adminDatabaseExportClear: {
    action: "admin-database-export-clear",
    limit: 3,
    windowSeconds: 60 * 60
  }
} as const;

type RateLimitName = keyof typeof rateLimitConfig;

export async function assertRateLimit(request: Request, name: RateLimitName): Promise<void> {
  const salt = Deno.env.get("RATE_LIMIT_SALT");

  if (!salt) {
    throw new ApiError("INTERNAL_ERROR", 500);
  }

  const config = rateLimitConfig[name];
  const clientFingerprint = getClientFingerprint(request);
  const keyHash = await sha256Hex(`${salt}|${config.action}|${clientFingerprint}`);
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.rpc("consume_public_rate_limit", {
    p_key_hash: keyHash,
    p_action: config.action,
    p_limit: config.limit,
    p_window_seconds: config.windowSeconds
  });

  if (error) {
    throw new ApiError("INTERNAL_ERROR", 500);
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result?.allowed) {
    throw new ApiError("RATE_LIMITED", 429);
  }
}
