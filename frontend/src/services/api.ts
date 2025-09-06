import axios, { type AxiosInstance, type AxiosResponse } from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

const client: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

export interface ApiErrorPayload {
  error: string;
  details?: string | null;
}

export class ApiError extends Error {
  public status?: number;
  public details?: string | null;

  constructor(message: string, status?: number, details?: string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details ?? null;

    if ("captureStackTrace" in Error) {
      (
        Error as typeof Error & {
          captureStackTrace?: (target: object, ctor: typeof ApiError) => void;
        }
      ).captureStackTrace?.(this, ApiError);
    }
  }
}

client.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: unknown) => {
    if (err && typeof err === "object" && "response" in err) {
      const axiosErr = err as { response: AxiosResponse & { data?: unknown } };
      const { response } = axiosErr;
      if (response && typeof response.data === "object") {
        const payload = response.data as ApiErrorPayload;
        const message = payload.error ?? response.statusText ?? "Request error";
        return Promise.reject(
          new ApiError(message, response.status, payload.details ?? null)
        );
      }
      return Promise.reject(
        new ApiError(response.statusText ?? "Request error", response.status)
      );
    }

    if (err instanceof Error) {
      return Promise.reject(new ApiError(err.message));
    }

    return Promise.reject(new ApiError("Unknown error"));
  }
);

export default client;
