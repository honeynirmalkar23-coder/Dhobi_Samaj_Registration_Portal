import type {
  AdminIdentity,
  LocalAdminConfigurationState
} from "../types/admin-identity.types";

type LocalAdminSessionData =
  | {
      authenticated: true;
      user: AdminIdentity;
    }
  | {
      authenticated: false;
      configurationState?: LocalAdminConfigurationState;
      missingVariables?: string[];
      user: null;
    };

type LocalAdminProfileUpdateData = {
  authenticationMode: "local-dev";
  passwordChanged: boolean;
  saveMessage: string;
  user: AdminIdentity;
};

export type LocalAdminProfileUpdateInput = {
  currentPassword: string;
  displayName: string;
  email: string;
  newPassword?: string;
};

type LocalAdminApiSuccess<T> = {
  success: true;
  data: T;
};

type LocalAdminApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    missingVariables?: string[];
  };
};

type LocalAdminApiResponse<T> = LocalAdminApiSuccess<T> | LocalAdminApiFailure;

export type LocalAdminClientResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      code: string;
      message: string;
      missingVariables?: string[];
    };

const localAdminAuthBasePath = "/api/dev-admin-auth";
const genericLocalAuthError = "स्थानीय विकास लॉगिन सेवा उपलब्ध नहीं है।";

function getFailure<T = never>(
  code: string,
  message: string,
  missingVariables?: string[]
): LocalAdminClientResult<T> {
  const failure: LocalAdminClientResult<T> = {
    code,
    message,
    ok: false
  };

  if (missingVariables) {
    failure.missingVariables = missingVariables;
  }

  return failure;
}

async function parseResponse<T>(response: Response): Promise<LocalAdminClientResult<T>> {
  let body: LocalAdminApiResponse<T> | null = null;

  try {
    body = (await response.json()) as LocalAdminApiResponse<T>;
  } catch {
    return getFailure("INVALID_RESPONSE", genericLocalAuthError);
  }

  if (!body.success) {
    return getFailure(
      body.error.code,
      body.error.message,
      body.error.missingVariables
    );
  }

  return {
    data: body.data,
    ok: true
  };
}

async function requestLocalAdminAuth<T>(
  path: string,
  options: RequestInit
): Promise<LocalAdminClientResult<T>> {
  try {
    const response = await fetch(`${localAdminAuthBasePath}${path}`, {
      ...options,
      credentials: "include"
    });

    return parseResponse<T>(response);
  } catch {
    return getFailure("NETWORK_ERROR", genericLocalAuthError);
  }
}

export function getLocalAdminSession(): Promise<LocalAdminClientResult<LocalAdminSessionData>> {
  return requestLocalAdminAuth<LocalAdminSessionData>("/session", {
    method: "GET"
  });
}

export function localAdminSignIn(
  email: string,
  password: string
): Promise<LocalAdminClientResult<LocalAdminSessionData>> {
  return requestLocalAdminAuth<LocalAdminSessionData>("/login", {
    body: JSON.stringify({
      email,
      password
    }),
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    },
    method: "POST"
  });
}

export function localAdminSignOut(): Promise<LocalAdminClientResult<Record<string, never>>> {
  return requestLocalAdminAuth<Record<string, never>>("/logout", {
    body: "{}",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    },
    method: "POST"
  });
}

export function localAdminUpdateProfile(
  input: LocalAdminProfileUpdateInput
): Promise<LocalAdminClientResult<LocalAdminProfileUpdateData>> {
  const body: LocalAdminProfileUpdateInput = {
    currentPassword: input.currentPassword,
    displayName: input.displayName,
    email: input.email
  };

  if (input.newPassword) {
    body.newPassword = input.newPassword;
  }

  return requestLocalAdminAuth<LocalAdminProfileUpdateData>("/profile", {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    },
    method: "POST"
  });
}
