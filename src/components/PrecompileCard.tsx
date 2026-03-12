import { useState, useMemo } from "react";
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
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ResultDisplay } from "@/components/ResultDisplay";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
import { Info } from "lucide-react";
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

const UINT_RANGES: Record<string, { min: bigint; max: bigint }> = {
  uint16: { min: 0n, max: 65535n },
  uint32: { min: 0n, max: 4294967295n },
  uint64: { min: 0n, max: 18446744073709551615n },
};

function validateInput(
  value: string,
  type: InputConfig["type"]
): string | null {
  const trimmed = value.trim();

  if (trimmed === "") return null; // Empty is not an error (handled by allInputsFilled)

  if (type === "address") {
    if (!/^0x/i.test(trimmed)) {
      return "Address must start with 0x";
    }
    if (trimmed.length !== 42) {
      return "Address must be 42 characters long";
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
      return "Address contains invalid characters";
    }
    return null;
  }

  // Numeric types: uint16, uint32, uint64
  const range = UINT_RANGES[type];
  if (!range) return null;

  if (!/^-?\d+$/.test(trimmed)) {
    return `${type} must be a non-negative integer`;
  }

  try {
    const num = BigInt(trimmed);
    if (num < range.min) {
      return `${type} cannot be negative`;
    }
    if (num > range.max) {
      return `${type} max value is ${range.max.toString()}`;
    }
  } catch {
    return `Invalid ${type} value`;
  }

  return null;
}

export function parseArg(value: string, type: InputConfig["type"]): unknown {
  const trimmed = value.trim();
  if (type === "address") return trimmed as `0x${string}`;

  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`Invalid ${type} value: expected a non-negative integer.`);
  }

  const n = BigInt(trimmed);
  const max = UINT_RANGES[type]?.max;
  if (max !== undefined && n > max) {
    throw new Error(
      `Value exceeds maximum for ${type} (max ${max.toString()}).`
    );
  }

  if (type === "uint64") return n;
  return Number(n);
}

interface PrecompileCardProps {
  config: PrecompileConfig;
  publicClient: PublicClient;
}

export function PrecompileCard({ config, publicClient }: PrecompileCardProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string | null> = {};
    for (const input of config.inputs) {
      errors[input.name] = validateInput(
        values[input.name] || "",
        input.type
      );
    }
    return errors;
  }, [values, config.inputs]);

  const hasValidationErrors = Object.values(validationErrors).some(
    (e) => e !== null
  );

  const handleQuery = async () => {
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
  };

  const allInputsFilled = config.inputs.every(
    (input) => (values[input.name] || "").trim() !== ""
  );
  const canQuery =
    (config.inputs.length === 0 || allInputsFilled) && !hasValidationErrors;

  const disabledReason = hasValidationErrors
    ? "Fix validation errors before querying"
    : !allInputsFilled && config.inputs.length > 0
      ? "Fill in all fields before querying"
      : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{config.title}</CardTitle>
          <Badge variant="secondary">{config.badge}</Badge>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {config.inputs.map((input) => {
            const validationError = validationErrors[input.name];
            return (
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
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={`Info about ${input.label}`}
                        >
                          <Info className="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {input.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <Input
                  id={`${config.functionName}-${input.name}`}
                  placeholder={input.placeholder}
                  value={values[input.name] || ""}
                  aria-invalid={!!validationError}
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
                {validationError && (
                  <p className="text-xs text-destructive">{validationError}</p>
                )}
              </div>
            );
          })}

          <div className="relative group">
            <Button
              onClick={handleQuery}
              disabled={loading || !canQuery}
              className="w-full"
              size="sm"
            >
              {loading ? "Querying..." : "Query"}
            </Button>
            {disabledReason && !loading && (
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover border border-border px-2 py-1 text-xs text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                {disabledReason}
              </span>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
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
}
