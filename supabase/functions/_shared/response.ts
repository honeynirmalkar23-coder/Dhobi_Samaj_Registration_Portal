export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function jsonResponse<T>(
  body: ApiResponse<T>,
  status = body.success ? 200 : 400,
  headers: HeadersInit = {}
): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers
    },
    status
  });
}

export function successResponse<T>(
  data: T,
  headers: HeadersInit = {},
  status = 200
): Response {
  return jsonResponse(
    {
      success: true,
      data
    },
    status,
    headers
  );
}

export function failureResponse(
  code: string,
  message: string,
  status = 400,
  headers: HeadersInit = {}
): Response {
  return jsonResponse(
    {
      success: false,
      error: {
        code,
        message
      }
    },
    status,
    headers
  );
}
