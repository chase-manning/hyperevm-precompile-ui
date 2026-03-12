import { useState, useMemo, useCallback, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useRpcHealth } from "@/hooks/use-rpc-health";
import { makePublicClient } from "@/config/client";
import { cn } from "@/lib/utils";
import { validateRpcUrl } from "@/lib/validation";
import { PrecompileCard } from "@/components/PrecompileCard";
import { AppHeader } from "@/components/AppHeader";
import { SettingsPanel } from "@/components/SettingsPanel";
import { AppFooter } from "@/components/AppFooter";
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  STORAGE_KEYS,
} from "@/lib/local-storage";
import { precompiles } from "@/config/precompiles";

const CATEGORIES = [
  "All",
  "System",
  "User",
  "Perps",
  "Spot",
  "Vaults",
  "Staking",
] as const;

type Category = (typeof CATEGORIES)[number];

function getCategoryFromUrl(): Category {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  if (category && CATEGORIES.includes(category as Category)) {
    return category as Category;
  }
  return "All";
}

function getSearchFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("search") || "";
}

function updateUrlParams(category: Category, search: string) {
  const params = new URLSearchParams(window.location.search);
  if (category !== "All") {
    params.set("category", category);
  } else {
    params.delete("category");
  }
  if (search.trim()) {
    params.set("search", search.trim());
  } else {
    params.delete("search");
  }
  const query = params.toString();
  const newUrl = query
    ? `${window.location.pathname}?${query}`
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
  const [searchQuery, setSearchQuery] = useState(getSearchFromUrl);
  const [activeCategory, setActiveCategory] =
    useState<Category>(getCategoryFromUrl);

  const rpcError = useMemo(() => validateRpcUrl(customRpc), [customRpc]);

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

  const isCustomRpc = customRpc.trim().length > 0 && !rpcError;

  const {
    status: rpcStatus,
    blockNumber,
    latencyMs,
    recheck,
  } = useRpcHealth(publicClient);

  // Sync filter state to URL
  useEffect(() => {
    updateUrlParams(activeCategory, searchQuery);
  }, [activeCategory, searchQuery]);

  const filteredPrecompiles = useMemo(() => {
    return precompiles.filter((config) => {
      // Category filter
      if (activeCategory !== "All" && config.badge !== activeCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          config.title.toLowerCase().includes(query) ||
          config.description.toLowerCase().includes(query) ||
          config.functionName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  const handleCategoryChange = useCallback((category: Category) => {
    setActiveCategory(category);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

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
          <AppHeader
            theme={theme}
            toggleTheme={toggleTheme}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            isCustomRpc={isCustomRpc}
            rpcStatus={rpcStatus}
          />
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
              isCustomRpc={isCustomRpc}
              rpcError={rpcError}
              rpcStatus={rpcStatus}
              blockNumber={blockNumber}
              latencyMs={latencyMs}
              handleRpcChange={handleRpcChange}
              recheck={recheck}
            />
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
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
                aria-label="Search precompiles by name or description"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                    activeCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                  aria-pressed={activeCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
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
              <p className="text-muted-foreground">
                No precompiles match your{" "}
                {searchQuery.trim() && activeCategory !== "All"
                  ? "search and filter"
                  : searchQuery.trim()
                    ? "search"
                    : "filter"}
                .
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="mt-3 text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        <Separator className="mt-10 mb-6" />

        <AppFooter />
      </div>
    </div>
  );
}

export default App;
