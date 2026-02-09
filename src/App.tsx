import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Github } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import {
  PrecompileCard,
  type PrecompileConfig,
} from "@/components/PrecompileCard";

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
    description:
      "Check whether a given address exists as a user on HyperCore.",
    badge: "User",
    inputs: [
      {
        name: "user",
        label: "User Address",
        placeholder: "0x...",
        type: "address",
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
      },
    ],
  },
  {
    functionName: "getOraclePx",
    title: "Oracle Price",
    description:
      "Query the oracle price for a perpetual asset by its index.",
    badge: "Perps",
    inputs: [
      {
        name: "perpIndex",
        label: "Perp Index",
        placeholder: "e.g. 0 for BTC, 1 for ETH",
        type: "uint32",
      },
    ],
  },
  {
    functionName: "getMarkPx",
    title: "Mark Price",
    description:
      "Query the mark price for a perpetual asset by its index.",
    badge: "Perps",
    inputs: [
      {
        name: "perpIndex",
        label: "Perp Index",
        placeholder: "e.g. 0 for BTC, 1 for ETH",
        type: "uint32",
      },
    ],
  },
  {
    functionName: "getBbo",
    title: "Best Bid & Offer",
    description:
      "Get the current best bid and ask for a perpetual asset.",
    badge: "Perps",
    inputs: [
      {
        name: "asset",
        label: "Asset Index",
        placeholder: "e.g. 0",
        type: "uint64",
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
      },
      {
        name: "perp",
        label: "Perp Index",
        placeholder: "e.g. 0",
        type: "uint16",
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
      },
      {
        name: "user",
        label: "User Address",
        placeholder: "0x...",
        type: "address",
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
      },
      {
        name: "token",
        label: "Token Index",
        placeholder: "e.g. 0",
        type: "uint64",
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
      },
    ],
  },
  {
    functionName: "getSpotPx",
    title: "Spot Price",
    description:
      "Query the current price for a spot market by its index.",
    badge: "Spot",
    inputs: [
      {
        name: "spotIndex",
        label: "Spot Index",
        placeholder: "e.g. 0",
        type: "uint64",
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
      },
      {
        name: "vault",
        label: "Vault Address",
        placeholder: "0x...",
        type: "address",
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
      },
    ],
  },
];

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold tracking-tight">
              Hyperliquid Precompile Explorer
            </h1>
            <button
              onClick={toggleTheme}
              className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
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
        </header>

        <Separator className="mb-10" />

        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
            Available Reads
          </h2>
          <div className="grid gap-4">
            {precompiles.map((config) => (
              <PrecompileCard key={config.functionName} config={config} />
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
