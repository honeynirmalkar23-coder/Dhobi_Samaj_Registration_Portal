import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExportClearDatabaseButton } from "./ExportClearDatabaseButton";

const authMock = vi.hoisted(() => ({
  isAdmin: true
}));

vi.mock("../../admin-auth/hooks/useAdminAuth", () => ({
  useAdminAuth: () => ({
    isAdmin: authMock.isAdmin
  })
}));

describe("ExportClearDatabaseButton", () => {
  beforeEach(() => {
    authMock.isAdmin = true;
  });

  it("renders the danger action for administrators", () => {
    render(<ExportClearDatabaseButton onCleared={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Export & Clear Database" })).toBeInTheDocument();
  });

  it("does not render the action for non-admin users", () => {
    authMock.isAdmin = false;

    render(<ExportClearDatabaseButton onCleared={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Export & Clear Database" })).not.toBeInTheDocument();
  });
});

