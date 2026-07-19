export type DataBackendMode = "supabase" | "local-dev";

export const dataBackendMode: DataBackendMode =
  import.meta.env.DEV && import.meta.env.VITE_DATA_BACKEND_MODE === "local-dev"
    ? "local-dev"
    : "supabase";

export function resolveDataBackendMode(params: {
  isDevelopment: boolean;
  requestedMode: string | undefined;
}): DataBackendMode {
  if (params.isDevelopment && params.requestedMode === "local-dev") {
    return "local-dev";
  }

  return "supabase";
}

export function getDataBackendMode(): DataBackendMode {
  return dataBackendMode;
}
