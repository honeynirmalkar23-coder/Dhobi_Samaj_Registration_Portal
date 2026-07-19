import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExportClearDialog } from "./ExportClearDialog";

describe("ExportClearDialog", () => {
  it("keeps Export & Clear disabled until DELETE is typed exactly", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ExportClearDialog
        isOpen
        isProcessing={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    const confirmButton = screen.getByRole("button", { name: "Export & Clear" });
    const input = screen.getByLabelText(/To continue type:/);

    expect(screen.getByRole("dialog", { name: "⚠ Export & Clear Database" })).toBeInTheDocument();
    expect(confirmButton).toBeDisabled();

    await user.type(input, "delete");
    expect(confirmButton).toBeDisabled();

    await user.clear(input);
    await user.type(input, "DELETE");
    expect(confirmButton).not.toBeDisabled();

    await user.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("confirms with Enter only after DELETE is typed", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ExportClearDialog
        isOpen
        isProcessing={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    const input = screen.getByLabelText(/To continue type:/);

    await user.type(input, "DELET");
    await user.keyboard("{Enter}");
    expect(onConfirm).not.toHaveBeenCalled();

    await user.type(input, "E");
    await user.keyboard("{Enter}");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

