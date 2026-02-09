# Hyperliquid Precompile Explorer

A lightweight web interface for querying read only data from [Hyperliquid precompiles](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/interacting-with-hypercore) on HyperEVM. Input parameters, hit query, and see decoded results instantly.

**Live at [hyperevm-precompile-ui.chase-63b.workers.dev](https://hyperevm-precompile-ui.chase-63b.workers.dev/)**

## What This Does

Hyperliquid exposes a set of read precompiles on HyperEVM that let you query HyperCore state: oracle prices, positions, balances, staking info, and more. This app wraps a Solidity contract ([`0x4e4726F2D4F652151Eb80254C2C8859d152382Ce`](https://hyperevmscan.io/address/0x4e4726F2D4F652151Eb80254C2C8859d152382Ce)) that exposes a view function for each precompile, and provides a simple UI to call any of them without writing code.

## Available Queries

| Function | Category | Inputs |
|---|---|---|
| `getL1BlockNumber` | System | None |
| `getCoreUserExists` | User | address |
| `getWithdrawable` | User | address |
| `getOraclePx` | Perps | perp index |
| `getMarkPx` | Perps | perp index |
| `getBbo` | Perps | asset index |
| `getPerpAssetInfo` | Perps | perp index |
| `getPosition` | Perps | address, perp index |
| `getAccountMarginSummary` | Perps | dex index, address |
| `getSpotBalance` | Spot | address, token index |
| `getSpotInfo` | Spot | spot index |
| `getSpotPx` | Spot | spot index |
| `getTokenInfo` | Spot | token index |
| `getTokenSupply` | Spot | token index |
| `getUserVaultEquity` | Vaults | user address, vault address |
| `getDelegations` | Staking | address |
| `getDelegatorSummary` | Staking | address |

## Tech Stack

- **React 19** + **TypeScript** with Vite
- **viem** for contract reads against HyperEVM (chain ID 999, RPC `https://rpc.hyperliquid.xyz/evm`)
- **shadcn/ui** + **Tailwind CSS v4** for styling
- **Cloudflare Workers** for hosting

## Development

```bash
yarn install
yarn dev
```

Build for production:

```bash
yarn build
```

## Project Structure

```
src/
  config/
    client.ts          # viem public client for HyperEVM
    contract.ts        # Contract ABI and address
  components/
    PrecompileCard.tsx  # Card with inputs, query button, result display
    ResultDisplay.tsx   # Recursive renderer for contract return values
    ui/                 # shadcn/ui components
  hooks/
    use-theme.ts       # Light/dark mode with system preference detection
  App.tsx              # Main app with all 17 precompile configs
  main.tsx             # Entry point
```
