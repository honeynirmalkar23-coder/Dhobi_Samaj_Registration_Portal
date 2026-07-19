export const errorMessages = {
  VALIDATION_ERROR: "कृपया भेजी गई जानकारी जांचें।",
  INVALID_REGISTRATION_ID: "मान्य पंजीकरण आईडी आवश्यक है।",
  INVALID_FILE: "चयनित फाइल मान्य नहीं है।",
  FILE_TOO_LARGE: "फाइल का आकार निर्धारित सीमा से अधिक है।",
  RATE_LIMITED: "बहुत अधिक अनुरोध किए गए हैं। कृपया कुछ समय बाद पुनः प्रयास करें।",
  PAYMENT_NOT_CONFIGURED: "भुगतान सेटिंग्स अभी उपलब्ध नहीं हैं।",
  PAYMENT_TOKEN_INVALID: "भुगतान प्रमाण जमा करने की अनुमति मान्य नहीं है।",
  PAYMENT_SUBMISSION_NOT_ALLOWED: "इस पंजीकरण के लिए भुगतान प्रमाण जमा करना अभी उपलब्ध नहीं है।",
  NOT_FOUND: "रिकॉर्ड उपलब्ध नहीं है।",
  CONFLICT: "यह रिकॉर्ड किसी अन्य प्रशासनिक कार्रवाई से बदल चुका है। कृपया नवीनतम जानकारी पुनः लोड करें।",
  INTERNAL_ERROR: "अभी अनुरोध पूरा नहीं हो सका। कृपया कुछ समय बाद पुनः प्रयास करें।"
} as const;

export type ApiErrorCode = keyof typeof errorMessages;

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;

  constructor(code: ApiErrorCode, status = 400, message = errorMessages[code]) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function toSafeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError("INTERNAL_ERROR", 500);
}
