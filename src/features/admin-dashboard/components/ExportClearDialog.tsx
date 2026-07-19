import { useEffect, useState } from "react";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";

type ExportClearDialogProps = {
  isOpen: boolean;
  isProcessing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const confirmationText = "DELETE";

export function ExportClearDialog({
  isOpen,
  isProcessing,
  onCancel,
  onConfirm
}: ExportClearDialogProps) {
  const [typedValue, setTypedValue] = useState("");
  const canConfirm = typedValue === confirmationText && !isProcessing;

  useEffect(() => {
    if (isOpen) {
      setTypedValue("");
    }
  }, [isOpen]);

  return (
    <ConfirmDialog
      cancelLabel="Cancel"
      className="max-w-lg"
      confirmDisabled={!canConfirm}
      confirmLabel={isProcessing ? "Processing..." : "Export & Clear"}
      confirmVariant="danger"
      description="This action will permanently export and clear registration data."
      isOpen={isOpen}
      onCancel={onCancel}
      onConfirm={() => {
        if (canConfirm) {
          onConfirm();
        }
      }}
      title="⚠ Export & Clear Database"
    >
      <ul className="list-disc space-y-2 pl-5">
        <li>Download all registrations as CSV</li>
        <li>Delete ALL registrations</li>
        <li>Delete payment proofs</li>
        <li>Reset registration numbering</li>
        <li>This action CANNOT be undone.</li>
      </ul>

      <div className="mt-5">
        <label className="block font-semibold text-maroon-900" htmlFor="export-clear-confirmation">
          To continue type:
          <span className="ml-2 rounded bg-red-50 px-2 py-1 font-mono text-red-800">{confirmationText}</span>
        </label>
        <input
          aria-describedby="export-clear-confirmation-hint"
          autoComplete="off"
          className="focus-ring mt-3 w-full rounded-md border border-maroon-700/20 bg-white px-3 py-2 text-base font-semibold text-maroon-900"
          disabled={isProcessing}
          id="export-clear-confirmation"
          onChange={(event) => setTypedValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();

              if (canConfirm) {
                onConfirm();
              }
            }
          }}
          value={typedValue}
        />
        <p className="mt-2 text-xs font-semibold text-brown-700" id="export-clear-confirmation-hint">
          Export & Clear remains disabled until DELETE is typed exactly.
        </p>
      </div>
    </ConfirmDialog>
  );
}

