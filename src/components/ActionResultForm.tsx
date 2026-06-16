"use client";

import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { ActionErrorDialog } from "@/components/ActionErrorDialog";
import { initialActionResult, type ActionResult } from "@/lib/actions/result";

export function ActionResultForm({
  action,
  children,
  className,
  successMessage = "操作已完成。",
}: {
  action: (previousState: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  successMessage?: string;
}) {
  const [state, formAction] = useActionState(action, initialActionResult);
  const [dismissedErrorId, setDismissedErrorId] = useState<number>();
  const visibleError = state.error && state.errorId !== dismissedErrorId ? state.error : undefined;

  return (
    <form action={formAction} className={className}>
      <ActionErrorDialog error={visibleError} onClose={() => setDismissedErrorId(state.errorId)} />
      {children}
      {state.ok ? <p className="rounded-md bg-[#e4fbf4] px-3 py-2 text-sm font-black text-[#006b64]">{successMessage}</p> : null}
    </form>
  );
}
