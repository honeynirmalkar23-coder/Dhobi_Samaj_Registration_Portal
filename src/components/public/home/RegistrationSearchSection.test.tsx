import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RegistrationSearchSection } from "./RegistrationSearchSection";

function LocationProbe() {
  const location = useLocation();

  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

function renderSearchSection() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <RegistrationSearchSection />
      <LocationProbe />
    </MemoryRouter>
  );
}

describe("RegistrationSearchSection", () => {
  it("normalizes valid input and navigates to status query", async () => {
    const user = userEvent.setup();
    renderSearchSection();

    await user.type(screen.getByLabelText("पंजीकरण आईडी"), "  ds-2026-000001  ");
    await user.click(screen.getByRole("button", { name: "स्थिति खोजें" }));

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/status?registrationId=DS-2026-000001"
    );
  });

  it("shows a Hindi validation error and does not navigate for invalid input", async () => {
    const user = userEvent.setup();
    renderSearchSection();

    await user.type(screen.getByLabelText("पंजीकरण आईडी"), "DS2026000001");
    await user.click(screen.getByRole("button", { name: "स्थिति खोजें" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/");
    expect(
      screen.getByText("कृपया DS-YYYY-000001 प्रारूप में मान्य पंजीकरण आईडी दर्ज करें।")
    ).toBeInTheDocument();
  });
});
