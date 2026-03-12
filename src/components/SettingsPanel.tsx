import { RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RpcStatusIndicator } from "@/components/RpcStatusIndicator";
import { DEFAULT_RPC_URL } from "@/config/client";
import type { RpcStatus } from "@/hooks/use-rpc-health";

interface SettingsPanelProps {
  customRpc: string;
  isCustomRpc: boolean;
  rpcError: string | null;
  rpcStatus: RpcStatus;
  blockNumber: bigint | null;
  latencyMs: number | null;
  handleRpcChange: (value: string) => void;
  recheck: () => void;
}

export function SettingsPanel({
  customRpc,
  isCustomRpc,
  rpcError,
  rpcStatus,
  blockNumber,
  latencyMs,
  handleRpcChange,
  recheck,
}: SettingsPanelProps) {
  return (
    <div
      id="settings-panel"
      className="mt-6 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor="custom-rpc"
          className="text-sm font-medium text-foreground"
        >
          Custom RPC URL
        </label>
        {isCustomRpc && (
          <button
            onClick={() => handleRpcChange("")}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Reset to default
          </button>
        )}
      </div>
      <Input
        id="custom-rpc"
        placeholder={DEFAULT_RPC_URL}
        value={customRpc}
        aria-invalid={rpcError ? true : undefined}
        aria-describedby={rpcError ? "rpc-error" : undefined}
        onChange={(e) => handleRpcChange(e.target.value)}
      />
      {rpcError ? (
        <p
          id="rpc-error"
          className="mt-2 text-xs text-destructive"
          role="alert"
        >
          {rpcError}
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-muted-foreground">
            {isCustomRpc
              ? `Using custom RPC: ${customRpc.trim()}`
              : `Using default RPC: ${DEFAULT_RPC_URL}`}
          </p>
          <RpcStatusIndicator
            status={rpcStatus}
            blockNumber={blockNumber}
            latencyMs={latencyMs}
          />
          {isCustomRpc && rpcStatus === "unreachable" && (
            <div
              className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
              role="alert"
            >
              <span>
                Custom RPC is unreachable. Check the URL or{" "}
                <button
                  onClick={() => handleRpcChange("")}
                  className="underline underline-offset-2 font-medium hover:text-destructive/80 transition-colors cursor-pointer"
                >
                  revert to default
                </button>
                .
              </span>
              <button
                onClick={recheck}
                className="ml-auto shrink-0 underline underline-offset-2 font-medium hover:text-destructive/80 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
