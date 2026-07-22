import { expect, test, type Page, type Request, type Response } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@example.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "local-e2e-password";
const upiId = "dhobi.e2e@upi";
const editedUpiId = "dhobi.edited@upi";
const payeeName = "Dhobi Samaj E2E";
const registrationFee = "501";
const paymentTitle = "Dhobi Samaj E2E Registration Fee";
const paymentInstructions = "Pay through your UPI app, then upload a clear screenshot for administrative verification.";
const publicContact = "E2E support contact";

const pngImage = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "प्रशासन लॉगिन" })).toBeVisible();
  await page.getByLabel("ईमेल पता").fill(adminEmail);
  await page.locator("#admin-password").fill(adminPassword);
  await page.getByRole("button", { name: "लॉगिन करें" }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

async function savePaymentSettings(page: Page) {
  await page.goto("/admin/payment-settings");
  await expect(page.getByRole("heading", { name: "भुगतान सेटिंग्स" })).toBeVisible();
  await expect(page.getByText("स्थानीय परीक्षण डेटा", { exact: true })).toBeVisible();
  await page.getByLabel("ऑनलाइन भुगतान सक्षम करें").check();
  await page.getByLabel("QR कोड इमेज").setInputFiles({
    buffer: pngImage,
    mimeType: "image/png",
    name: "e2e-qr.png"
  });
  await page.getByLabel("UPI आईडी").fill(upiId);
  await page.getByLabel("प्राप्तकर्ता का नाम").fill(payeeName);
  await page.getByLabel("पंजीकरण शुल्क").fill(registrationFee);
  await page.getByLabel("भुगतान शीर्षक").fill(paymentTitle);
  await page.getByLabel("भुगतान निर्देश").fill(paymentInstructions);
  await page.getByLabel("सार्वजनिक सहायता संपर्क").fill(publicContact);
  await page.getByRole("button", { name: "सेटिंग्स सुरक्षित रूप से सहेजें" }).click();
  await expect(page.getByRole("dialog", { name: "भुगतान सेटिंग्स सहेजी गईं" })).toBeVisible();
  await expect(page.getByText("भुगतान सेटिंग्स स्थानीय परीक्षण डेटाबेस में सहेजी गई हैं।")).toBeVisible();
  await page.getByRole("button", { name: "ठीक है" }).click();
  await page.reload();
  await expect(page.getByLabel("UPI आईडी")).toHaveValue(upiId);
  await expect(page.getByLabel("प्राप्तकर्ता का नाम")).toHaveValue(payeeName);
  await expect(page.getByAltText("चयनित भुगतान QR कोड का पूर्वावलोकन").first()).toBeVisible();
}

async function editUpiSettingsSafely(page: Page, pageErrors: string[]) {
  const unexpectedPutRequests: string[] = [];
  const requestListener = (request: Request) => {
    if (
      request.method() === "PUT" &&
      request.url().includes("/api/local-portal/admin/payment-settings")
    ) {
      unexpectedPutRequests.push(request.url());
    }
  };

  await page.goto("/admin/payment-settings");
  await expect(page.getByRole("heading", { name: "भुगतान सेटिंग्स" })).toBeVisible();
  await expect(page.getByAltText("चयनित भुगतान QR कोड का पूर्वावलोकन").first()).toBeVisible();

  const upiInput = page.getByLabel("UPI आईडी");
  await upiInput.click();
  await upiInput.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await upiInput.press("Backspace");
  page.on("request", requestListener);

  let typedValue = "";
  for (const character of editedUpiId) {
    typedValue += character;
    await upiInput.type(character, {
      delay: 15
    });
    await expect(page.getByRole("heading", { name: "भुगतान सेटिंग्स" })).toBeVisible();
    await expect(page.getByAltText("चयनित भुगतान QR कोड का पूर्वावलोकन").first()).toBeVisible();
    await expect(page.getByText("The page is not available")).toHaveCount(0);
    await expect(page.getByText("पृष्ठ उपलब्ध नहीं है")).toHaveCount(0);
    expect(pageErrors).toEqual([]);
    expect(page.url()).toContain("/admin/payment-settings");
    expect(await upiInput.inputValue()).toBe(typedValue);
  }

  await upiInput.fill("dhobi.local@");
  await expect(page.getByText("कृपया मान्य UPI आईडी दर्ज करें।").first()).toBeVisible();
  await expect(page.getByAltText("चयनित भुगतान QR कोड का पूर्वावलोकन").first()).toBeVisible();
  expect(unexpectedPutRequests).toEqual([]);

  await upiInput.fill(editedUpiId);
  await expect(page.getByText("UPI लिंक तैयार हो सकता है")).toBeVisible();
  page.off("request", requestListener);

  const saveResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/local-portal/admin/payment-settings") &&
    response.request().method() === "PUT"
  );
  await page.getByRole("button", { name: "सेटिंग्स सुरक्षित रूप से सहेजें" }).click();
  const saveResponse = await saveResponsePromise;

  expect(saveResponse.status()).toBe(200);
  await expect(page.getByRole("dialog", { name: "भुगतान सेटिंग्स सहेजी गईं" })).toBeVisible();
  await page.getByRole("button", { name: "ठीक है" }).click();
  await page.reload();
  await expect(page.getByLabel("UPI आईडी")).toHaveValue(editedUpiId);
  await expect(page.getByAltText("चयनित भुगतान QR कोड का पूर्वावलोकन").first()).toBeVisible();
}

