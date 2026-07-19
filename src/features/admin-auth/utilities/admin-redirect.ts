import { routePaths } from "../../../config/routes.config";

const fallbackAdminRedirect = routePaths.adminDashboard;

function safelyDecodeRedirect(value: string): string {
  let decodedValue = value;

  for (let index = 0; index < 2; index += 1) {
    try {
      const nextValue = decodeURIComponent(decodedValue);

      if (nextValue === decodedValue) {
        break;
      }

      decodedValue = nextValue;
    } catch {
      break;
    }
  }

  return decodedValue;
}

export function getSafeAdminRedirectPath(value: unknown): string {
  if (typeof value !== "string") {
    return fallbackAdminRedirect;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return fallbackAdminRedirect;
  }

  const decodedValue = safelyDecodeRedirect(trimmedValue);
  const lowerValue = decodedValue.toLowerCase();

  if (
    lowerValue.startsWith("http:") ||
    lowerValue.startsWith("https:") ||
    lowerValue.startsWith("javascript:") ||
    lowerValue.startsWith("//")
  ) {
    return fallbackAdminRedirect;
  }

  if (decodedValue === routePaths.adminRoot) {
    return fallbackAdminRedirect;
  }

  if (
    decodedValue === routePaths.adminLogin ||
    decodedValue.startsWith(`${routePaths.adminLogin}?`) ||
    decodedValue.startsWith(`${routePaths.adminLogin}#`)
  ) {
    return fallbackAdminRedirect;
  }

  if (!decodedValue.startsWith(`${routePaths.adminRoot}/`)) {
    return fallbackAdminRedirect;
  }

  return decodedValue;
}
