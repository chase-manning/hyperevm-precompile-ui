import { useState, useCallback, useRef, useEffect } from "react";
import { Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "error";

interface CopyButtonProps {
  value: string;
  className?: string;
  size?: "icon-xs" | "icon-sm";
}

export function CopyButton({ value, className, size = "icon-xs" }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setState("copied");
    } catch {
      setState("error");
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setState("idle"), 1500);
  }, [value]);

  const Icon = state === "copied" ? Check : state === "error" ? X : Copy;

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn(
        "cursor-pointer",
        state === "copied" && "text-green-500 hover:text-green-500",
        state === "error" && "text-red-500 hover:text-red-500",
        className
      )}
      onClick={handleCopy}
      title={
        state === "copied"
          ? "Copied!"
          : state === "error"
            ? "Copy failed"
            : "Copy to clipboard"
      }
    >
      <Icon />
    </Button>
  );
}
