import type { InputConfig, PrecompileConfig } from "@/components/PrecompileCard";

const USER_ADDRESS_INPUT: InputConfig = {
  name: "user",
  label: "User Address",
  placeholder: "0x...",
  type: "address",
  tooltip: "Ethereum address starting with 0x (42 characters total).",
};

const PERP_INDEX_INPUT: InputConfig = {
  name: "perpIndex",
  label: "Perp Index",
  placeholder: "e.g. 0",
  type: "uint32",
  tooltip:
    "Perpetual asset index (uint32, 0–4294967295). Common values: 0 = BTC, 1 = ETH, 2 = ARB, 3 = DOGE.",
};

const TOKEN_INDEX_INPUT: InputConfig = {
  name: "token",
  label: "Token Index",
  placeholder: "e.g. 0",
  type: "uint64",
  tooltip:
    "Token index on HyperCore (uint64). 0 = USDC, 1 = PURR, 2 = HYPE. Check Hyperliquid docs for the full list.",
};

const SPOT_INDEX_INPUT: InputConfig = {
  name: "spotIndex",
  label: "Spot Index",
  placeholder: "e.g. 0",
  type: "uint64",
  tooltip:
    "Spot market index (uint64). Each spot market pairs two tokens. 0 = PURR/USDC, 1 = HYPE/USDC.",
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
    description:
      "Check whether a given address exists as a user on HyperCore.",
    badge: "User",
    inputs: [USER_ADDRESS_INPUT],
  },
  {
    functionName: "getWithdrawable",
    title: "Withdrawable",
    description:
      "Query the withdrawable balance for any user address on HyperCore.",
    badge: "User",
    inputs: [USER_ADDRESS_INPUT],
  },
  {
    functionName: "getOraclePx",
    title: "Oracle Price",
    description:
      "Query the oracle price for a perpetual asset by its index.",
    badge: "Perps",
    inputs: [
      {
        ...PERP_INDEX_INPUT,
        placeholder: "e.g. 0 for BTC, 1 for ETH",
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
        ...PERP_INDEX_INPUT,
        placeholder: "e.g. 0 for BTC, 1 for ETH",
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
        tooltip:
          "Perpetual asset index (uint64). Common values: 0 = BTC, 1 = ETH.",
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
      USER_ADDRESS_INPUT,
      {
        name: "perp",
        label: "Perp Index",
        placeholder: "e.g. 0",
        type: "uint16",
        tooltip:
          "Perpetual asset index (uint16, 0–65535). Common values: 0 = BTC, 1 = ETH, 2 = ARB, 3 = DOGE.",
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
          "Perp DEX index (uint32, 0–4294967295). Use 0 for the default Hyperliquid perp DEX.",
      },
      USER_ADDRESS_INPUT,
    ],
  },
  {
    functionName: "getSpotBalance",
    title: "Spot Balance",
    description:
      "Check a user's spot balance for a specific token, including total, on hold, and entry notional.",
    badge: "Spot",
    inputs: [USER_ADDRESS_INPUT, TOKEN_INDEX_INPUT],
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
    description:
      "Query the current price for a spot market by its index.",
    badge: "Spot",
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
      USER_ADDRESS_INPUT,
      {
        name: "vault",
        label: "Vault Address",
        placeholder: "0x...",
        type: "address",
        tooltip:
          "Ethereum address of the vault contract starting with 0x (42 characters total).",
      },
    ],
  },
  {
    functionName: "getDelegations",
    title: "Delegations",
    description:
      "View all staking delegations for an address, including validator, amount, and lock expiry.",
    badge: "Staking",
    inputs: [USER_ADDRESS_INPUT],
  },
  {
    functionName: "getDelegatorSummary",
    title: "Delegator Summary",
    description:
      "Get the staking summary for a delegator including total delegated, undelegated, pending withdrawals, and withdrawal count.",
    badge: "Staking",
    inputs: [USER_ADDRESS_INPUT],
  },
];
