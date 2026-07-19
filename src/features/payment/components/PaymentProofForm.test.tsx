import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicPaymentSettings } from "../types/payment.types";
import { PaymentProofForm } from "./PaymentProofForm";

const registrationId = "DS-2026-000001";
const paymentAccessToken = "browser-session-payment-token";
const acknowledgementDownloadUrl = `/api/local-portal/acknowledgements/${registrationId}.pdf?token=signed`;
const acknowledgementFilename = `Acknowledgement_${registrationId}.pdf`;

const paymentServiceMocks = vi.hoisted(() => ({
  downloadAcknowledgementPdf: vi.fn(),
  submitPaymentProof: vi.fn()
}));

vi.mock("../../../services/payment.service", () => paymentServiceMocks);

const activePaymentSettings: PublicPaymentSettings = {
  amount: 501,
  instructions: "भुगतान करने के बाद स्क्रीनशॉट जमा करें।",
  payeeName: "Dhobi Samaj",
  paymentDeadline: null,
  paymentEnabled: true,
  paymentTitle: "Registration Fee",
  publicContact: "Local contact",
  qrCodeUrl: "https://signed.example/payment-qr.png",
  upiId: "dhobi.local@upi"
};

function LocationProbe() {
  const location = useLocation();

  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderPaymentProofForm(options: {
  paymentResubmissionAllowed?: boolean;
  settings?: PublicPaymentSettings;
  token?: string;
} = {}) {
  return render(
    <MemoryRouter initialEntries={[`/payment/${registrationId}`]}>
      <PaymentProofForm
        paymentAccessToken={options.token ?? paymentAccessToken}
        paymentResubmissionAllowed={options.paymentResubmissionAllowed ?? false}
        registrationId={registrationId}
        settings={options.settings ?? activePaymentSettings}
      />
      <LocationProbe />
    </MemoryRouter>
  );
}

function createScreenshot(name = "payment-proof.png", type = "image/png", content: BlobPart = "proof") {
  return new File([content], name, { type });
}

function createSubmissionResult() {
  return {
    ok: true,
    data: {
      acknowledgementAvailable: true,
      acknowledgementDownloadUrl,
      acknowledgementNumber: `ACK-${registrationId}-TEST`,
      paymentStatus: "pending_verification",
      registrationId,
      registrationStatus: "submitted",
      submittedAt: "2026-07-16T00:00:00.000Z"
    }
  };
}

function createDeferredSubmission() {
  let resolve: (value: ReturnType<typeof createSubmissionResult>) => void = () => undefined;
  const promise = new Promise<ReturnType<typeof createSubmissionResult>>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return {
    promise,
    resolve
  };
}

async function completeRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(
    screen.getByLabelText(/स्क्रीनशॉट चुनें/),
    createScreenshot("payment-proof.webp", "image/webp")
  );
  await user.click(screen.getByLabelText(/मैं पुष्टि करता/));
}

async function submitValidProof(user: ReturnType<typeof userEvent.setup>) {
  await completeRequiredFields(user);
  await user.click(screen.getByRole("button", { name: "भुगतान प्रमाण जमा करें" }));
}

