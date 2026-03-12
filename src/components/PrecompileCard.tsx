import { memo, useCallback, useMemo, useState } from "react";
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
import { CopyButton } from "@/components/CopyButton";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
import { validateInput } from "@/lib/validation";
import {
  useAutoRefresh,
  REFRESH_INTERVALS,
  type RefreshInterval,
} from "@/hooks/use-auto-refresh";
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
  autoRefreshable?: boolean;
}

function parseArg(value: string, type: InputConfig["type"]): unknown {
  const trimmed = value.trim();
  if (type === "address") return trimmed as `0x${string}`;
  if (type === "uint64") {
    try {
      return BigInt(trimmed);
    } catch {
      throw new Error(`Invalid uint64 value: "${trimmed}"`);
    }
  }
  const num = Number(trimmed);
  if (Number.isNaN(num)) {
    throw new Error(`Invalid number: "${trimmed}"`);
  }
  return num;
}

function formatSecondsAgo(seconds: number): string {
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s ago`;
}

interface PrecompileCardProps {
  config: PrecompileConfig;
  publicClient: PublicClient;
}

export const PrecompileCard = memo(function PrecompileCard({
  config,
  publicClient,
}: PrecompileCardProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(10);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string | null> = {};
    for (const input of config.inputs) {
      errors[input.name] = validateInput(values[input.name] || "", input.type);
    }
    return errors;
  }, [values, config.inputs]);

  const hasValidationErrors = Object.values(validationErrors).some(
    (err) => err !== null
  );

  const allInputsFilled = config.inputs.every(
    (input) => (values[input.name] || "").trim() !== ""
  );
  const canQuery =
    (config.inputs.length === 0 || allInputsFilled) && !hasValidationErrors;

  const disabledReason = !allInputsFilled
    ? "Fill in all fields before querying"
    : hasValidationErrors
      ? "Fix validation errors before querying"
      : null;

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

  // Silent refresh: updates result without clearing existing data or showing loading state
  const handleSilentRefresh = useCallback(async () => {
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
      setError(null);
    } catch {
      // Silent refresh: don't clear existing result on error
    }
  }, [config.inputs, config.functionName, publicClient, values]);

  const autoRefresh = useAutoRefresh({
    enabled: !!config.autoRefreshable && hasQueried && canQuery && !loading,
    onRefresh: handleSilentRefresh,
    interval: refreshInterval,
  });

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
            const fieldError = validationErrors[input.name];
            const showError = touched[input.name] && fieldError;

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
                  aria-invalid={showError ? true : undefined}
                  aria-describedby={
                    showError
                      ? `${config.functionName}-${input.name}-error`
                      : undefined
                  }
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [input.name]: e.target.value,
                    }))
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, [input.name]: true }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canQuery && !loading) {
                      handleQuery();
                    }
                  }}
                />
                {showError && (
                  <p
                    id={`${config.functionName}-${input.name}-error`}
                    className="text-xs text-destructive"
                    role="alert"
                  >
                    {fieldError}
                  </p>
                )}
              </div>
            );
          })}

          {disabledReason ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="w-full block">
                  <Button
                    onClick={handleQuery}
                    disabled={loading || !canQuery}
                    className="w-full"
                    size="sm"
                  >
                    {loading ? "Querying..." : "Query"}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{disabledReason}</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={handleQuery}
              disabled={loading || !canQuery}
              className="w-full"
              size="sm"
            >
              {loading ? "Querying..." : "Query"}
            </Button>
          )}

          {config.autoRefreshable && hasQueried && canQuery && (
            <div className="flex items-center justify-between rounded-md bg-muted/50 border border-border px-3 py-2">
              <div className="flex items-center gap-2">
                {autoRefresh.isActive && (
                  <span
                    className="auto-refresh-pulse inline-block h-2 w-2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
                <label
                  htmlFor={`${config.functionName}-auto-refresh`}
                  className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
                >
                  Auto-refresh
                </label>
                <button
                  id={`${config.functionName}-auto-refresh`}
                  role="switch"
                  aria-checked={autoRefresh.isActive}
                  aria-label="Toggle auto-refresh"
                  onClick={autoRefresh.toggle}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
                    autoRefresh.isActive ? "bg-primary" : "bg-input"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                      autoRefresh.isActive ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {autoRefresh.isActive && autoRefresh.secondsAgo !== null && (
                  <span className="text-xs text-muted-foreground">
                    Updated {formatSecondsAgo(autoRefresh.secondsAgo)}
                  </span>
                )}
                <select
                  aria-label="Refresh interval"
                  value={refreshInterval}
                  onChange={(e) => {
                    setRefreshInterval(
                      Number(e.target.value) as RefreshInterval
                    );
                  }}
                  className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground cursor-pointer"
                >
                  {REFRESH_INTERVALS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

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
            <div className="relative rounded-md bg-muted/50 border border-border p-3">
              <div className="absolute top-1.5 right-1.5">
                <CopyButton value={result} />
              </div>
              <div className="pr-6">
                <ResultDisplay data={result} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
