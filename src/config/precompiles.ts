import type {
  PrecompileConfig,
  InputConfig,
} from "@/components/PrecompileCard";

const USER_ADDRESS_INPUT: InputConfig = {
  name: "user",
  label: "User Address",
  placeholder: "0x...",
  type: "address",
  tooltip: {
    description: "The HyperCore user address to check.",
    format: "Ethereum address starting with 0x (42 hex characters)",
    examples: ["0x1234...abcd"],
  },
};

const PERP_INDEX_INPUT: InputConfig = {
  name: "perpIndex",
  label: "Perp Index",
  placeholder: "e.g. 0 for BTC, 1 for ETH",
  type: "uint32",
  tooltip: {
    description: "Perpetual asset index identifying the market.",
    format: "uint32 (0 to 4,294,967,295)",
    examples: ["0 = BTC", "1 = ETH", "2 = ARB", "3 = DOGE"],
  },
};

const TOKEN_INDEX_INPUT: InputConfig = {
  name: "token",
  label: "Token Index",
  placeholder: "e.g. 0",
  type: "uint64",
  tooltip: {
    description: "Each token has a unique index on the platform.",
    format: "uint64 (0 to 18,446,744,073,709,551,615)",
    examples: ["0 = USDC"],
  },
};

const SPOT_INDEX_INPUT: InputConfig = {
  name: "spotIndex",
  label: "Spot Index",
  placeholder: "e.g. 0",
  type: "uint64",
  tooltip: {
    description: "Identifies a specific spot trading pair on Hyperliquid.",
    format: "uint64 (0 to 18,446,744,073,709,551,615)",
  },
};

export const precompiles: PrecompileConfig[] = [
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
        ...USER_ADDRESS_INPUT,
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
        ...USER_ADDRESS_INPUT,
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
    inputs: [PERP_INDEX_INPUT],
  },
  {
    functionName: "getMarkPx",
    title: "Mark Price",
    description: "Query the mark price for a perpetual asset by its index.",
    badge: "Perps",
    autoRefreshable: true,
    inputs: [PERP_INDEX_INPUT],
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
        ...PERP_INDEX_INPUT,
        name: "perp",
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
        ...USER_ADDRESS_INPUT,
        tooltip: {
          description: "The trader whose position you want to query.",
          format: "Ethereum address starting with 0x (42 hex characters)",
          examples: ["0x1234...abcd"],
        },
      },
      {
        ...PERP_INDEX_INPUT,
        name: "perp",
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
        ...USER_ADDRESS_INPUT,
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
        ...USER_ADDRESS_INPUT,
        tooltip: {
          description: "The user whose spot balance you want to check.",
          format: "Ethereum address starting with 0x (42 hex characters)",
          examples: ["0x1234...abcd"],
        },
      },
      {
        ...TOKEN_INDEX_INPUT,
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
    inputs: [SPOT_INDEX_INPUT],
  },
  {
    functionName: "getSpotPx",
    title: "Spot Price",
    description: "Query the current price for a spot market by its index.",
    badge: "Spot",
    autoRefreshable: true,
    inputs: [SPOT_INDEX_INPUT],
  },
  {
    functionName: "getTokenInfo",
    title: "Token Info",
    description:
      "Get full metadata for a token including name, deployer, EVM contract, spot markets, and decimal configuration.",
    badge: "Spot",
    inputs: [TOKEN_INDEX_INPUT],
  },
  {
    functionName: "getTokenSupply",
    title: "Token Supply",
    description:
      "Query supply metrics for a token including max, total, circulating, future emissions, and non circulating holder balances.",
    badge: "Spot",
    inputs: [TOKEN_INDEX_INPUT],
  },
  {
    functionName: "getUserVaultEquity",
    title: "User Vault Equity",
    description:
      "Query a user's equity in a specific vault, along with the lock expiry timestamp.",
    badge: "Vaults",
    inputs: [
      {
        ...USER_ADDRESS_INPUT,
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
        ...USER_ADDRESS_INPUT,
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
        ...USER_ADDRESS_INPUT,
        tooltip: {
          description: "The delegator whose staking summary you want to view.",
          format: "Ethereum address starting with 0x (42 hex characters)",
          examples: ["0x1234...abcd"],
        },
      },
    ],
  },
];
