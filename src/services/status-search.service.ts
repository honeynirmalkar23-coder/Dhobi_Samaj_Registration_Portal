import type { PublicRegistrationStatus } from "../features/status-search/types/status-search.types";
import { invokeEdgeFunction } from "./edge-functions.service";
import type { ServiceResult } from "./api.types";
import { dataBackendMode } from "./backend/backend-mode";

export async function getPublicRegistrationStatus(
  registrationId: string
): Promise<ServiceResult<PublicRegistrationStatus>> {
  if (dataBackendMode === "local-dev") {
    const { getLocalPublicRegistrationStatus } = await import("./backend/local-portal.client");

    return getLocalPublicRegistrationStatus(registrationId);
  }

  return invokeEdgeFunction<PublicRegistrationStatus>("get-public-registration-status", {
    registrationId
  });
}
