import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentSettingsForm } from "./PaymentSettingsForm";

const paymentSettingsServiceMocks = vi.hoisted(() => ({
  loadAdminPaymentSettings: vi.fn(),
  saveAdminPaymentSettings: vi.fn()
}));

vi.mock("../../../services/payment-settings.service", () => paymentSettingsServiceMocks);

function LocationProbe() {
  const location = useLocation();

  return <output data-testid="location">{location.pathname}</output>;
}

function renderPaymentSettingsForm() {
  return render(
    <MemoryRouter initialEntries={["/admin/payment-settings"]}>
      <Routes>
        <Route
          element={
            <>
              <PaymentSettingsForm />
              <LocationProbe />
            </>
          }
          path="/admin/payment-settings"
        />
        <Route element={<output data-testid="dashboard">dashboard</output>} path="/admin/dashboard" />
      </Routes>
    </MemoryRouter>
  );
}

function createQrFile(name = "payment-qr.png", type = "image/png", content: BlobPart = "qr") {
  return new File([content], name, { type });
}

const defaultAdminPaymentSettings = {
  amount: null,
  instructions: null,
  payeeName: null,
  paymentDeadline: null,
  paymentEnabled: false,
  paymentTitle: null,
  publicContact: null,
  qrCodePath: null,
  qrCodeSignedUrl: null,
  updatedAt: "2026-07-16T00:00:00.000Z",
  upiId: null
};

function createSavedSettings(input: {
  amount?: number | null;
  instructions?: string | null;
  payeeName?: string | null;
  paymentDeadline?: string | null;
  paymentEnabled?: boolean;
  paymentTitle?: string | null;
  publicContact?: string | null;
  qrCodePath?: string | null;
  qrCodeSignedUrl?: string | null;
  upiId?: string | null;
} = {}) {
  return {
    ...defaultAdminPaymentSettings,
    ...input
  };
}

async function findPaymentEnabledCheckbox() {
  return screen.findByRole("checkbox", { name: /ऑनलाइन भुगतान सक्षम करें/ });
}

async function fillEnabledPaymentSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await findPaymentEnabledCheckbox());
  await user.upload(screen.getByLabelText("QR कोड इमेज"), createQrFile());
  await user.type(screen.getByLabelText(/UPI आईडी/), "samaj.test@upi");
  await user.type(screen.getByLabelText(/प्राप्तकर्ता का नाम/), "धोबी समाज");
  await user.type(screen.getByLabelText(/पंजीकरण शुल्क/), "500");
  await user.type(screen.getByLabelText(/भुगतान शीर्षक/), "धोबी समाज सदस्य पंजीकरण शुल्क");
  await user.type(
    screen.getByLabelText(/भुगतान निर्देश/),
    "भुगतान पूरा करने के बाद स्क्रीनशॉट सुरक्षित रखें।"
  );
  await user.type(screen.getByLabelText(/सार्वजनिक सहायता संपर्क/), "payment-help@example.test");
}

