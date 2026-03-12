import { useState, useMemo, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sun, Moon, Github, Settings, RotateCcw } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { makePublicClient, DEFAULT_RPC_URL } from "@/config/client";
import { cn } from "@/lib/utils";
import { PrecompileCard } from "@/components/PrecompileCard";
import { precompiles } from "@/config/precompiles";
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  STORAGE_KEYS,
} from "@/lib/local-storage";

function getStoredRpc(): string {
  return safeGetItem(STORAGE_KEYS.CUSTOM_RPC_URL) || "";
}

const CATEGORIES = ["System", "User", "Perps", "Spot", "Vaults", "Staking"];

function getUrlParams(): {
  fn: string | null;
  category: string | null;
  inputValues: Record<string, string>;
} {
  const params = new URLSearchParams(window.location.search);
  const fn = params.get("fn");
  const category = params.get("category");
  const inputValues: Record<string, string> = {};

  if (fn) {
    const config = precompiles.find((p) => p.functionName === fn);
    if (config) {
      for (const input of config.inputs) {
        const val = params.get(input.name);
        if (val) {
          inputValues[input.name] = val;
        }
      }
    }
  }

  return { fn, category, inputValues };
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [customRpc, setCustomRpc] = useState(getStoredRpc);

  const urlParams = useMemo(() => getUrlParams(), []);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    urlParams.category
  );

  const handleRpcChange = useCallback((value: string) => {
    setCustomRpc(value);
    if (value.trim()) {
      safeSetItem(STORAGE_KEYS.CUSTOM_RPC_URL, value.trim());
    } else {
      safeRemoveItem(STORAGE_KEYS.CUSTOM_RPC_URL);
    }
  }, []);

  const publicClient = useMemo(
    () => makePublicClient(customRpc.trim() || undefined),
    [customRpc]
  );

  const handleCategoryChange = useCallback(
    (category: string | null) => {
      setActiveCategory(category);
      const url = new URL(window.location.href);
      if (category) {
        url.searchParams.set("category", category);
      } else {
        url.searchParams.delete("category");
      }
      // Preserve fn param if present
      if (!urlParams.fn) {
        url.searchParams.delete("fn");
      }
      window.history.replaceState({}, "", url.toString());
    },
    [urlParams.fn]
  );

  const filteredPrecompiles = useMemo(() => {
    if (!activeCategory) return precompiles;
    return precompiles.filter((p) => p.badge === activeCategory);
  }, [activeCategory]);

  const isCustomRpc = customRpc.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
      >
        Skip to content
      </a>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold tracking-tight">
              Hyperliquid Precompile Explorer
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings((prev) => !prev)}
                className={cn(
                  "rounded-md border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer",
                  isCustomRpc && "text-primary border-primary/50"
                )}
                aria-label="Toggle settings"
                aria-expanded={showSettings}
                aria-controls="settings-panel"
                title="Toggle settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={toggleTheme}
                className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                aria-label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                title={
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
              </button>
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
                onChange={(e) => handleRpcChange(e.target.value)}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {isCustomRpc
                  ? `Using custom RPC: ${customRpc.trim()}`
                  : `Using default RPC: ${DEFAULT_RPC_URL}`}
              </p>
            </div>
          )}
        </header>

        <Separator className="mb-10" />

        <section id="main-content">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
            Available Reads
          </h2>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => handleCategoryChange(null)}
              className="cursor-pointer"
            >
              <Badge
                variant={activeCategory === null ? "default" : "secondary"}
              >
                All
              </Badge>
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  handleCategoryChange(activeCategory === cat ? null : cat)
                }
                className="cursor-pointer"
              >
                <Badge
                  variant={activeCategory === cat ? "default" : "secondary"}
                >
                  {cat}
                </Badge>
              </button>
            ))}
          </div>
          <div className="grid gap-4">
            {filteredPrecompiles.map((config) => {
              const isTargeted = urlParams.fn === config.functionName;
              const hasAllInputs =
                config.inputs.length === 0 ||
                config.inputs.every(
                  (input) =>
                    (urlParams.inputValues[input.name] || "").trim() !== ""
                );
              return (
                <PrecompileCard
                  key={config.functionName}
                  config={config}
                  publicClient={publicClient}
                  targeted={isTargeted}
                  initialValues={isTargeted ? urlParams.inputValues : undefined}
                  autoExecute={isTargeted && hasAllInputs}
                />
              );
            })}
          </div>
        </section>

        <Separator className="mt-10 mb-6" />

        <footer className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
          <div>
            Reading from contract{" "}
            <a
              href="https://hyperevmscan.io/address/0x4e4726F2D4F652151Eb80254C2C8859d152382Ce"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">
                0x4e47...82Ce
              </code>
            </a>{" "}
            on HyperEVM
          </div>
          <a
            href="https://github.com/chase-manning/hyperevm-precompile-ui"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            Open source on GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
