import { RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DEFAULT_RPC_URL } from "@/config/client";

interface SettingsPanelProps {
  customRpc: string;
  isCustomRpc: boolean;
  onRpcChange: (value: string) => void;
}

export function SettingsPanel({
  customRpc,
  isCustomRpc,
  onRpcChange,
}: SettingsPanelProps) {
  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor="custom-rpc"
          className="text-sm font-medium text-foreground"
        >
          Custom RPC URL
        </label>
        {isCustomRpc && (
          <button
            onClick={() => onRpcChange("")}
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
        onChange={(e) => onRpcChange(e.target.value)}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {isCustomRpc
          ? `Using custom RPC: ${customRpc.trim()}`
          : `Using default RPC: ${DEFAULT_RPC_URL}`}
      </p>
    </div>
  );
}
