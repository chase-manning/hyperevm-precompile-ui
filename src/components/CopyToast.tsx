import { memo } from "react";
import { Check } from "lucide-react";
import type { CopyToastState } from "@/hooks/use-copy-toast";

interface CopyToastProps {
  toast: CopyToastState;
}

export const CopyToast = memo(function CopyToast({ toast }: CopyToastProps) {
  if (!toast.visible) return null;

  return (
    <div
      className="copy-toast-enter fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg"
      role="status"
      aria-live="polite"
    >
      <Check className="size-4" />
      {toast.message}
    </div>
  );
});
