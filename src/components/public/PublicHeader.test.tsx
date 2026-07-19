import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PublicHeader } from "./PublicHeader";

describe("PublicHeader", () => {
  it("renders the mobile menu in a body portal with all navigation links", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PublicHeader />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "मोबाइल मेनू खोलें" }));

    const dialog = screen.getByRole("dialog", { name: "मुख्य मेनू" });
    const drawer = within(dialog);

    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(drawer.getByRole("link", { name: "होम" })).toHaveAttribute("href", "/");
    expect(drawer.getByRole("link", { name: "नया पंजीकरण" })).toHaveAttribute("href", "/registration");
    expect(drawer.getByRole("link", { name: "पंजीकरण खोजें" })).toHaveAttribute("href", "/status");
    expect(drawer.getByRole("link", { name: "प्रशासन लॉगिन" })).toHaveAttribute("href", "/admin/login");
  });
});
