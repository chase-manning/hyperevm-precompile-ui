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
import { ResultDisplay } from "@/components/ResultDisplay";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
import { validateInput } from "@/lib/validation";
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
  if (type === "uint64") {
    try {
      return BigInt(trimmed);
    } catch {
      throw new Error(`Invalid uint64 value: "${trimmed}"`);
    }
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid number: "${trimmed}"`);
  }
  return n;
}

interface PrecompileCardProps {
  config: PrecompileConfig;
  publicClient: PublicClient;
}

export function PrecompileCard({ config, publicClient }: PrecompileCardProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
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

  const allInputsFilled = config.inputs.every(
    (input) => (values[input.name] || "").trim() !== ""
  );
  const canQuery =
    (config.inputs.length === 0 || allInputsFilled) && !hasValidationErrors;

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
                <Label htmlFor={`${config.functionName}-${input.name}`}>
                  {input.label}
                </Label>
                <Input
                  id={`${config.functionName}-${input.name}`}
                  placeholder={input.placeholder}
                  value={values[input.name] || ""}
                  aria-invalid={!!showError}
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
                  <p className="text-xs text-destructive">{fieldError}</p>
                )}
              </div>
            );
          })}

          <Button
            onClick={handleQuery}
            disabled={loading || !canQuery}
            className="w-full"
            size="sm"
            title={
              hasValidationErrors
                ? "Fix validation errors before querying"
                : !allInputsFilled && config.inputs.length > 0
                  ? "Fill in all fields before querying"
                  : undefined
            }
          >
            {loading ? "Querying..." : "Query"}
          </Button>

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
