import type { ServiceResult } from "../api.types";

export type LocalApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
    };

export type LocalPortalClientResult<T> = Promise<ServiceResult<T>>;