async function createRegistration(page: Page) {
  await page.goto("/registration");
  await page.getByLabel("नाम").fill("E2E Applicant");
  await page.getByLabel("उम्र").fill("34");
  await page.getByLabel("मोबाइल नंबर").fill("9876543210");
  await page.getByLabel("शिक्षा स्तर").selectOption("graduate");
  await page.getByLabel("कक्षा / डिग्री / विषय").fill("Graduate");
  await page.getByLabel("स्थायी पता").fill("Ward 1, Local E2E Village, District Test, State Test");
  await page.locator("#registration-boys-count").fill("1");
  await page.locator("#registration-girls-count").fill("2");
  await page.locator("#registration-elders-count").fill("1");
  await page.getByLabel("फोटो चुनें").setInputFiles({
    buffer: pngImage,
    mimeType: "image/png",
    name: "e2e-applicant.png"
  });
  await page.getByLabel(/मैं पुष्टि करता\/करती हूं कि मेरे द्वारा दी गई जानकारी/).check();
  await page.getByRole("button", { name: "सहेजें और भुगतान पर जाएं" }).click();
  await expect(page).toHaveURL(/\/payment\/DS-\d{4}-\d{6}$/);

  return page.url().match(/\/payment\/(DS-\d{4}-\d{6})$/)?.[1] ?? "";
}