describe("PaymentSettingsForm", () => {
  beforeEach(() => {
    paymentSettingsServiceMocks.loadAdminPaymentSettings.mockReset();
    paymentSettingsServiceMocks.saveAdminPaymentSettings.mockReset();
    paymentSettingsServiceMocks.loadAdminPaymentSettings.mockResolvedValue({
      ok: true,
      data: defaultAdminPaymentSettings
    });
    paymentSettingsServiceMocks.saveAdminPaymentSettings.mockImplementation(async ({ currentQrCodePath, input }) => ({
      ok: true,
      data: createSavedSettings({
        amount: input.registrationFee,
        instructions: input.paymentInstructions,
        payeeName: input.payeeName,
        paymentDeadline: input.paymentDeadline,
        paymentEnabled: input.paymentEnabled,
        paymentTitle: input.paymentTitle,
        publicContact: input.publicSupportContact,
        qrCodePath: input.qrCodeFile ? "existing-qr-code" : currentQrCodePath,
        qrCodeSignedUrl: input.qrCodeFile || currentQrCodePath ? "https://signed.example/payment-qr.png" : null,
        upiId: input.upiId
      })
    }));
    vi.stubGlobal("fetch", vi.fn());
    let previewCount = 0;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => {
        previewCount += 1;
        return `blob:payment-qr-preview-${previewCount}`;
      })
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts disabled with empty fields, unavailable preview, and no fake financial values", async () => {
    renderPaymentSettingsForm();

    expect(await findPaymentEnabledCheckbox()).not.toBeChecked();
    expect(screen.getByText("QR कोड इमेज चुनें")).toBeInTheDocument();
    expect(screen.getByText("चयनित नहीं")).toBeInTheDocument();
    expect(screen.getByText("ऑनलाइन भुगतान फिलहाल उपलब्ध नहीं है")).toBeInTheDocument();
    expect(screen.getByText("कृपया प्रशासन से संपर्क करें।")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("dhobi.society@upi")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("500")).not.toBeInTheDocument();
    expect(screen.queryByText("सहेजा गया")).not.toBeInTheDocument();
    expect(screen.queryByText("प्रकाशित")).not.toBeInTheDocument();
  });

  it("maps nullable or missing backend values to safe form defaults", async () => {
    paymentSettingsServiceMocks.loadAdminPaymentSettings.mockResolvedValueOnce({
      ok: true,
      data: {
        paymentEnabled: undefined,
        qrCodePath: undefined,
        qrCodeSignedUrl: undefined,
        updatedAt: null
      }
    });

    renderPaymentSettingsForm();

    expect(await findPaymentEnabledCheckbox()).not.toBeChecked();
    expect(screen.getByLabelText(/UPI आईडी/)).toHaveValue("");
    expect(screen.getByLabelText(/प्राप्तकर्ता का नाम/)).toHaveValue("");
    expect(screen.getByLabelText(/पंजीकरण शुल्क/)).toHaveValue("");
    expect(screen.getByLabelText(/अंतिम तारीख और समय/)).toHaveValue("");
  });

  it("renders an inline retry state when loading rejects", async () => {
    paymentSettingsServiceMocks.loadAdminPaymentSettings.mockRejectedValueOnce(new Error("network failed"));

    renderPaymentSettingsForm();

    expect(await screen.findByText("भुगतान सेटिंग्स लोड नहीं हुईं")).toBeInTheDocument();
    expect(screen.getByText("भुगतान सेटिंग्स प्राप्त नहीं हो सकीं।")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "पुनः लोड करें" })).toBeInTheDocument();
  });

  it("allows disabled empty validation and saves through the admin service", async () => {
    const user = userEvent.setup();
    renderPaymentSettingsForm();

    await findPaymentEnabledCheckbox();
    await user.click(screen.getByRole("button", { name: "सेटिंग्स सुरक्षित रूप से सहेजें" }));

    expect(
      await screen.findByRole("dialog", { name: "भुगतान सेटिंग्स सहेजी गईं" })
    ).toBeInTheDocument();
    expect(screen.getByText("भुगतान सेटिंग्स सुरक्षित रूप से सहेजी गई हैं।")).toBeInTheDocument();
    expect(screen.getByText("QR कोड निजी स्टोरेज में रखा गया है।")).toBeInTheDocument();
    expect(paymentSettingsServiceMocks.saveAdminPaymentSettings).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("renders an inline save error when saving rejects", async () => {
    const user = userEvent.setup();
    paymentSettingsServiceMocks.saveAdminPaymentSettings.mockRejectedValueOnce(new Error("save failed"));
    renderPaymentSettingsForm();

    await findPaymentEnabledCheckbox();
    await user.click(screen.getByRole("button", { name: "सेटिंग्स सुरक्षित रूप से सहेजें" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("भुगतान सेटिंग्स सहेजी नहीं जा सकीं।");
    expect(screen.queryByRole("dialog", { name: "भुगतान सेटिंग्स सहेजी गईं" })).not.toBeInTheDocument();
  });

  it("shows required Hindi errors and focuses QR when enabled fields are missing", async () => {
    const user = userEvent.setup();
    renderPaymentSettingsForm();

    await user.click(await findPaymentEnabledCheckbox());
    await user.click(screen.getByRole("button", { name: "सेटिंग्स सुरक्षित रूप से सहेजें" }));

    expect(await screen.findByText("कृपया भुगतान सेटिंग्स जांचें")).toBeInTheDocument();
    expect(screen.getAllByText("ऑनलाइन भुगतान सक्षम करने के लिए QR कोड चुनें।").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ऑनलाइन भुगतान सक्षम करने के लिए UPI आईडी दर्ज करें।").length).toBeGreaterThan(0);
    expect(screen.getAllByText("कृपया प्राप्तकर्ता का नाम दर्ज करें।").length).toBeGreaterThan(0);
    expect(screen.getAllByText("कृपया पंजीकरण शुल्क दर्ज करें।").length).toBeGreaterThan(0);
    expect(screen.getAllByText("कृपया भुगतान शीर्षक दर्ज करें।").length).toBeGreaterThan(0);
    expect(screen.getAllByText("कृपया भुगतान निर्देश दर्ज करें।").length).toBeGreaterThan(0);
    expect(screen.getAllByText("कृपया भुगतान सहायता संपर्क दर्ज करें।").length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByLabelText("QR कोड इमेज")).toHaveFocus());
  });

  it("previews a valid enabled configuration and keeps full UPI URI out of the DOM", async () => {
    const user = userEvent.setup();
    const { container } = renderPaymentSettingsForm();

    await fillEnabledPaymentSettings(user);

    expect(screen.getByText("payment-qr.png")).toBeInTheDocument();
    expect(screen.getAllByAltText("चयनित भुगतान QR कोड का पूर्वावलोकन").length).toBeGreaterThan(0);
    expect(screen.getByText("धोबी समाज सदस्य पंजीकरण शुल्क")).toBeInTheDocument();
    expect(screen.getAllByText("samaj.test@upi").length).toBeGreaterThan(0);
    expect(screen.getAllByText("धोबी समाज").length).toBeGreaterThan(0);
    expect(container.textContent).toMatch(/₹\s?500/);
    expect(screen.getByText("UPI लिंक तैयार हो सकता है")).toBeInTheDocument();
    expect(screen.getByText("केवल पूर्वावलोकन")).toBeInTheDocument();
    expect(container.textContent).not.toContain("upi://pay");

    await user.click(screen.getByRole("button", { name: "सेटिंग्स सुरक्षित रूप से सहेजें" }));

    expect(
      await screen.findByRole("dialog", { name: "भुगतान सेटिंग्स सहेजी गईं" })
    ).toBeInTheDocument();
    expect(paymentSettingsServiceMocks.saveAdminPaymentSettings).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("handles QR replacement, invalid replacement preservation, and removal cleanup", async () => {
    const user = userEvent.setup();
    renderPaymentSettingsForm();

    await user.click(await findPaymentEnabledCheckbox());
    await user.upload(screen.getByLabelText("QR कोड इमेज"), createQrFile("first-qr.png", "image/png"));

    expect(screen.getByText("first-qr.png")).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText("QR कोड इमेज"), {
      target: {
        files: [createQrFile("not-qr.pdf", "application/pdf")]
      }
    });

    expect(screen.getByText("first-qr.png")).toBeInTheDocument();
    expect(screen.getByText("केवल JPG, JPEG, PNG या WebP QR इमेज स्वीकार की जाती है।")).toBeInTheDocument();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    await user.upload(screen.getByLabelText("QR कोड इमेज"), createQrFile("second-qr.jpg", "image/jpeg"));

    expect(screen.getByText("second-qr.jpg")).toBeInTheDocument();
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:payment-qr-preview-1"));

    await user.click(screen.getByRole("button", { name: "QR कोड हटाएं" }));

    expect(screen.queryByText("second-qr.jpg")).not.toBeInTheDocument();
    expect(screen.getAllByText("ऑनलाइन भुगतान सक्षम करने के लिए QR कोड चुनें।").length).toBeGreaterThan(0);
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:payment-qr-preview-2"));
  });

  it("preserves an existing QR with an opaque reference instead of a storage path", async () => {
    const user = userEvent.setup();
    paymentSettingsServiceMocks.loadAdminPaymentSettings.mockResolvedValueOnce({
      ok: true,
      data: createSavedSettings({
        amount: 500,
        instructions: "भुगतान पूरा करने के बाद स्क्रीनशॉट सुरक्षित रखें।",
        payeeName: "धोबी समाज",
        paymentEnabled: true,
        paymentTitle: "धोबी समाज सदस्य पंजीकरण शुल्क",
        publicContact: "payment-help@example.test",
        qrCodePath: "existing-qr-code",
        qrCodeSignedUrl: "https://signed.example/payment-qr.png",
        upiId: "samaj.test@upi"
      })
    });
    renderPaymentSettingsForm();

    expect(await screen.findByText("मौजूदा QR कोड")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "सेटिंग्स सुरक्षित रूप से सहेजें" }));

    await screen.findByRole("dialog", { name: "भुगतान सेटिंग्स सहेजी गईं" });
    expect(paymentSettingsServiceMocks.saveAdminPaymentSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        currentQrCodePath: "existing-qr-code"
      })
    );
  });

  it("keeps the existing QR and form mounted while editing incremental UPI values", async () => {
    const user = userEvent.setup();
    paymentSettingsServiceMocks.loadAdminPaymentSettings.mockResolvedValueOnce({
      ok: true,
      data: createSavedSettings({
        amount: 501,
        instructions: "भुगतान पूरा करने के बाद स्क्रीनशॉट सुरक्षित रखें।",
        payeeName: "धोबी समाज",
        paymentEnabled: true,
        paymentTitle: "धोबी समाज सदस्य पंजीकरण शुल्क",
        publicContact: "payment-help@example.test",
        qrCodePath: "existing-qr-code",
        qrCodeSignedUrl: "https://signed.example/payment-qr.png",
        upiId: "dhobi.local@upi"
      })
    });
    renderPaymentSettingsForm();

    expect(await screen.findByText("मौजूदा QR कोड")).toBeInTheDocument();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    const upiInput = screen.getByLabelText(/UPI आईडी/);
    const incrementalValues = [
      "",
      "d",
      "dh",
      "dhobi",
      "dhobi.local",
      "dhobi.local@",
      "dhobi.local@u",
      "dhobi.local@upi"
    ];

    for (const value of incrementalValues) {
      await user.clear(upiInput);
      if (value) {
        await user.type(upiInput, value);
      }

      expect(screen.getByText("मौजूदा QR कोड")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "UPI भुगतान विवरण" })).toBeInTheDocument();
      expect(screen.queryByText("पृष्ठ उपलब्ध नहीं है")).not.toBeInTheDocument();
      expect(paymentSettingsServiceMocks.saveAdminPaymentSettings).not.toHaveBeenCalled();
    }

    expect(upiInput).toHaveValue("dhobi.local@upi");
    expect(screen.getByText("UPI लिंक तैयार हो सकता है")).toBeInTheDocument();
  });

  it("shows inline UPI validation while preserving existing QR and avoiding automatic save", async () => {
    const user = userEvent.setup();
    paymentSettingsServiceMocks.loadAdminPaymentSettings.mockResolvedValueOnce({
      ok: true,
      data: createSavedSettings({
        amount: 501,
        instructions: "भुगतान पूरा करने के बाद स्क्रीनशॉट सुरक्षित रखें।",
        payeeName: "धोबी समाज",
        paymentEnabled: true,
        paymentTitle: "धोबी समाज सदस्य पंजीकरण शुल्क",
        publicContact: "payment-help@example.test",
        qrCodePath: "existing-qr-code",
        qrCodeSignedUrl: "https://signed.example/payment-qr.png",
        upiId: "dhobi.local@upi"
      })
    });
    renderPaymentSettingsForm();

    await screen.findByText("मौजूदा QR कोड");
    const upiInput = screen.getByLabelText(/UPI आईडी/);
    await user.clear(upiInput);
    await user.type(upiInput, "dhobi.local@");

    expect(screen.getByText("कृपया मान्य UPI आईडी दर्ज करें।")).toBeInTheDocument();
    expect(screen.getByText("UPI लिंक के लिए मान्य UPI आईडी आवश्यक है।")).toBeInTheDocument();
    expect(screen.getByText("मौजूदा QR कोड")).toBeInTheDocument();
    expect(paymentSettingsServiceMocks.saveAdminPaymentSettings).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "सेटिंग्स सुरक्षित रूप से सहेजें" }));

    expect(screen.getAllByText("कृपया मान्य UPI आईडी दर्ज करें।").length).toBeGreaterThan(0);
    expect(paymentSettingsServiceMocks.saveAdminPaymentSettings).not.toHaveBeenCalled();
  });

  it("saves a corrected UPI value once and preserves the existing QR preview", async () => {
    const user = userEvent.setup();
    paymentSettingsServiceMocks.loadAdminPaymentSettings.mockResolvedValueOnce({
      ok: true,
      data: createSavedSettings({
        amount: 501,
        instructions: "भुगतान पूरा करने के बाद स्क्रीनशॉट सुरक्षित रखें।",
        payeeName: "धोबी समाज",
        paymentEnabled: true,
        paymentTitle: "धोबी समाज सदस्य पंजीकरण शुल्क",
        publicContact: "payment-help@example.test",
        qrCodePath: "existing-qr-code",
        qrCodeSignedUrl: "https://signed.example/payment-qr.png",
        upiId: "dhobi.local@upi"
      })
    });
    renderPaymentSettingsForm();

    await screen.findByText("मौजूदा QR कोड");
    const upiInput = screen.getByLabelText(/UPI आईडी/);
    await user.clear(upiInput);
    await user.type(upiInput, "abc-123@upi");
    await user.click(screen.getByRole("button", { name: "सेटिंग्स सुरक्षित रूप से सहेजें" }));

    expect(
      await screen.findByRole("dialog", { name: "भुगतान सेटिंग्स सहेजी गईं" })
    ).toBeInTheDocument();
    expect(paymentSettingsServiceMocks.saveAdminPaymentSettings).toHaveBeenCalledTimes(1);
    expect(paymentSettingsServiceMocks.saveAdminPaymentSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        currentQrCodePath: "existing-qr-code",
        input: expect.objectContaining({
          upiId: "abc-123@upi"
        })
      })
    );
    expect(screen.getByText("मौजूदा QR कोड")).toBeInTheDocument();
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("https://signed.example/payment-qr.png");
  });

  it("keeps preview and summary stable while editing payee, fee, title, and instructions", async () => {
    const user = userEvent.setup();
    paymentSettingsServiceMocks.loadAdminPaymentSettings.mockResolvedValueOnce({
      ok: true,
      data: createSavedSettings({
        amount: 501,
        instructions: "भुगतान पूरा करने के बाद स्क्रीनशॉट सुरक्षित रखें।",
        payeeName: "धोबी समाज",
        paymentEnabled: true,
        paymentTitle: "धोबी समाज सदस्य पंजीकरण शुल्क",
        publicContact: "payment-help@example.test",
        qrCodePath: "existing-qr-code",
        qrCodeSignedUrl: "https://signed.example/payment-qr.png",
        upiId: "dhobi.local@upi"
      })
    });
    renderPaymentSettingsForm();

    await screen.findByText("मौजूदा QR कोड");
    await user.clear(screen.getByLabelText(/प्राप्तकर्ता का नाम/));
    await user.type(screen.getByLabelText(/प्राप्तकर्ता का नाम/), "नया प्राप्तकर्ता");
    await user.clear(screen.getByLabelText(/पंजीकरण शुल्क/));
    await user.type(screen.getByLabelText(/पंजीकरण शुल्क/), "abc");
    await user.clear(screen.getByLabelText(/भुगतान शीर्षक/));
    await user.type(screen.getByLabelText(/भुगतान शीर्षक/), "नई फीस");
    await user.clear(screen.getByLabelText(/भुगतान निर्देश/));
    await user.type(screen.getByLabelText(/भुगतान निर्देश/), "नई भुगतान निर्देश पंक्ति");

    expect(screen.getByText("मौजूदा QR कोड")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "सार्वजनिक भुगतान पृष्ठ का पूर्वावलोकन" })).toBeInTheDocument();
    expect(screen.getByText("UPI लिंक के लिए मान्य पंजीकरण शुल्क आवश्यक है।")).toBeInTheDocument();
    expect(screen.getByText("अमान्य")).toBeInTheDocument();
    expect(paymentSettingsServiceMocks.saveAdminPaymentSettings).not.toHaveBeenCalled();
  });

  it("sends an empty QR reference after removing an existing QR while disabled", async () => {
    const user = userEvent.setup();
    paymentSettingsServiceMocks.loadAdminPaymentSettings.mockResolvedValueOnce({
      ok: true,
      data: createSavedSettings({
        paymentEnabled: false,
        qrCodePath: "existing-qr-code",
        qrCodeSignedUrl: "https://signed.example/payment-qr.png"
      })
    });
    renderPaymentSettingsForm();

    expect(await screen.findByText("मौजूदा QR कोड")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "QR कोड हटाएं" }));
    await user.click(screen.getByRole("button", { name: "सेटिंग्स सुरक्षित रूप से सहेजें" }));

    await screen.findByRole("dialog", { name: "भुगतान सेटिंग्स सहेजी गईं" });
    expect(paymentSettingsServiceMocks.saveAdminPaymentSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        currentQrCodePath: null
      })
    );
  });

  it("confirms reset when dirty and clears selected QR values", async () => {
    const user = userEvent.setup();
    renderPaymentSettingsForm();

    await user.click(await findPaymentEnabledCheckbox());
    await user.upload(screen.getByLabelText("QR कोड इमेज"), createQrFile("reset-qr.webp", "image/webp"));
    await user.type(screen.getByLabelText(/UPI आईडी/), "samaj.test@upi");
    await user.click(screen.getByRole("button", { name: "परिवर्तन रीसेट करें" }));

    expect(screen.getByRole("dialog", { name: "सभी परिवर्तन रीसेट करें?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "रीसेट करें" }));

    expect(screen.getByRole("checkbox", { name: /ऑनलाइन भुगतान सक्षम करें/ })).not.toBeChecked();
    expect(screen.getByLabelText(/UPI आईडी/)).toHaveValue("");
    expect(screen.queryByText("reset-qr.webp")).not.toBeInTheDocument();
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:payment-qr-preview-1"));
  });

  it("protects the supported dashboard return action when the form is dirty", async () => {
    const user = userEvent.setup();
    renderPaymentSettingsForm();

    await findPaymentEnabledCheckbox();
    await user.type(screen.getByLabelText(/UPI आईडी/), "samaj.test@upi");
    await user.click(screen.getByRole("button", { name: "डैशबोर्ड पर वापस जाएं" }));

    expect(
      screen.getByRole("dialog", { name: "भुगतान सेटिंग्स के परिवर्तन छोड़ें?" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "यहीं रहें" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/admin/payment-settings");
  });
});
