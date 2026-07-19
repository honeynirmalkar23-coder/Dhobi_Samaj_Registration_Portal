import { getSupabaseClient } from "../lib/supabase/client";
import type { ApiResponse, ServiceResult } from "./api.types";
import { serviceFailure, serviceSuccess } from "./api.types";

const configurationMessage =
  "Supabase कॉन्फ़िगरेशन उपलब्ध नहीं है। कृपया VITE_SUPABASE_URL और VITE_SUPABASE_ANON_KEY सेट करें।";

export async function invokeEdgeFunction<T>(
  functionName: string,
  body?: BodyInit | Record<string, unknown>
): Promise<ServiceResult<T>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return serviceFailure("CONFIGURATION_MISSING", configurationMessage);
  }

  const options = body === undefined ? undefined : { body };
  const { data, error } = await supabase.functions.invoke<ApiResponse<T>>(functionName, options);

  if (error) {
    return serviceFailure("NETWORK_ERROR", "सुरक्षित सेवा से संपर्क नहीं हो सका।");
  }

  if (!data) {
    return serviceFailure("EMPTY_RESPONSE", "सर्वर से मान्य उत्तर नहीं मिला।");
  }

  if (!data.success) {
    return serviceFailure(data.error.code, data.error.message);
  }

  return serviceSuccess(data.data);
}