async function submitPaymentProof(page: Page, registrationId: string, expectedUpiId = upiId) {
  await expect(page.getByText(expectedUpiId)).toBeVisible();
  await expect(page.getByText(payeeName)).toBeVisible();
  await expect(page.getByText("₹501.00").first()).toBeVisible();
  await expect(page.getByAltText("सहेजी गई राशि के साथ तैयार किया गया UPI भुगतान QR कोड")).toBeVisible();
  await expect(page.getByText("स्कैन करने पर राशि दिखाई देनी चाहिए:")).toBeVisible();
  await page.getByLabel(/स्क्रीनशॉट चुनें/).setInputFiles({
    buffer: pngImage,
    mimeType: "image/png",
    name: "e2e-payment-proof.png"
  });
  await page.getByLabel(/मैं पुष्टि करता\/करती हूं कि चुना गया स्क्रीनशॉट/).check();

  let proofSucceeded = false;
  let acknowledgementRequestedBeforeProofSuccess = false;
  let paymentProofRequestCount = 0;
  const requestListener = (request: Request) => {
    if (request.url().includes("/api/local-portal/payment-proof")) {
      paymentProofRequestCount += 1;
    }

    if (request.url().includes("/api/local-portal/acknowledgements/") && !proofSucceeded) {
      acknowledgementRequestedBeforeProofSuccess = true;
    }
  };
  const responseListener = (response: Response) => {
    if (
      response.url().includes("/api/local-portal/payment-proof") &&
      response.request().method() === "POST" &&
      response.status() === 200
    ) {
      proofSucceeded = true;
    }
  };
  page.on("request", requestListener);
  page.on("response", responseListener);
  const proofResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/local-portal/payment-proof") &&
    response.request().method() === "POST"
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "भुगतान प्रमाण जमा करें" }).click();
  const proofResponse = await proofResponsePromise;

  expect(proofResponse.status()).toBe(200);
  const proofJson = await proofResponse.json();
  expect(proofJson).toMatchObject({
    data: {
      acknowledgementAvailable: true,
      paymentStatus: "pending_verification",
      registrationId,
      registrationStatus: "submitted"
    },
    success: true
  });
  const download = await downloadPromise;
  page.off("request", requestListener);
  page.off("response", responseListener);

  expect(paymentProofRequestCount).toBe(1);
  expect(acknowledgementRequestedBeforeProofSuccess).toBe(false);
  expect(download.suggestedFilename()).toBe(`Acknowledgement_${registrationId}.pdf`);
  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();

  if (!stream) {
    throw new Error("Downloaded acknowledgement stream was not available.");
  }

  const firstChunk = await new Promise<Buffer>((resolve, reject) => {
    stream.once("data", (chunk) => resolve(Buffer.from(chunk)));
    stream.once("error", reject);
  });

  expect(firstChunk.toString("utf8", 0, 5)).toBe("%PDF-");
  await expect(page.getByText("भुगतान प्रमाण सफलतापूर्वक जमा हो गया है। प्रशासनिक सत्यापन लंबित है।").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "पावती दोबारा डाउनलोड करें" })).toBeVisible();
  await expect(page.getByText("भुगतान सफल")).toHaveCount(0);
  await expect(page.getByText("भुगतान सत्यापित")).toHaveCount(0);
  await expect(page).toHaveURL("/", {
    timeout: 8_000
  });
}

async function lookupPublicStatus(page: Page, registrationId: string, expectedRegistrationText: string, expectedPaymentText: string) {
  await page.goto(`/status?registrationId=${registrationId}`);
  await page.getByRole("button", { name: "स्थिति देखें" }).click();
  await expect(page.getByText(registrationId).first()).toBeVisible();
  await expect(page.getByText(expectedRegistrationText).first()).toBeVisible();
  await expect(page.getByText(expectedPaymentText).first()).toBeVisible();
  await expect(page.getByText("E2E Applicant")).toHaveCount(0);
}

