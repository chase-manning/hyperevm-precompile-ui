import { Sun, Moon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { SettingsPanel } from "@/components/SettingsPanel";

interface AppHeaderProps {
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  customRpc: string;
  onRpcChange: (value: string) => void;
}

export function AppHeader({
  showSettings,
  setShowSettings,
  customRpc,
  onRpcChange,
}: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  const isCustomRpc = customRpc.trim().length > 0;

  return (
    <header className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Hyperliquid Precompile Explorer
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings((prev) => !prev)}
            className={
              isCustomRpc ? "text-primary border-primary/50" : "text-muted-foreground"
            }
            aria-label="Toggle settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
        A lightweight interface for reading on chain data from{" "}
        <a
          href="https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/interacting-with-hypercore"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
        >
          Hyperliquid precompiles
        </a>
        . Query oracle prices, positions, balances, and more directly from
        HyperCore, with results guaranteed to match the latest L1 state.
      </p>

      {showSettings && (
        <SettingsPanel
          customRpc={customRpc}
          onRpcChange={onRpcChange}
        />
      )}
    </header>
  );
}
