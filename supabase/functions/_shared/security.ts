import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ApiError } from "./errors.ts";

type ServiceRoleClientOptions = {
  fetchTimeoutMs?: number;
};

function createTimeoutFetch(timeoutMs: number): typeof fetch {
  return (async (input, init = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const upstreamSignal = init.signal;
    const abortFromUpstream = () => controller.abort();

    if (upstreamSignal?.aborted) {
      controller.abort();
    } else {
      upstreamSignal?.addEventListener("abort", abortFromUpstream, { once: true });
    }

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
      upstreamSignal?.removeEventListener("abort", abortFromUpstream);
    }
  }) as typeof fetch;
}

export function getServiceRoleClient(options: ServiceRoleClientOptions = {}): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[edge-debug] Supabase service role client configuration missing.", {
      hasServiceRoleKey: Boolean(serviceRoleKey),
      hasSupabaseUrl: Boolean(supabaseUrl)
    });
    throw new ApiError("INTERNAL_ERROR", 500);
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    },
    ...(options.fetchTimeoutMs
      ? {
          db: {
            timeout: options.fetchTimeoutMs
          },
          global: {
            fetch: createTimeoutFetch(options.fetchTimeoutMs)
          }
        }
      : {})
  });
}

export function getAnonAwareClient(request: Request): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anonKey) {
    console.error("[edge-debug] Supabase anon client configuration missing.", {
      hasAnonKey: Boolean(anonKey),
      hasSupabaseUrl: Boolean(supabaseUrl)
    });
    throw new ApiError("INTERNAL_ERROR", 500);
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        Authorization: request.headers.get("authorization") ?? ""
      }
    }
  });
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function createSecureToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getClientFingerprint(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const cfConnectingIp = request.headers.get("cf-connecting-ip") ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";
  const origin = request.headers.get("origin") ?? "";

  return `${cfConnectingIp || forwardedFor}|${userAgent}|${origin}`;
}
