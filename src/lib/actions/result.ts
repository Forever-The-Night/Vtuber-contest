export type ActionResult = {
  error?: string;
  errorId?: number;
  ok: boolean;
};

export const initialActionResult: ActionResult = { ok: false };

export function toActionError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "操作失败，请稍后重试。";
}
