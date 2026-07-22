import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegistrationForm } from "./RegistrationForm";

const registrationServiceMocks = vi.hoisted(() => ({
  createRegistration: vi.fn()
}));

const paymentServiceMocks = vi.hoisted(() => ({
  storePaymentAccessToken: vi.fn()
}));

vi.mock("../../../services/registration.service", () => registrationServiceMocks);
vi.mock("../../../services/payment.service", () => paymentServiceMocks);

function LocationProbe() {
  const location = useLocation();

  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

function renderRegistrationForm() {
  return render(
    <MemoryRouter initialEntries={["/registration"]}>
      <RegistrationForm />
      <LocationProbe />
    </MemoryRouter>
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("नाम *"), "सीता देवी");
  await user.type(screen.getByLabelText("उम्र *"), "35");
  await user.type(screen.getByLabelText("मोबाइल नंबर *"), "9876543210");
  await user.selectOptions(screen.getByLabelText("शिक्षा स्तर *"), "graduate");
  await user.type(screen.getByLabelText("कक्षा / डिग्री / विषय"), "बी.ए.");
  await user.type(
    screen.getByLabelText("स्थायी पता *"),
    "ग्राम उदाहरण\nतहसील उदाहरण, जिला उदाहरण, राज्य"
  );
  await user.clear(screen.getByLabelText("लड़कों की संख्या *"));
  await user.type(screen.getByLabelText("लड़कों की संख्या *"), "2");
  await user.clear(screen.getByLabelText("लड़कियों की संख्या *"));
  await user.type(screen.getByLabelText("लड़कियों की संख्या *"), "3");
  await user.clear(screen.getByLabelText("बुजुर्गों की संख्या *"));
  await user.type(screen.getByLabelText("बुजुर्गों की संख्या *"), "1");
  await user.upload(
    screen.getByLabelText(/फोटो चुनें/),
    new File(["photo"], "member-photo.jpg", {
      type: "image/jpeg"
    })
  );
  await user.click(screen.getByLabelText(/मैं पुष्टि करता/));
}

describe("RegistrationForm", () => {
  beforeEach(() => {
    registrationServiceMocks.createRegistration.mockReset();
    registrationServiceMocks.createRegistration.mockResolvedValue({
      ok: true,
      data: {
        createdAt: "2026-07-16T00:00:00.000Z",
        paymentAccessToken: "opaque-payment-token",
        registrationId: "DS-2026-000001"
      }
    });
    paymentServiceMocks.storePaymentAccessToken.mockReset();
    vi.stubGlobal("fetch", vi.fn());
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:photo-preview")
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits a valid form, stores the payment access token, and opens the payment route", async () => {
    const user = userEvent.setup();
    renderRegistrationForm();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "सहेजें और भुगतान पर जाएं" }));

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/payment/DS-2026-000001"));
    expect(registrationServiceMocks.createRegistration).toHaveBeenCalledTimes(1);
    expect(paymentServiceMocks.storePaymentAccessToken).toHaveBeenCalledWith(
      "DS-2026-000001",
      "opaque-payment-token"
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("shows error summary and focuses the first invalid field after empty submit", async () => {
    const user = userEvent.setup();
    renderRegistrationForm();

    await user.click(screen.getByRole("button", { name: "सहेजें और भुगतान पर जाएं" }));

    expect(await screen.findByText("कृपया निम्न जानकारी जांचें")).toBeInTheDocument();
    expect(screen.getByText("कृपया सदस्य का नाम दर्ज करें।")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("नाम *")).toHaveFocus());
  });

  it("updates family total immediately", async () => {
    const user = userEvent.setup();
    renderRegistrationForm();

    expect(screen.getAllByText("0")[0]).toBeInTheDocument();
    await user.clear(screen.getByLabelText("लड़कों की संख्या *"));
    await user.type(screen.getByLabelText("लड़कों की संख्या *"), "2");
    await user.clear(screen.getByLabelText("लड़कियों की संख्या *"));
    await user.type(screen.getByLabelText("लड़कियों की संख्या *"), "3");
    await user.clear(screen.getByLabelText("बुजुर्गों की संख्या *"));
    await user.type(screen.getByLabelText("बुजुर्गों की संख्या *"), "1");

    expect(screen.getAllByText("6").length).toBeGreaterThan(0);
  });

  it("shows valid photo preview and supports removal", async () => {
    const user = userEvent.setup();
    renderRegistrationForm();

    await user.upload(
      screen.getByLabelText(/फोटो चुनें/),
      new File(["photo"], "member-photo.jpg", {
        type: "image/jpeg"
      })
    );

    expect(screen.getByText("member-photo.jpg")).toBeInTheDocument();
    expect(screen.getByAltText("चयनित सदस्य फोटो का पूर्वावलोकन")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "फोटो हटाएं" }));

    expect(screen.queryByText("member-photo.jpg")).not.toBeInTheDocument();
    expect(screen.getByText("कृपया सदस्य का फोटो चुनें।")).toBeInTheDocument();
  });

  it("rejects an invalid PDF photo", async () => {
    renderRegistrationForm();
    const dropTarget = screen.getByText("फोटो चुनें").closest("label");

    fireEvent.drop(dropTarget as HTMLElement, {
      dataTransfer: {
        files: [
          new File(["pdf"], "document.pdf", {
            type: "application/pdf"
          })
        ]
      }
    });

    expect(
      screen.getByText("केवल JPG, JPEG, PNG या WebP फोटो स्वीकार किए जाते हैं।")
    ).toBeInTheDocument();
  });

  it("shows unsaved-change confirmation for supported back action", async () => {
    const user = userEvent.setup();
    renderRegistrationForm();

    await user.type(screen.getByLabelText("नाम *"), "मोहन");
    await user.click(screen.getByRole("button", { name: "वापस जाएं" }));

    expect(screen.getByRole("dialog", { name: "भरी गई जानकारी छोड़ें?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "यहीं रहें" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/registration");
  });
});
