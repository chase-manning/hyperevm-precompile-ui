import { useState, useMemo, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Sun, Moon, Github, Settings, RotateCcw } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { makePublicClient, DEFAULT_RPC_URL } from "@/config/client";
import { cn } from "@/lib/utils";
import { validateRpcUrl } from "@/lib/validation";
import {
  PrecompileCard,
  type PrecompileConfig,
} from "@/components/PrecompileCard";
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
        tooltip:
          "Ethereum address starting with 0x (42 characters). This is the HyperCore user address to check.",
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
        tooltip:
          "Ethereum address starting with 0x (42 characters). The user whose withdrawable balance you want to query.",
      },
    ],
  },
  {
    functionName: "getOraclePx",
    title: "Oracle Price",
    description: "Query the oracle price for a perpetual asset by its index.",
    badge: "Perps",
    inputs: [
      {
        name: "perpIndex",
        label: "Perp Index",
        placeholder: "e.g. 0 for BTC, 1 for ETH",
        type: "uint32",
        tooltip:
          "Perpetual asset index (uint32, 0 to 4294967295). Common values: 0 = BTC, 1 = ETH, 2 = ARB, 3 = DOGE.",
      },
    ],
  },
  {
    functionName: "getMarkPx",
    title: "Mark Price",
    description: "Query the mark price for a perpetual asset by its index.",
    badge: "Perps",
    inputs: [
      {
        name: "perpIndex",
        label: "Perp Index",
        placeholder: "e.g. 0 for BTC, 1 for ETH",
        type: "uint32",
        tooltip:
          "Perpetual asset index (uint32, 0 to 4294967295). Common values: 0 = BTC, 1 = ETH, 2 = ARB, 3 = DOGE.",
      },
    ],
  },
  {
    functionName: "getBbo",
    title: "Best Bid & Offer",
    description: "Get the current best bid and ask for a perpetual asset.",
    badge: "Perps",
    inputs: [
      {
        name: "asset",
        label: "Asset Index",
        placeholder: "e.g. 0",
        type: "uint64",
        tooltip:
          "Asset index for the perpetual market (uint64). Common values: 0 = BTC, 1 = ETH.",
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
        tooltip:
          "Perpetual asset index (uint32, 0 to 4294967295). Common values: 0 = BTC, 1 = ETH, 2 = ARB, 3 = DOGE.",
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
        tooltip:
          "Ethereum address starting with 0x (42 characters). The trader whose position you want to query.",
      },
      {
        name: "perp",
        label: "Perp Index",
        placeholder: "e.g. 0",
        type: "uint16",
        tooltip:
          "Perpetual asset index (uint16, 0 to 65535). Common values: 0 = BTC, 1 = ETH, 2 = ARB, 3 = DOGE.",
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
        tooltip:
          "Perp DEX index (uint32, 0 to 4294967295). Use 0 for the default Hyperliquid perp DEX.",
      },
      {
        name: "user",
        label: "User Address",
        placeholder: "0x...",
        type: "address",
        tooltip:
          "Ethereum address starting with 0x (42 characters). The user whose margin summary you want to view.",
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
        tooltip:
          "Ethereum address starting with 0x (42 characters). The user whose spot balance you want to check.",
      },
      {
        name: "token",
        label: "Token Index",
        placeholder: "e.g. 0",
        type: "uint64",
        tooltip:
          "Token index on HyperCore (uint64). Use 0 for USDC. Other token indices can be looked up via Token Info.",
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
        tooltip:
          "Spot market index (uint64). Identifies a specific spot trading pair on Hyperliquid.",
      },
    ],
  },
  {
    functionName: "getSpotPx",
    title: "Spot Price",
    description: "Query the current price for a spot market by its index.",
    badge: "Spot",
    inputs: [
      {
        name: "spotIndex",
        label: "Spot Index",
        placeholder: "e.g. 0",
        type: "uint64",
        tooltip:
          "Spot market index (uint64). Identifies a specific spot trading pair on Hyperliquid.",
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
        tooltip:
          "Token index on HyperCore (uint64). Use 0 for USDC. Each token has a unique index on the platform.",
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
        tooltip:
          "Token index on HyperCore (uint64). Use 0 for USDC. Each token has a unique index on the platform.",
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
        tooltip:
          "Ethereum address starting with 0x (42 characters). The user whose vault equity you want to query.",
      },
      {
        name: "vault",
        label: "Vault Address",
        placeholder: "0x...",
        type: "address",
        tooltip:
          "Ethereum address starting with 0x (42 characters). The vault contract address to query equity for.",
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
        tooltip:
          "Ethereum address starting with 0x (42 characters). The delegator whose staking delegations you want to view.",
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
        tooltip:
          "Ethereum address starting with 0x (42 characters). The delegator whose staking summary you want to view.",
      },
    ],
  },
];

function getStoredRpc(): string {
  return safeGetItem(STORAGE_KEYS.CUSTOM_RPC_URL) || "";
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [customRpc, setCustomRpc] = useState(getStoredRpc);

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
                      "rounded-md border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer",
                      isCustomRpc && "text-primary border-primary/50"
                    )}
                    aria-label="Toggle settings"
                    aria-expanded={showSettings}
                    aria-controls="settings-panel"
                  >
                    <Settings className="h-4 w-4" />
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
                <p className="mt-2 text-xs text-muted-foreground">
                  {isCustomRpc
                    ? `Using custom RPC: ${customRpc.trim()}`
                    : `Using default RPC: ${DEFAULT_RPC_URL}`}
                </p>
              )}
            </div>
          )}
        </header>

        <Separator className="mb-10" />

        <section id="main-content">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
            Available Reads
          </h2>
          <div className="grid gap-4">
            {precompiles.map((config) => (
              <PrecompileCard
                key={config.functionName}
                config={config}
                publicClient={publicClient}
              />
            ))}
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
