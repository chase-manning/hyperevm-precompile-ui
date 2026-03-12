import { useState, useMemo, useCallback, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
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
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  STORAGE_KEYS,
} from "@/lib/local-storage";

const precompiles: PrecompileConfig[] = [
  {
    functionName: "getL1BlockNumber",
    title: "L1 Block Number",
    description:
      "Fetch the latest HyperCore L1 block number as seen by the EVM at block construction time.",
    badge: "System",
    inputs: [],
  },
  {
    functionName: "getCoreUserExists",
    title: "Core User Exists",
    description: "Check whether a given address exists as a user on HyperCore.",
    badge: "User",
    inputs: [
      {
        name: "user",
        label: "User Address",
        placeholder: "0x...",
        type: "address",
        tooltip: {
          description: "The HyperCore user address to check.",
          format: "Ethereum address starting with 0x (42 hex characters)",
          examples: ["0x1234...abcd"],
        },
      },
    ],
  },
  {
    functionName: "getWithdrawable",
    title: "Withdrawable",
    description:
      "Query the withdrawable balance for any user address on HyperCore.",
    badge: "User",
    inputs: [
      {
        name: "user",
        label: "User Address",
        placeholder: "0x...",
        type: "address",
        tooltip: {
          description: "The user whose withdrawable balance you want to query.",
          format: "Ethereum address starting with 0x (42 hex characters)",
          examples: ["0x1234...abcd"],
        },
      },
    ],
  },
  {
    functionName: "getOraclePx",
    title: "Oracle Price",
    description: "Query the oracle price for a perpetual asset by its index.",
    badge: "Perps",
    autoRefreshable: true,
    inputs: [
      {
        name: "perpIndex",
        label: "Perp Index",
        placeholder: "e.g. 0 for BTC, 1 for ETH",
        type: "uint32",
        tooltip: {
          description: "Perpetual asset index identifying the market.",
          format: "uint32 (0 to 4,294,967,295)",
          examples: ["0 = BTC", "1 = ETH", "2 = ARB", "3 = DOGE"],
        },
      },
    ],
  },
  {
    functionName: "getMarkPx",
    title: "Mark Price",
    description: "Query the mark price for a perpetual asset by its index.",
    badge: "Perps",
    autoRefreshable: true,
    inputs: [
      {
        name: "perpIndex",
        label: "Perp Index",
        placeholder: "e.g. 0 for BTC, 1 for ETH",
        type: "uint32",
        tooltip: {
          description: "Perpetual asset index identifying the market.",
          format: "uint32 (0 to 4,294,967,295)",
          examples: ["0 = BTC", "1 = ETH", "2 = ARB", "3 = DOGE"],
        },
      },
    ],
  },
  {
    functionName: "getBbo",
    title: "Best Bid & Offer",
    description: "Get the current best bid and ask for a perpetual asset.",
    badge: "Perps",
    autoRefreshable: true,
    inputs: [
      {
        name: "asset",
        label: "Asset Index",
        placeholder: "e.g. 0",
        type: "uint64",
        tooltip: {
          description: "Asset index for the perpetual market.",
          format: "uint64 (0 to 18,446,744,073,709,551,615)",
          examples: ["0 = BTC", "1 = ETH"],
        },
      },
    ],
  },
  {
    functionName: "getPerpAssetInfo",
    title: "Perp Asset Info",
    description:
      "Look up metadata for a perpetual asset including coin name, decimals, max leverage, and margin table.",
    badge: "Perps",
    inputs: [
      {
        name: "perp",
        label: "Perp Index",
        placeholder: "e.g. 0",
        type: "uint32",
        tooltip: {
          description: "Perpetual asset index identifying the market.",
          format: "uint32 (0 to 4,294,967,295)",
          examples: ["0 = BTC", "1 = ETH", "2 = ARB", "3 = DOGE"],
        },
      },
    ],
  },
  {
    functionName: "getPosition",
    title: "Position",
    description:
      "Query an open perpetual position for a given user and asset, including size, entry notional, leverage, and isolation mode.",
    badge: "Perps",
    inputs: [
      {
        name: "user",
        label: "User Address",
        placeholder: "0x...",
        type: "address",
        tooltip: {
          description: "The trader whose position you want to query.",
          format: "Ethereum address starting with 0x (42 hex characters)",
          examples: ["0x1234...abcd"],
        },
      },
      {
        name: "perp",
        label: "Perp Index",
        placeholder: "e.g. 0",
        type: "uint16",
        tooltip: {
          description: "Perpetual asset index identifying the market.",
          format: "uint16 (0 to 65,535)",
          examples: ["0 = BTC", "1 = ETH", "2 = ARB", "3 = DOGE"],
        },
      },
    ],
  },
  {
    functionName: "getAccountMarginSummary",
    title: "Account Margin Summary",
    description:
      "Get the margin summary for a user on a given perp dex, including account value, margin used, notional position, and raw USD.",
    badge: "Perps",
    inputs: [
      {
        name: "perpDexIndex",
        label: "Perp Dex Index",
        placeholder: "e.g. 0",
        type: "uint32",
        tooltip: {
          description:
            "The perp DEX to query. Use 0 for the default Hyperliquid perp DEX.",
          format: "uint32 (0 to 4,294,967,295)",
          examples: ["0 = Default Hyperliquid perp DEX"],
        },
      },
      {
        name: "user",
        label: "User Address",
        placeholder: "0x...",
        type: "address",
        tooltip: {
          description: "The user whose margin summary you want to view.",
          format: "Ethereum address starting with 0x (42 hex characters)",
          examples: ["0x1234...abcd"],
        },
      },
    ],
  },
  {
    functionName: "getSpotBalance",
    title: "Spot Balance",
    description:
      "Check a user's spot balance for a specific token, including total, on hold, and entry notional.",
    badge: "Spot",
    inputs: [
      {
        name: "user",
        label: "User Address",
        placeholder: "0x...",
        type: "address",
        tooltip: {
          description: "The user whose spot balance you want to check.",
          format: "Ethereum address starting with 0x (42 hex characters)",
          examples: ["0x1234...abcd"],
        },
      },
      {
        name: "token",
        label: "Token Index",
        placeholder: "e.g. 0",
        type: "uint64",
        tooltip: {
          description:
            "Token index on HyperCore. Other indices can be looked up via Token Info.",
          format: "uint64 (0 to 18,446,744,073,709,551,615)",
          examples: ["0 = USDC"],
        },
      },
    ],
  },
  {
    functionName: "getSpotInfo",
    title: "Spot Info",
    description:
      "Look up metadata for a spot market by index, including its name and the two token indices.",
    badge: "Spot",
    inputs: [
      {
        name: "spotIndex",
        label: "Spot Index",
        placeholder: "e.g. 0",
        type: "uint64",
        tooltip: {
          description:
            "Identifies a specific spot trading pair on Hyperliquid.",
          format: "uint64 (0 to 18,446,744,073,709,551,615)",
        },
      },
    ],
  },
  {
    functionName: "getSpotPx",
    title: "Spot Price",
    description: "Query the current price for a spot market by its index.",
    badge: "Spot",
    autoRefreshable: true,
    inputs: [
      {
        name: "spotIndex",
        label: "Spot Index",
        placeholder: "e.g. 0",
        type: "uint64",
        tooltip: {
          description:
            "Identifies a specific spot trading pair on Hyperliquid.",
          format: "uint64 (0 to 18,446,744,073,709,551,615)",
        },
      },
    ],
  },
  {
    functionName: "getTokenInfo",
    title: "Token Info",
    description:
      "Get full metadata for a token including name, deployer, EVM contract, spot markets, and decimal configuration.",
    badge: "Spot",
    inputs: [
      {
        name: "token",
        label: "Token Index",
        placeholder: "e.g. 0",
        type: "uint64",
        tooltip: {
          description: "Each token has a unique index on the platform.",
          format: "uint64 (0 to 18,446,744,073,709,551,615)",
          examples: ["0 = USDC"],
        },
      },
    ],
  },
  {
    functionName: "getTokenSupply",
    title: "Token Supply",
    description:
      "Query supply metrics for a token including max, total, circulating, future emissions, and non circulating holder balances.",
    badge: "Spot",
    inputs: [
      {
        name: "token",
        label: "Token Index",
        placeholder: "e.g. 0",
        type: "uint64",
        tooltip: {
          description: "Each token has a unique index on the platform.",
          format: "uint64 (0 to 18,446,744,073,709,551,615)",
          examples: ["0 = USDC"],
        },
      },
    ],
  },
  {
    functionName: "getUserVaultEquity",
    title: "User Vault Equity",
    description:
      "Query a user's equity in a specific vault, along with the lock expiry timestamp.",
    badge: "Vaults",
    inputs: [
      {
        name: "user",
        label: "User Address",
        placeholder: "0x...",
        type: "address",
        tooltip: {
          description: "The user whose vault equity you want to query.",
          format: "Ethereum address starting with 0x (42 hex characters)",
          examples: ["0x1234...abcd"],
        },
      },
      {
        name: "vault",
        label: "Vault Address",
        placeholder: "0x...",
        type: "address",
        tooltip: {
          description: "The vault contract address to query equity for.",
          format: "Ethereum address starting with 0x (42 hex characters)",
          examples: ["0x1234...abcd"],
        },
      },
    ],
  },
  {
    functionName: "getDelegations",
    title: "Delegations",
    description:
      "View all staking delegations for an address, including validator, amount, and lock expiry.",
    badge: "Staking",
    inputs: [
      {
        name: "user",
        label: "User Address",
        placeholder: "0x...",
        type: "address",
        tooltip: {
          description:
            "The delegator whose staking delegations you want to view.",
          format: "Ethereum address starting with 0x (42 hex characters)",
          examples: ["0x1234...abcd"],
        },
      },
    ],
  },
  {
    functionName: "getDelegatorSummary",
    title: "Delegator Summary",
    description:
      "Get the staking summary for a delegator including total delegated, undelegated, pending withdrawals, and withdrawal count.",
    badge: "Staking",
    inputs: [
      {
        name: "user",
        label: "User Address",
        placeholder: "0x...",
        type: "address",
        tooltip: {
          description: "The delegator whose staking summary you want to view.",
          format: "Ethereum address starting with 0x (42 hex characters)",
          examples: ["0x1234...abcd"],
        },
      },
    ],
  },
];

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
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium focus:outline-none"
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

        <main id="main-content">
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
        </main>

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
