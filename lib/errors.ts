import type { AnalyzeError } from "./schemas";

export class AnalyzeFailure extends Error {
  readonly code: AnalyzeError["error"]["code"];
  readonly retryable: boolean;
  readonly status: number;

  constructor(
    code: AnalyzeError["error"]["code"],
    message: string,
    options?: { retryable?: boolean; status?: number },
  ) {
    super(message);
    this.name = "AnalyzeFailure";
    this.code = code;
    this.retryable = options?.retryable ?? true;
    this.status = options?.status ?? 500;
  }

  toJSON(): AnalyzeError {
    return {
      ok: false,
      error: {
        code: this.code,
        message: this.message,
        retryable: this.retryable,
      },
    };
  }
}
