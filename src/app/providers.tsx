import type { ReactNode } from "react";
import { AdminAuthProvider } from "../features/admin-auth/context/AdminAuthContext";
import { LanguageProvider } from "../features/language/LanguageContext";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <LanguageProvider>
      <AdminAuthProvider>{children}</AdminAuthProvider>
    </LanguageProvider>
  );
}
