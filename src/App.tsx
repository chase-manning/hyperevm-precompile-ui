import { useState, useMemo, useCallback, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Github, Settings, RotateCcw, Search } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useRpcHealth } from "@/hooks/use-rpc-health";
import { makePublicClient, DEFAULT_RPC_URL } from "@/config/client";
import { cn } from "@/lib/utils";
import { validateRpcUrl } from "@/lib/validation";
import {
  PrecompileCard,
  type PrecompileConfig,
} from "@/components/PrecompileCard";
import { RpcStatusIndicator } from "@/components/RpcStatusIndicator";
import { precompiles } from "@/config/precompiles";
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  STORAGE_KEYS,
} from "@/lib/local-storage";

const ALL_CATEGORY = "All";

const CATEGORIES = [
  ALL_CATEGORY,
  ...Array.from(new Set(precompiles.map((p) => p.badge))),
];

function getInitialCategory(): string {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  if (category && CATEGORIES.includes(category)) {
    return category;
  }
  return ALL_CATEGORY;
}

function getInitialSearch(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("search") || "";
}

function syncFiltersToUrl(search: string, category: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category && category !== ALL_CATEGORY) params.set("category", category);
  const qs = params.toString();
  const newUrl = qs
    ? `${window.location.pathname}?${qs}`
    : window.location.pathname;
  window.history.replaceState(null, "", newUrl);
}

function getStoredRpc(): string {
  return safeGetItem(STORAGE_KEYS.CUSTOM_RPC_URL) || "";
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [customRpc, setCustomRpc] = useState(getStoredRpc);
  const [search, setSearch] = useState(getInitialSearch);
  const [activeCategory, setActiveCategory] = useState(getInitialCategory);

  const rpcError = useMemo(() => validateRpcUrl(customRpc), [customRpc]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      syncFiltersToUrl(value, activeCategory);
    },
    [activeCategory]
  );

  const handleCategoryChange = useCallback(
    (category: string) => {
      setActiveCategory(category);
      syncFiltersToUrl(search, category);
    },
    [search]
  );

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setActiveCategory(ALL_CATEGORY);
    syncFiltersToUrl("", ALL_CATEGORY);
  }, []);

  const handleRpcChange = useCallback((value: string) => {
    setCustomRpc(value);
    const error = validateRpcUrl(value);
    if (error) {
      // Don't save invalid URLs to localStorage
      return;
    }
    if (value.trim()) {
      safeSetItem(STORAGE_KEYS.CUSTOM_RPC_URL, value.trim());
    } else {
      safeRemoveItem(STORAGE_KEYS.CUSTOM_RPC_URL);
    }
  }, []);

  const publicClient = useMemo(
    () =>
      makePublicClient(
        !rpcError && customRpc.trim() ? customRpc.trim() : undefined
      ),
    [customRpc, rpcError]
  );

  const filteredPrecompiles = useMemo(() => {
    return precompiles.filter((config) => {
      const matchesCategory =
        activeCategory === ALL_CATEGORY || config.badge === activeCategory;
      if (!matchesCategory) return false;

      if (!search.trim()) return true;

      const query = search.toLowerCase().trim();
      return (
        config.title.toLowerCase().includes(query) ||
        config.description.toLowerCase().includes(query) ||
        config.functionName.toLowerCase().includes(query) ||
        config.badge.toLowerCase().includes(query)
      );
    });
  }, [search, activeCategory]);

  const isCustomRpc = customRpc.trim().length > 0 && !rpcError;

  const {
    status: rpcStatus,
    blockNumber,
    latencyMs,
    recheck,
  } = useRpcHealth(publicClient);

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
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowSettings((prev) => !prev)}
                    className={cn(
                      "relative rounded-md border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer",
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
                        rpcStatus === "checking" &&
                          "bg-yellow-400 animate-pulse"
                      )}
                      aria-label={`RPC status: ${rpcStatus}`}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Toggle settings</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleTheme}
                    className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
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
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"}
                </TooltipContent>
              </Tooltip>
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
          )}
        </header>

        <Separator className="mb-10" />

        <section id="main-content">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
            Available Reads
          </h2>

          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search precompiles..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
                aria-label="Search precompiles by name or description"
              />
            </div>

            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Filter by category"
            >
              {CATEGORIES.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleCategoryChange(category)}
                    className="cursor-pointer"
                  >
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className={cn(
                        "transition-colors",
                        !isActive && "hover:bg-secondary/80"
                      )}
                    >
                      {category}
                    </Badge>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground" aria-live="polite">
              Showing {filteredPrecompiles.length} of {precompiles.length}{" "}
              precompile{precompiles.length !== 1 ? "s" : ""}
            </p>
          </div>

          {filteredPrecompiles.length > 0 ? (
            <div className="grid gap-4">
              {filteredPrecompiles.map((config) => (
                <PrecompileCard
                  key={config.functionName}
                  config={config}
                  publicClient={publicClient}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground mb-2">
                No precompiles match your filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="text-sm text-primary hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          )}
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
