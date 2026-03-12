import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ResultDisplay } from "@/components/ResultDisplay";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
import { Info, Link } from "lucide-react";
import type { PublicClient } from "viem";
import type { ExtractAbiFunctionNames } from "abitype";

type ContractFunctionName = ExtractAbiFunctionNames<
  typeof CONTRACT_ABI,
  "view"
>;

export interface InputConfig {
  name: string;
  label: string;
  placeholder: string;
  type: "address" | "uint16" | "uint32" | "uint64";
  tooltip?: string;
}

export interface PrecompileConfig {
  functionName: ContractFunctionName;
  title: string;
  description: string;
  badge: string;
  inputs: InputConfig[];
}

function parseArg(value: string, type: InputConfig["type"]): unknown {
  const trimmed = value.trim();
  if (type === "address") return trimmed as `0x${string}`;

  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`Invalid ${type} value: expected a non-negative integer`);
  }

  if (type === "uint64") {
    const val = BigInt(trimmed);
    if (val > BigInt("18446744073709551615")) {
      throw new Error("Invalid uint64 value: exceeds max uint64");
    }
    return val;
  }

  const num = Number(trimmed);
  if (type === "uint16" && (num > 65535 || !Number.isInteger(num))) {
    throw new Error("Invalid uint16 value: exceeds max uint16 (65535)");
  }
  if (type === "uint32" && (num > 4294967295 || !Number.isInteger(num))) {
    throw new Error("Invalid uint32 value: exceeds max uint32 (4294967295)");
  }
  return num;
}

interface PrecompileCardProps {
  config: PrecompileConfig;
  publicClient: PublicClient;
  initialValues?: Record<string, string>;
  autoExecute?: boolean;
  targeted?: boolean;
}

function buildShareUrl(config: PrecompileConfig, values: Record<string, string>): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("fn", config.functionName);
  for (const input of config.inputs) {
    const val = (values[input.name] || "").trim();
    if (val) {
      url.searchParams.set(input.name, val);
    }
  }
  return url.toString();
}

export const PrecompileCard = memo(function PrecompileCard({
  config,
  publicClient,
  initialValues,
  autoExecute,
  targeted,
}: PrecompileCardProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues ?? {});
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleQuery = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setHasQueried(true);

    try {
      const args = config.inputs.map((input) =>
        parseArg(values[input.name] || "", input.type)
      );

      const data = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: config.functionName,
        args: (args.length > 0 ? args : undefined) as never,
      });

      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        const precompileMatch = msg.match(/PrecompileLib__\w+/);
        if (precompileMatch) {
          setError(precompileMatch[0].replace("PrecompileLib__", ""));
        } else if (msg.includes("reverted")) {
          setError("Contract call reverted. Check your inputs.");
        } else {
          setError(msg.length > 200 ? msg.slice(0, 200) + "..." : msg);
        }
      } else {
        setError("Query failed");
      }
    } finally {
      setLoading(false);
    }
  }, [config.inputs, config.functionName, publicClient, values]);

  useEffect(() => {
    if (targeted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [targeted]);

  const hasAutoExecuted = useRef(false);
  useEffect(() => {
    if (autoExecute && !hasAutoExecuted.current) {
      hasAutoExecuted.current = true;
      handleQuery();
    }
  }, [autoExecute, handleQuery]);

  const handleShare = useCallback(() => {
    const url = buildShareUrl(config, values);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setError("Failed to copy link to clipboard");
    });
  }, [config, values]);

  const allInputsFilled = config.inputs.every(
    (input) => (values[input.name] || "").trim() !== ""
  );
  const canQuery = config.inputs.length === 0 || allInputsFilled;

  return (
    <Card ref={cardRef} className={targeted ? "ring-2 ring-primary" : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{config.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleShare}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label={`Copy link to ${config.title}`}
                >
                  <Link className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? "Copied!" : "Copy share link"}
              </TooltipContent>
            </Tooltip>
            <Badge variant="secondary">{config.badge}</Badge>
          </div>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {config.inputs.map((input) => (
            <div key={input.name} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor={`${config.functionName}-${input.name}`}>
                  {input.label}
                </Label>
                {input.tooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-help"
                        aria-label={`Info about ${input.label}`}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{input.tooltip}</TooltipContent>
                  </Tooltip>
                )}
              </div>
              <Input
                id={`${config.functionName}-${input.name}`}
                placeholder={input.placeholder}
                value={values[input.name] || ""}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [input.name]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canQuery && !loading) {
                    handleQuery();
                  }
                }}
              />
            </div>
          ))}

          <Button
            onClick={handleQuery}
            disabled={loading || !canQuery}
            className="w-full"
            size="sm"
          >
            {loading ? "Querying..." : "Query"}
          </Button>

          {error && (
            <div
              className="rounded-md bg-destructive/10 border border-destructive/20 p-3"
              role="alert"
              aria-live="assertive"
            >
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {result !== null && !error && hasQueried && (
            <div className="rounded-md bg-muted/50 border border-border p-3">
              <ResultDisplay data={result} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
