import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  size?: "icon-xs" | "icon-sm";
}

export function CopyButton({
  value,
  className,
  size = "icon-xs",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // Clipboard API not available
      }
    },
    [value]
  );

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleCopy}
      className={cn(
        "text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? <Check className="text-green-500" /> : <Copy />}
    </Button>
  );
}
