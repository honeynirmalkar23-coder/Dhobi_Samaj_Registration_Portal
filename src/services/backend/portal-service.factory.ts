import type { ServiceResult } from "../api.types";
import { getDataBackendMode } from "./backend-mode";

export async function runWithBackendMode<T>(params: {
  local: () => Promise<ServiceResult<T>>;
  supabase: () => Promise<ServiceResult<T>>;
}): Promise<ServiceResult<T>> {
  if (getDataBackendMode() === "local-dev") {
    return params.local();
  }

  return params.supabase();
}