test("complete local registration, payment proof, admin review, and audit workflow", async ({ browser, page, request }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedApiResponses: string[] = [];
  const observePage = (observedPage: Page) => {
    observedPage.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });
    observedPage.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    observedPage.on("response", (response) => {
      if (response.url().includes("/api/") && response.status() >= 400) {
        failedApiResponses.push(`${response.status()} ${response.request().method()} ${response.url()}`);
      }
    });
  };

  observePage(page);
  await loginAsAdmin(page);
  await savePaymentSettings(page);
  await editUpiSettingsSafely(page, pageErrors);

  const publicContext = await browser.newContext({
    acceptDownloads: true,
    baseURL: "http://127.0.0.1:5173"
  });
  const publicPage = await publicContext.newPage();
  observePage(publicPage);
  const registrationId = await createRegistration(publicPage);

  expect(registrationId).toMatch(/^DS-\d{4}-\d{6}$/);
  await submitPaymentProof(publicPage, registrationId, editedUpiId);
  await lookupPublicStatus(publicPage, registrationId, "जमा किया गया", "सत्यापन लंबित");

  await page.goto("/admin/dashboard");
  await expect(page.getByText(registrationId).first()).toBeVisible();
  await expect(page.getByText("E2E Applicant").first()).toBeVisible();
  await page.getByRole("link", { name: "विवरण देखें" }).first().click();
  await expect(page).toHaveURL(new RegExp(`/admin/registrations/${registrationId}$`));
  await expect(page.getByAltText("सदस्य फोटो")).toBeVisible();
  await expect(page.getByAltText("भुगतान प्रमाण")).toBeVisible();
  await expect(page.getByText("applicant-photos/")).toHaveCount(0);
  await expect(page.getByText("payment-proofs/")).toHaveCount(0);

  const detailsResponse = await page.request.get(`/api/local-portal/admin/registrations/${registrationId}`);
  const detailsJson = await detailsResponse.json();
  expect(JSON.stringify(detailsJson)).not.toContain("applicant-photos/");
  expect(JSON.stringify(detailsJson)).not.toContain("payment-proofs/");

  const anonymousFileResponse = await request.get(
    detailsJson.data.applicantPhotoSignedUrl as string
  );
  expect([401, 403]).toContain(anonymousFileResponse.status());

  await page.getByRole("button", { name: "समीक्षा में मार्क करें" }).click();
  await expect(page.getByText("प्रशासनिक कार्रवाई सफलतापूर्वक पूरी हुई।")).toBeVisible();
  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("prompt");
    await dialog.accept("Screenshot unreadable in E2E test.");
  });
  await page.getByRole("button", { name: "भुगतान अस्वीकार करें" }).click();
  await expect(page.getByText("प्रशासनिक कार्रवाई सफलतापूर्वक पूरी हुई।")).toBeVisible();
  await lookupPublicStatus(publicPage, registrationId, "समीक्षा में", "भुगतान प्रमाण अस्वीकृत");

  await page.getByRole("button", { name: "भुगतान पुनः जमा सक्षम करें" }).click();
  await expect(page.getByText("प्रशासनिक कार्रवाई सफलतापूर्वक पूरी हुई।")).toBeVisible();
  await publicPage.goto(`/payment/${registrationId}`);
  await submitPaymentProof(publicPage, registrationId, editedUpiId);

  await page.goto(`/admin/registrations/${registrationId}`);
  await page.getByRole("button", { name: "भुगतान सत्यापित करें" }).click();
  await expect(page.getByText("प्रशासनिक कार्रवाई सफलतापूर्वक पूरी हुई।")).toBeVisible();
  await expect(page.getByRole("button", { name: "पंजीकरण स्वीकृत करें" })).toBeVisible();
  await page.getByRole("button", { name: "पंजीकरण स्वीकृत करें" }).click();
  await expect(page.getByText("प्रशासनिक कार्रवाई सफलतापूर्वक पूरी हुई।")).toBeVisible();
  await lookupPublicStatus(publicPage, registrationId, "स्वीकृत", "भुगतान सत्यापित");

  await page.goto("/admin/audit-logs");
  const expectAuditActionVisible = async (name: string) => {
    const matchingActions = page.getByRole("heading", {
      exact: true,
      name
    });

    await expect.poll(async () => matchingActions.count()).toBeGreaterThan(0);
    await expect(matchingActions.first()).toBeVisible();
  };

  await expectAuditActionVisible("भुगतान सेटिंग्स अपडेट");
  await expectAuditActionVisible("समीक्षा में मार्क");
  await expectAuditActionVisible("भुगतान अस्वीकृत");
  await expectAuditActionVisible("भुगतान पुनः जमा सक्षम");
  await expectAuditActionVisible("भुगतान सत्यापित");
  await expectAuditActionVisible("पंजीकरण स्वीकृत");

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedApiResponses).toEqual([]);

  await publicContext.close();
});
