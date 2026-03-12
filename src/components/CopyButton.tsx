import { memo, useCallback, useRef, useState } from "react";
import { Check, Copy, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

function serializeResult(data: unknown): string {
  return JSON.stringify(
    data,
    (_key, value) => (typeof value === "bigint" ? value.toString() : value),
    2
  );
}

interface CopyButtonProps {
  value: unknown;
  className?: string;
  /** Optional callback invoked after a successful copy */
  onCopied?: () => void;
  /** Show a text label next to the icon */
  label?: string;
  /** Button size variant */
  size?: "icon-xs" | "icon-sm" | "sm";
}

export const CopyButton = memo(function CopyButton({
  value,
  className,
  onCopied,
  label,
  size = "icon-xs",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      const text = typeof value === "string" ? value : serializeResult(value);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopied?.();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may not be available in some contexts
    }
  }, [value, onCopied]);

  if (label) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={size === "icon-xs" ? "sm" : size}
            className={className}
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy to clipboard"}
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-600 dark:text-green-400">
                  Copied!
                </span>
              </>
            ) : (
              <>
                <ClipboardCopy className="size-3.5" />
                <span className="text-xs">{label}</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {copied ? "Copied!" : "Copy result as formatted JSON"}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className={className}
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy to clipboard"}
        >
          {copied ? (
            <Check className="size-3 text-green-600 dark:text-green-400" />
          ) : (
            <Copy className="size-3" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied!" : "Copy"}</TooltipContent>
    </Tooltip>
  );
});
