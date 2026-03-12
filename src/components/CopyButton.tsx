import { useState, useCallback, useRef, useEffect } from "react";
import { Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  size?: "icon-xs" | "icon-sm";
}

function fallbackCopyText(text: string): void {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function CopyButton({
  value,
  className,
  size = "icon-xs",
}: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(value);
        setState("copied");
      } catch {
        try {
          fallbackCopyText(value);
          setState("copied");
        } catch {
          setState("error");
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setState("idle"), 1500);
    },
    [value]
  );

  const icon =
    state === "copied" ? (
      <Check className="text-green-500" />
    ) : state === "error" ? (
      <X className="text-red-500" />
    ) : (
      <Copy />
    );

  const title =
    state === "copied"
      ? "Copied!"
      : state === "error"
        ? "Copy failed"
        : "Copy to clipboard";

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleCopy}
      className={cn(
        "text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      title={title}
    >
      {icon}
    </Button>
  );
}
