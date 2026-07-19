import type { User, UserAttributes } from "@supabase/supabase-js";
import type {
  AdminAuthenticationMode,
  AdminIdentity
} from "../features/admin-auth/types/admin-identity.types";
import {
  createSupabaseAdminIdentity,
  getConfiguredSupabaseClient
} from "../features/admin-auth/services/admin-auth.service";
import { isAdministratorUser } from "../features/admin-auth/utilities/admin-role";
import type { ServiceResult } from "./api.types";
import { serviceFailure, serviceSuccess } from "./api.types";

export type AdminProfileDetails = {
  authenticationMode: AdminAuthenticationMode;
  displayName: string;
  email: string;
  identity: AdminIdentity;
};

export type AdminProfileSaveInput = {
  currentEmail: string;
  currentPassword: string;
  displayName: string;
  email: string;
  newPassword?: string;
};

export type AdminProfileSaveResult = {
  emailChangePending: boolean;
  passwordChanged: boolean;
  profile: AdminProfileDetails;
  saveMessage: string;
};

function mapIdentityToProfile(identity: AdminIdentity): AdminProfileDetails {
  return {
    authenticationMode: identity.authenticationMode,
    displayName: identity.displayName ?? "",
    email: identity.email,
    identity
  };
}

function mapSupabaseUserToProfile(user: User): AdminProfileDetails {
  return mapIdentityToProfile(createSupabaseAdminIdentity(user));
}

export async function loadAdminProfile(
  identity: AdminIdentity | null
): Promise<ServiceResult<AdminProfileDetails>> {
  if (import.meta.env.DEV && identity?.authenticationMode === "local-dev") {
    return serviceSuccess(mapIdentityToProfile(identity));
  }

  const supabase = getConfiguredSupabaseClient();

  if (!supabase) {
    return serviceFailure("CONFIGURATION_MISSING", "Supabase कॉन्फ़िगरेशन उपलब्ध नहीं है।");
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return serviceFailure("LOAD_FAILED", "प्रशासन प्रोफाइल प्राप्त नहीं हो सकी।");
  }

  if (!isAdministratorUser(data.user)) {
    return serviceFailure("ADMIN_ACCESS_DENIED", "प्रशासन प्रोफाइल के लिए अधिकृत पहुंच आवश्यक है।");
  }

  return serviceSuccess(mapSupabaseUserToProfile(data.user));
}

async function saveLocalAdminProfile(
  input: AdminProfileSaveInput
): Promise<ServiceResult<AdminProfileSaveResult>> {
  const { localAdminUpdateProfile } = await import("../features/admin-auth/services/local-admin-auth.client");
  const result = await localAdminUpdateProfile({
    currentPassword: input.currentPassword,
    displayName: input.displayName,
    email: input.email,
    ...(input.newPassword ? { newPassword: input.newPassword } : {})
  });

  if (!result.ok) {
    return serviceFailure(result.code, result.message);
  }

  return serviceSuccess({
    emailChangePending: false,
    passwordChanged: result.data.passwordChanged,
    profile: mapIdentityToProfile(result.data.user),
    saveMessage: result.data.saveMessage
  });
}

async function saveSupabaseAdminProfile(
  input: AdminProfileSaveInput
): Promise<ServiceResult<AdminProfileSaveResult>> {
  const supabase = getConfiguredSupabaseClient();

  if (!supabase) {
    return serviceFailure("CONFIGURATION_MISSING", "Supabase कॉन्फ़िगरेशन उपलब्ध नहीं है।");
  }

  const currentEmail = input.currentEmail.trim().toLowerCase();
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: currentEmail,
    password: input.currentPassword
  });

  if (signInError || !signInData.user) {
    return serviceFailure("INVALID_CURRENT_PASSWORD", "वर्तमान पासवर्ड सही नहीं है।");
  }

  if (!isAdministratorUser(signInData.user)) {
    return serviceFailure("ADMIN_ACCESS_DENIED", "प्रशासन प्रोफाइल के लिए अधिकृत पहुंच आवश्यक है।");
  }

  const emailChanged = input.email !== currentEmail;
  const updateAttributes: UserAttributes = {
    data: {
      display_name: input.displayName,
      full_name: input.displayName,
      name: input.displayName
    }
  };

  if (emailChanged) {
    updateAttributes.email = input.email;
  }

  if (input.newPassword) {
    updateAttributes.password = input.newPassword;
  }

  const { data, error } = await supabase.auth.updateUser(updateAttributes);

  if (error || !data.user) {
    return serviceFailure("SAVE_FAILED", "प्रशासन प्रोफाइल सहेजी नहीं जा सकी।");
  }

  if (!isAdministratorUser(data.user)) {
    return serviceFailure("ADMIN_ACCESS_DENIED", "प्रशासन प्रोफाइल के लिए अधिकृत पहुंच आवश्यक है।");
  }

  const updatedProfile = mapSupabaseUserToProfile(data.user);
  const emailChangePending = emailChanged && updatedProfile.email.toLowerCase() !== input.email;
  const profile = emailChangePending
    ? {
        ...updatedProfile,
        email: input.email,
        identity: {
          ...updatedProfile.identity,
          email: input.email
        }
      }
    : updatedProfile;

  return serviceSuccess({
    emailChangePending,
    passwordChanged: Boolean(input.newPassword),
    profile,
    saveMessage: emailChangePending
      ? "प्रशासन प्रोफाइल सहेजी गई है। नया ईमेल सक्रिय करने के लिए ईमेल पुष्टिकरण आवश्यक हो सकता है।"
      : "प्रशासन प्रोफाइल सुरक्षित रूप से सहेजी गई है।"
  });
}

export async function saveAdminProfile(
  input: AdminProfileSaveInput,
  identity: AdminIdentity | null
): Promise<ServiceResult<AdminProfileSaveResult>> {
  if (import.meta.env.DEV && identity?.authenticationMode === "local-dev") {
    return saveLocalAdminProfile(input);
  }

  return saveSupabaseAdminProfile(input);
}
