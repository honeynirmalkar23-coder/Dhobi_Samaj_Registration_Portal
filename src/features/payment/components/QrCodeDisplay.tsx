import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { LoaderCircle, QrCode as QrCodeIcon } from "lucide-react";
import { useLanguage } from "../../language/LanguageContext";
import type { PublicPaymentSettings } from "../types/payment.types";
import { formatPaymentAmount } from "../utilities/payment-display.utils";
import { buildUpiDeepLink } from "../utilities/upi.utils";

type QrCodeDisplayProps = {
  settings: PublicPaymentSettings;
};

function hasPayableAmount(amount: number | null): amount is number {
  return typeof amount === "number" && Number.isFinite(amount) && amount > 0;
}

export function QrCodeDisplay({ settings }: QrCodeDisplayProps) {
  const { language, localized } = useLanguage();
  const upiDeepLink = buildUpiDeepLink(settings);
  const [generatedQrCodeUrl, setGeneratedQrCodeUrl] = useState<string | null>(null);
  const [generationState, setGenerationState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const amountLabel = formatPaymentAmount(settings.amount, language);
  const canGeneratePaymentQr = Boolean(upiDeepLink && hasPayableAmount(settings.amount));
  const displayQrCodeUrl = generatedQrCodeUrl ?? (!canGeneratePaymentQr ? settings.qrCodeUrl : null);

  useEffect(() => {
    let isMounted = true;

    if (!upiDeepLink || !canGeneratePaymentQr) {
      setGeneratedQrCodeUrl(null);
      setGenerationState("idle");
      return () => {
        isMounted = false;
      };
    }

    setGenerationState("loading");

    void QRCode.toDataURL(upiDeepLink, {
      errorCorrectionLevel: "M",
      margin: 3,
      type: "image/png",
      width: 720,
      color: {
        dark: "#000000ff",
        light: "#ffffffff"
      }
    })
      .then((url) => {
        if (!isMounted) {
          return;
        }

        setGeneratedQrCodeUrl(url);
        setGenerationState("ready");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setGeneratedQrCodeUrl(null);
        setGenerationState("error");
      });

    return () => {
      isMounted = false;
    };
  }, [canGeneratePaymentQr, upiDeepLink]);

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
      <h2 className="text-xl font-bold text-maroon-900">{localized("QR कोड", "QR code")}</h2>
      <div className="mt-4 flex aspect-square items-center justify-center rounded-lg border border-dashed border-maroon-700/20 bg-cream-50 p-4 text-center">
        {generationState === "loading" ? (
          <div className="flex flex-col items-center gap-3 text-brown-700">
            <LoaderCircle aria-hidden="true" className="h-10 w-10 animate-spin text-maroon-700" />
            <p className="text-sm font-semibold">
              {localized("राशि सहित QR कोड तैयार हो रहा है…", "Preparing QR code with amount…")}
            </p>
          </div>
        ) : displayQrCodeUrl ? (
          <img
            alt={canGeneratePaymentQr
              ? localized(
                  "सहेजी गई राशि के साथ तैयार किया गया UPI भुगतान QR कोड",
                  "UPI payment QR code generated with the saved amount"
                )
              : localized(
                  "प्रशासन द्वारा कॉन्फ़िगर किया गया भुगतान QR कोड",
                  "Payment QR code configured by administration"
                )}
            className="h-full w-full object-contain"
            decoding="async"
            src={displayQrCodeUrl}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-brown-700">
            <QrCodeIcon aria-hidden="true" className="h-12 w-12 text-maroon-700" />
            <p className="text-sm font-semibold">
              {localized(
                "QR कोड प्रशासन द्वारा कॉन्फ़िगर होने के बाद यहां दिखाई देगा।",
                "The QR code will appear here after it is configured by administration."
              )}
            </p>
          </div>
        )}
      </div>
      {canGeneratePaymentQr ? (
        <div className="mt-4 rounded-lg border border-communityGreen-600/20 bg-communityGreen-50 px-4 py-3 text-sm leading-7 text-brown-800">
          <p className="font-semibold text-communityGreen-800">
            {localized("स्कैन करने पर राशि दिखाई देनी चाहिए:", "Amount should appear after scanning:")}{" "}
            <span className="text-maroon-900">{amountLabel}</span>
          </p>
          <p className="mt-1">
            {localized(
              "यह QR कोड प्रशासन द्वारा सहेजे गए UPI विवरण और पंजीकरण शुल्क से अपने-आप तैयार किया गया है।",
              "This QR code is generated automatically from the UPI details and registration fee saved by the admin."
            )}
          </p>
        </div>
      ) : null}
      {generationState === "error" && settings.qrCodeUrl ? (
        <p className="mt-3 text-sm leading-7 text-brown-700">
          {localized(
            "राशि सहित QR तैयार नहीं हो सका, इसलिए सहेजा गया QR दिखाया जा रहा है। भुगतान से पहले राशि जांच लें।",
            "The amount-aware QR could not be prepared, so the saved QR is shown. Check the amount before paying."
          )}
        </p>
      ) : null}
    </section>
  );
}
