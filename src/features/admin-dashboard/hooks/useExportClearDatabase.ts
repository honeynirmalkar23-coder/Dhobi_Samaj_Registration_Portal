import { useCallback, useState } from "react";
import {
  loadAdminRegistrationExportRows,
  runAdminDatabaseExportClear
} from "../../../services/admin-database.service";
import type { ExportClearDatabaseResult } from "../../../services/admin-database.types";
import {
  createRegistrationsCsvFilename,
  downloadRegistrationCsv
} from "../utilities/registration-export-csv";

type ExportClearPhase = "idle" | "exporting" | "clearing" | "success" | "error";

type UseExportClearDatabaseParams = {
  onCleared: () => Promise<void> | void;
};

export function useExportClearDatabase(params: UseExportClearDatabaseParams) {
  const [phase, setPhase] = useState<ExportClearPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ExportClearDatabaseResult | null>(null);
  const isProcessing = phase === "exporting" || phase === "clearing";

  const runExportClear = useCallback(async () => {
    if (isProcessing) {
      return;
    }

    setErrorMessage(null);
    setResult(null);
    setPhase("exporting");

    const exportRowsResult = await loadAdminRegistrationExportRows();

    if (!exportRowsResult.ok) {
      setPhase("error");
      setErrorMessage(exportRowsResult.message);
      return;
    }

    const rows = exportRowsResult.data;
    const filename = createRegistrationsCsvFilename(new Date(), rows.length);

    try {
      downloadRegistrationCsv(rows, filename);
    } catch {
      setPhase("error");
      setErrorMessage("CSV डाउनलोड तैयार नहीं हो सका। डेटाबेस में कोई बदलाव नहीं किया गया।");
      return;
    }

    setPhase("clearing");
    const clearResult = await runAdminDatabaseExportClear({
      expectedExportedRows: rows.length,
      filename
    });

    if (!clearResult.ok) {
      setPhase("error");
      setErrorMessage(`${clearResult.message} CSV डाउनलोड हो चुका है, लेकिन डेटाबेस clear नहीं किया गया।`);
      return;
    }

    setResult(clearResult.data);
    await params.onCleared();
    setPhase("success");
  }, [isProcessing, params]);

  const reset = useCallback(() => {
    if (!isProcessing) {
      setErrorMessage(null);
      setResult(null);
      setPhase("idle");
    }
  }, [isProcessing]);

  return {
    errorMessage,
    isProcessing,
    phase,
    reset,
    result,
    runExportClear
  };
}

