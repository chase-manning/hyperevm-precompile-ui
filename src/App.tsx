import { useState, useMemo, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/use-theme";
import { makePublicClient } from "@/config/client";
import {
  PrecompileCard,
  type PrecompileConfig,
} from "@/components/PrecompileCard";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

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
    description: "Query the oracle price for a perpetual asset by its index.",
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
    description: "Query the mark price for a perpetual asset by its index.",
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
    description: "Get the current best bid and ask for a perpetual asset.",
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
    description: "Query the current price for a spot market by its index.",
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

function getStoredRpc(): string {
  try {
    return localStorage.getItem("customRpcUrl") || "";
  } catch {
    return "";
  }
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [customRpc, setCustomRpc] = useState(getStoredRpc);

  const handleRpcChange = useCallback((value: string) => {
    setCustomRpc(value);
    try {
      if (value.trim()) {
        localStorage.setItem("customRpcUrl", value.trim());
      } else {
        localStorage.removeItem("customRpcUrl");
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const publicClient = useMemo(
    () => makePublicClient(customRpc.trim() || undefined),
    [customRpc]
  );

  const isCustomRpc = customRpc.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <AppHeader
          theme={theme}
          toggleTheme={toggleTheme}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          isCustomRpc={isCustomRpc}
          customRpc={customRpc}
          onRpcChange={handleRpcChange}
        />

        <Separator className="mb-10" />

        <section>
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

        <AppFooter />
      </div>
    </div>
  );
}

export default App;
