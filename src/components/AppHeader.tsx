import { Sun, Moon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RpcStatus } from "@/hooks/use-rpc-health";

interface AppHeaderProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  isCustomRpc: boolean;
  rpcStatus: RpcStatus;
}

export function AppHeader({
  theme,
  toggleTheme,
  showSettings,
  setShowSettings,
  isCustomRpc,
  rpcStatus,
}: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-3xl font-bold tracking-tight">
        Hyperliquid Precompile Explorer
      </h1>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings((prev) => !prev)}
              className={cn(
                "relative text-muted-foreground hover:text-foreground cursor-pointer",
                isCustomRpc && "text-primary border-primary/50"
              )}
              aria-label="Toggle settings"
              aria-expanded={showSettings}
              aria-controls="settings-panel"
            >
              <Settings className="h-4 w-4" />
              <span
                className={cn(
                  "absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full border border-background",
                  rpcStatus === "connected" && "bg-green-500",
                  rpcStatus === "slow" && "bg-yellow-400",
                  rpcStatus === "unreachable" && "bg-destructive",
                  rpcStatus === "checking" && "bg-yellow-400 animate-pulse"
                )}
                aria-label={`RPC status: ${rpcStatus}`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle settings</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
