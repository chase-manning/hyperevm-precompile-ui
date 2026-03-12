import { useState, useEffect, useRef, useCallback } from "react";
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
import { Link, Check } from "lucide-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
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
  if (type === "uint64") return BigInt(trimmed);
  return Number(trimmed);
}

interface PrecompileCardProps {
  config: PrecompileConfig;
  publicClient: PublicClient;
  initialValues?: Record<string, string>;
  autoExecute?: boolean;
  targetRef?: React.RefObject<HTMLDivElement | null>;
}

export function PrecompileCard({
  config,
  publicClient,
  initialValues,
  autoExecute,
  targetRef,
}: PrecompileCardProps) {
  const [values, setValues] = useState<Record<string, string>>(
    initialValues ?? {}
  );
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasAutoExecuted = useRef(false);

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
  }, [config, values, publicClient]);

  useEffect(() => {
    if (autoExecute && !hasAutoExecuted.current) {
      hasAutoExecuted.current = true;
      const allFilled = config.inputs.every(
        (input) => (values[input.name] || "").trim() !== ""
      );
      const ready = config.inputs.length === 0 || allFilled;
      if (ready) {
        handleQuery();
      }
    }
  }, [autoExecute, config.inputs, values, handleQuery]);

  const handleShare = useCallback(() => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("fn", config.functionName);
    for (const input of config.inputs) {
      const val = (values[input.name] || "").trim();
      if (val) {
        url.searchParams.set(input.name, val);
      }
    }
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [config, values]);

  const allInputsFilled = config.inputs.every(
    (input) => (values[input.name] || "").trim() !== ""
  );
  const canQuery = config.inputs.length === 0 || allInputsFilled;

  return (
    <Card ref={targetRef}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{config.title}</CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Copy link to this query"
              title="Copy link to this query"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Link className="h-3.5 w-3.5" />
              )}
            </button>
            <Badge variant="secondary">{config.badge}</Badge>
          </div>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {config.inputs.map((input) => (
            <div key={input.name} className="space-y-1.5">
              <Label htmlFor={`${config.functionName}-${input.name}`}>
                {input.label}
              </Label>
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
