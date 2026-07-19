import { useEffect, useState } from "react";
import { Database, Download, LoaderCircle, Trash2 } from "lucide-react";
import { DangerButton, OutlineButton } from "../../../components/common/Button";
import { useAdminAuth } from "../../admin-auth/hooks/useAdminAuth";
import { useExportClearDatabase } from "../hooks/useExportClearDatabase";
import { ExportClearDialog } from "./ExportClearDialog";

type ExportClearDatabaseButtonProps = {
  onCleared: () => Promise<void> | void;
};

export function ExportClearDatabaseButton({ onCleared }: ExportClearDatabaseButtonProps) {
  const { isAdmin } = useAdminAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const {
    errorMessage,
    isProcessing,
    phase,
    reset,
    result,
    runExportClear
  } = useExportClearDatabase({
    onCleared
  });

  useEffect(() => {
    if (phase === "success" && result) {
      setToastMessage("Database successfully exported and cleared.");
    } else if (phase === "error" && errorMessage) {
      setToastMessage(errorMessage);
    }
  }, [errorMessage, phase, result]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(null), 7000);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  if (!isAdmin) {
    return null;
  }

  const statusText =
    phase === "exporting"
      ? "Preparing CSV export..."
      : phase === "clearing"
        ? "Clearing database securely..."
        : null;

  return (
    <section
      aria-labelledby="export-clear-database-title"
      className="rounded-lg border border-red-700/25 bg-red-50 p-5 shadow-subtle sm:p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-red-900" id="export-clear-database-title">
            Export & Clear Database
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-brown-800">
            Download a full CSV backup, then clear all registrations, payment proofs, related records, and reset
            registration numbering. Use this only after the downloaded CSV is safely saved.
          </p>
          {statusText ? (
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-900" role="status">
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              {statusText}
            </p>
          ) : null}
        </div>

        <DangerButton
          aria-label="Export & Clear Database"
          disabled={isProcessing}
          onClick={() => {
            reset();
            setIsDialogOpen(true);
          }}
        >
          {isProcessing ? (
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
          ) : (
            <span aria-hidden="true" className="flex items-center gap-1">
              <Database className="h-5 w-5" />
              <Download className="h-5 w-5" />
              <Trash2 className="h-5 w-5" />
            </span>
          )}
          Export & Clear Database
        </DangerButton>
      </div>

      {errorMessage ? (
        <div className="mt-4 flex flex-col gap-3 rounded-md border border-red-700/25 bg-white px-4 py-3 text-sm leading-7 text-red-900" role="alert">
          <p className="font-semibold">{errorMessage}</p>
          <OutlineButton onClick={reset}>Dismiss</OutlineButton>
        </div>
      ) : null}

      <ExportClearDialog
        isOpen={isDialogOpen}
        isProcessing={isProcessing}
        onCancel={() => {
          if (!isProcessing) {
            setIsDialogOpen(false);
            reset();
          }
        }}
        onConfirm={() => {
          void runExportClear().then(() => {
            setIsDialogOpen(false);
          });
        }}
      />

      {toastMessage ? (
        <div
          className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-maroon-700/15 bg-white px-4 py-3 text-sm font-semibold leading-6 text-maroon-900 shadow-soft"
          role={phase === "error" ? "alert" : "status"}
        >
          {toastMessage}
        </div>
      ) : null}
    </section>
  );
}