describe("PaymentProofForm", () => {
  beforeEach(() => {
    sessionStorage.clear();
    paymentServiceMocks.submitPaymentProof.mockReset();
    paymentServiceMocks.downloadAcknowledgementPdf.mockReset();
    paymentServiceMocks.submitPaymentProof.mockResolvedValue(createSubmissionResult());
    paymentServiceMocks.downloadAcknowledgementPdf.mockResolvedValue({
      ok: true,
      data: {
        blob: new Blob(["%PDF-1.7 test"], {
          type: "application/pdf"
        }),
        filename: acknowledgementFilename
      }
    });
    let objectUrlCount = 0;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => {
        objectUrlCount += 1;
        return `blob:payment-proof-object-url-${objectUrlCount}`;
      })
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn()
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows a screenshot preview and supports removal", async () => {
    const user = userEvent.setup();
    renderPaymentProofForm();

    await user.upload(
      screen.getByLabelText(/स्क्रीनशॉट चुनें/),
      createScreenshot("payment-proof.png", "image/png")
    );

    expect(screen.getByText("payment-proof.png")).toBeInTheDocument();
    expect(screen.getByAltText("चयनित भुगतान स्क्रीनशॉट का पूर्वावलोकन")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "स्क्रीनशॉट हटाएं" }));

    expect(screen.queryByText("payment-proof.png")).not.toBeInTheDocument();
    expect(screen.getAllByText("कृपया भुगतान स्क्रीनशॉट चुनें।").length).toBeGreaterThan(0);
  });

  it("rejects unsupported payment proof files", () => {
    renderPaymentProofForm();
    const dropTarget = screen.getByText("स्क्रीनशॉट चुनें").closest("label");

    fireEvent.drop(dropTarget as HTMLElement, {
      dataTransfer: {
        files: [
          new File(["pdf"], "payment-proof.pdf", {
            type: "application/pdf"
          })
        ]
      }
    });

    expect(
      screen.getAllByText("केवल JPG, JPEG, PNG या WebP स्क्रीनशॉट स्वीकार किए जाते हैं।")
        .length
    ).toBeGreaterThan(0);
  });

  it("rejects oversized payment proof screenshots", () => {
    renderPaymentProofForm();
    const dropTarget = screen.getByText("स्क्रीनशॉट चुनें").closest("label");

    fireEvent.drop(dropTarget as HTMLElement, {
      dataTransfer: {
        files: [
          new File([new Uint8Array(6 * 1024 * 1024)], "payment-proof.jpg", {
            type: "image/jpeg"
          })
        ]
      }
    });

    expect(
      screen.getAllByText("स्क्रीनशॉट का आकार 5 MB से अधिक नहीं होना चाहिए।").length
    ).toBeGreaterThan(0);
  });

  it("keeps submit disabled until screenshot, declaration, token, and payment settings are ready", async () => {
    const user = userEvent.setup();
    const disabledSettings = {
      ...activePaymentSettings,
      paymentEnabled: false
    };
    const { rerender } = render(
      <MemoryRouter initialEntries={[`/payment/${registrationId}`]}>
        <PaymentProofForm
          paymentAccessToken=""
          registrationId={registrationId}
          settings={activePaymentSettings}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "भुगतान प्रमाण जमा करें" })).toBeDisabled();

    rerender(
      <MemoryRouter initialEntries={[`/payment/${registrationId}`]}>
        <PaymentProofForm
          paymentAccessToken={paymentAccessToken}
          registrationId={registrationId}
          settings={disabledSettings}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "भुगतान प्रमाण जमा करें" })).toBeDisabled();

    rerender(
      <MemoryRouter initialEntries={[`/payment/${registrationId}`]}>
        <PaymentProofForm
          paymentAccessToken={paymentAccessToken}
          registrationId={registrationId}
          settings={activePaymentSettings}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole("button", { name: "भुगतान प्रमाण जमा करें" })).toBeDisabled();

    await user.upload(screen.getByLabelText(/स्क्रीनशॉट चुनें/), createScreenshot());
    expect(screen.getByRole("button", { name: "भुगतान प्रमाण जमा करें" })).toBeDisabled();

    await user.click(screen.getByLabelText(/मैं पुष्टि करता/));
    expect(screen.getByRole("button", { name: "भुगतान प्रमाण जमा करें" })).toBeEnabled();
  });

  it("submits proof once, waits for proof success before PDF download, and initiates the correct download", async () => {
    const user = userEvent.setup();
    const deferred = createDeferredSubmission();
    paymentServiceMocks.submitPaymentProof.mockReturnValueOnce(deferred.promise);
    renderPaymentProofForm();

    await completeRequiredFields(user);
    await user.dblClick(screen.getByRole("button", { name: "भुगतान प्रमाण जमा करें" }));

    expect(screen.getByRole("button", { name: "भुगतान प्रमाण जमा किया जा रहा है…" })).toBeDisabled();
    expect(paymentServiceMocks.submitPaymentProof).toHaveBeenCalledTimes(1);
    expect(paymentServiceMocks.downloadAcknowledgementPdf).not.toHaveBeenCalled();

    deferred.resolve(createSubmissionResult());

    expect(await screen.findByText("पावती तैयार की जा रही है…")).toBeInTheDocument();
    await screen.findByRole("heading", { name: "भुगतान प्रमाण जमा हो गया" });

    expect(paymentServiceMocks.downloadAcknowledgementPdf).toHaveBeenCalledTimes(1);
    expect(paymentServiceMocks.downloadAcknowledgementPdf).toHaveBeenCalledWith({
      downloadUrl: acknowledgementDownloadUrl,
      paymentAccessToken,
      registrationId
    });
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    expect(document.querySelector(`a[download="${acknowledgementFilename}"]`)).not.toBeInTheDocument();
    expect(screen.getByText("भुगतान प्रमाण सफलतापूर्वक जमा हो गया है। प्रशासनिक सत्यापन लंबित है।")).toBeInTheDocument();
    expect(screen.queryByText("भुगतान सत्यापित")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "पावती दोबारा डाउनलोड करें" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "स्थिति देखें" })).toHaveAttribute(
      "href",
      `/status?registrationId=${registrationId}`
    );
    expect(sessionStorage.getItem(`dhobi-payment-submission:${registrationId}`)).not.toContain("acknowledgements");
  });

  it("revokes the acknowledgement object URL after download initiation", async () => {
    const user = userEvent.setup();
    renderPaymentProofForm();

    await submitValidProof(user);
    await screen.findByRole("heading", { name: "भुगतान प्रमाण जमा हो गया" });

    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:payment-proof-object-url-2");
    await waitFor(
      () => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:payment-proof-object-url-2"),
      { timeout: 1500 }
    );
  });

  it("redirects home only after acknowledgement download starts and cleans up redirect timers", async () => {
    const originalSetTimeout = window.setTimeout;
    let redirectHandler: (() => void) | null = null;
    vi.spyOn(window, "setTimeout").mockImplementation(((handler, timeout, ...args) => {
      if (timeout === 5000 && typeof handler === "function") {
        redirectHandler = () => handler(...args);
        return 5;
      }

      return originalSetTimeout(handler as TimerHandler, timeout, ...args);
    }) as typeof window.setTimeout);
    const user = userEvent.setup();
    const { unmount } = renderPaymentProofForm();

    await submitValidProof(user);

    expect(await screen.findByText("5 सेकंड में होम पेज पर भेजा जाएगा।")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(`/payment/${registrationId}`);

    redirectHandler?.();
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/"));

    unmount();
  });

  it("allows staying on the page to cancel the automatic redirect", async () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const user = userEvent.setup();
    renderPaymentProofForm();

    await submitValidProof(user);
    await screen.findByText("5 सेकंड में होम पेज पर भेजा जाएगा।");
    await user.click(screen.getByRole("button", { name: "इस पेज पर रहें" }));

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent(`/payment/${registrationId}`);
  });

  it("keeps proof submitted and blocks immediate redirect when PDF download fails", async () => {
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");
    const user = userEvent.setup();
    paymentServiceMocks.downloadAcknowledgementPdf.mockResolvedValueOnce({
      code: "EMPTY_ACKNOWLEDGEMENT",
      message: "पावती PDF खाली है।",
      ok: false
    });
    renderPaymentProofForm();

    await submitValidProof(user);

    expect(await screen.findByText("भुगतान प्रमाण जमा हो गया है, लेकिन पावती स्वतः डाउनलोड नहीं हो सकी।")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "पावती डाउनलोड करें" })).toBeInTheDocument();

    expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 5000);
    expect(screen.getByTestId("location")).toHaveTextContent(`/payment/${registrationId}`);
    expect(paymentServiceMocks.submitPaymentProof).toHaveBeenCalledTimes(1);
  });

  it("manual PDF retry calls only the PDF endpoint and can restart the redirect", async () => {
    const user = userEvent.setup();
    paymentServiceMocks.downloadAcknowledgementPdf
      .mockResolvedValueOnce({
        code: "INVALID_ACKNOWLEDGEMENT_TYPE",
        message: "पावती PDF स्वरूप में उपलब्ध नहीं है।",
        ok: false
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          blob: new Blob(["%PDF-1.7 retry"], {
            type: "application/pdf"
          }),
          filename: acknowledgementFilename
        }
      });
    renderPaymentProofForm();

    await submitValidProof(user);
    await screen.findByRole("button", { name: "पावती डाउनलोड करें" });
    await user.click(screen.getByRole("button", { name: "पावती डाउनलोड करें" }));

    expect(paymentServiceMocks.submitPaymentProof).toHaveBeenCalledTimes(1);
    expect(paymentServiceMocks.downloadAcknowledgementPdf).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("5 सेकंड में होम पेज पर भेजा जाएगा।")).toBeInTheDocument();
  });

  it("renders inline API errors without invoking the success flow", async () => {
    const user = userEvent.setup();
    paymentServiceMocks.submitPaymentProof.mockResolvedValueOnce({
      code: "PAYMENT_SUBMISSION_NOT_ALLOWED",
      message: "भुगतान प्रमाण दोबारा जमा करने की अनुमति उपलब्ध नहीं है।",
      ok: false,
      status: 409
    });
    renderPaymentProofForm();

    await submitValidProof(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("भुगतान प्रमाण दोबारा जमा करने की अनुमति उपलब्ध नहीं है।");
    expect(paymentServiceMocks.downloadAcknowledgementPdf).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "भुगतान प्रमाण जमा हो गया" })).not.toBeInTheDocument();
  });

  it("restores a privacy-safe submitted state from sessionStorage after refresh", () => {
    sessionStorage.setItem(`dhobi-payment-submission:${registrationId}`, JSON.stringify({
      acknowledgementAvailable: true,
      paymentStatus: "pending_verification",
      registrationId,
      registrationStatus: "submitted",
      submittedAt: "2026-07-16T00:00:00.000Z"
    }));

    renderPaymentProofForm();

    expect(screen.getByRole("heading", { name: "भुगतान प्रमाण जमा हो गया" })).toBeInTheDocument();
    expect(screen.getByText("सत्यापन लंबित")).toBeInTheDocument();
    expect(screen.queryByText("भुगतान सत्यापित")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "भुगतान प्रमाण जमा हो गया" })).toBeDisabled();
  });

  it("clears the submitted marker when payment resubmission is allowed", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(`dhobi-payment-submission:${registrationId}`, JSON.stringify({
      acknowledgementAvailable: true,
      paymentStatus: "pending_verification",
      registrationId,
      registrationStatus: "submitted",
      submittedAt: "2026-07-16T00:00:00.000Z"
    }));

    renderPaymentProofForm({
      paymentResubmissionAllowed: true
    });

    expect(await screen.findByText("पिछले भुगतान प्रमाण की पुनः जमा अनुमति उपलब्ध है। कृपया नया स्क्रीनशॉट चुनकर प्रमाण दोबारा जमा करें।")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "भुगतान प्रमाण जमा हो गया" })).not.toBeInTheDocument();

    await completeRequiredFields(user);
    expect(screen.getByRole("button", { name: "भुगतान प्रमाण जमा करें" })).toBeEnabled();
  });

  it("shows unsaved-change confirmation for the supported back action", async () => {
    const user = userEvent.setup();
    renderPaymentProofForm();

    await user.upload(
      screen.getByLabelText(/स्क्रीनशॉट चुनें/),
      createScreenshot("payment-proof.jpg", "image/jpeg")
    );
    await user.click(screen.getByRole("button", { name: "वापस जाएं" }));

    expect(screen.getByRole("dialog", { name: "भुगतान प्रमाण छोड़ें?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "यहीं रहें" }));

    expect(screen.getByTestId("location")).toHaveTextContent(`/payment/${registrationId}`);
  });
});
