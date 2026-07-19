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

export type ServiceResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      code: string;
      message: string;
      status?: number;
    };

export function serviceSuccess<T>(data: T): ServiceResult<T> {
  return {
    ok: true,
    data
  };
}

export function serviceFailure<T = never>(
  code: string,
  message: string,
  status?: number
): ServiceResult<T> {
  const failure: ServiceResult<T> = {
    ok: false,
    code,
    message
  };

  if (typeof status === "number") {
    failure.status = status;
  }

  return failure;
}
