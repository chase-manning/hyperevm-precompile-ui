import { useState } from "react";
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

function parseArg(value: string, type: InputConfig["type"]): unknown {
  const trimmed = value.trim();
  if (type === "address") return trimmed as `0x${string}`;
  if (type === "uint64") return BigInt(trimmed);
  return Number(trimmed);
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
  const canQuery = config.inputs.length === 0 || allInputsFilled;

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
}
