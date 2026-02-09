export const CONTRACT_ADDRESS =
  "0x4e4726F2D4F652151Eb80254C2C8859d152382Ce" as const;

export const CONTRACT_ABI = [
  {
    inputs: [],
    name: "PrecompileLib__AccountMarginSummaryPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__BboPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__CoreUserExistsPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__DelegationsPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__DelegatorSummaryPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__L1BlockNumberPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__MarkPxPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__OraclePxPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__PerpAssetInfoPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__PositionPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__SpotBalancePrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__SpotInfoPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__SpotPxPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__TokenInfoPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__TokenSupplyPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__VaultEquityPrecompileFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PrecompileLib__WithdrawablePrecompileFailed",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint32", name: "perpDexIndex", type: "uint32" },
      { internalType: "address", name: "user", type: "address" },
    ],
    name: "getAccountMarginSummary",
    outputs: [
      {
        components: [
          { internalType: "int64", name: "accountValue", type: "int64" },
          { internalType: "uint64", name: "marginUsed", type: "uint64" },
          { internalType: "uint64", name: "ntlPos", type: "uint64" },
          { internalType: "int64", name: "rawUsd", type: "int64" },
        ],
        internalType: "struct PrecompileLib.AccountMarginSummary",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint64", name: "asset", type: "uint64" }],
    name: "getBbo",
    outputs: [
      {
        components: [
          { internalType: "uint64", name: "bid", type: "uint64" },
          { internalType: "uint64", name: "ask", type: "uint64" },
        ],
        internalType: "struct PrecompileLib.Bbo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getCoreUserExists",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getDelegations",
    outputs: [
      {
        components: [
          { internalType: "address", name: "validator", type: "address" },
          { internalType: "uint64", name: "amount", type: "uint64" },
          {
            internalType: "uint64",
            name: "lockedUntilTimestamp",
            type: "uint64",
          },
        ],
        internalType: "struct PrecompileLib.Delegation[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getDelegatorSummary",
    outputs: [
      {
        components: [
          { internalType: "uint64", name: "delegated", type: "uint64" },
          { internalType: "uint64", name: "undelegated", type: "uint64" },
          {
            internalType: "uint64",
            name: "totalPendingWithdrawal",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "nPendingWithdrawals",
            type: "uint64",
          },
        ],
        internalType: "struct PrecompileLib.DelegatorSummary",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getL1BlockNumber",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint32", name: "perpIndex", type: "uint32" }],
    name: "getMarkPx",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint32", name: "perpIndex", type: "uint32" }],
    name: "getOraclePx",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint32", name: "perp", type: "uint32" }],
    name: "getPerpAssetInfo",
    outputs: [
      {
        components: [
          { internalType: "string", name: "coin", type: "string" },
          { internalType: "uint32", name: "marginTableId", type: "uint32" },
          { internalType: "uint8", name: "szDecimals", type: "uint8" },
          { internalType: "uint8", name: "maxLeverage", type: "uint8" },
          { internalType: "bool", name: "onlyIsolated", type: "bool" },
        ],
        internalType: "struct PrecompileLib.PerpAssetInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint16", name: "perp", type: "uint16" },
    ],
    name: "getPosition",
    outputs: [
      {
        components: [
          { internalType: "int64", name: "szi", type: "int64" },
          { internalType: "uint64", name: "entryNtl", type: "uint64" },
          { internalType: "int64", name: "isolatedRawUsd", type: "int64" },
          { internalType: "uint32", name: "leverage", type: "uint32" },
          { internalType: "bool", name: "isIsolated", type: "bool" },
        ],
        internalType: "struct PrecompileLib.Position",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint64", name: "token", type: "uint64" },
    ],
    name: "getSpotBalance",
    outputs: [
      {
        components: [
          { internalType: "uint64", name: "total", type: "uint64" },
          { internalType: "uint64", name: "hold", type: "uint64" },
          { internalType: "uint64", name: "entryNtl", type: "uint64" },
        ],
        internalType: "struct PrecompileLib.SpotBalance",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint64", name: "spotIndex", type: "uint64" },
    ],
    name: "getSpotInfo",
    outputs: [
      {
        components: [
          { internalType: "string", name: "name", type: "string" },
          { internalType: "uint64[2]", name: "tokens", type: "uint64[2]" },
        ],
        internalType: "struct PrecompileLib.SpotInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint64", name: "spotIndex", type: "uint64" },
    ],
    name: "getSpotPx",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint64", name: "token", type: "uint64" }],
    name: "getTokenInfo",
    outputs: [
      {
        components: [
          { internalType: "string", name: "name", type: "string" },
          { internalType: "uint64[]", name: "spots", type: "uint64[]" },
          {
            internalType: "uint64",
            name: "deployerTradingFeeShare",
            type: "uint64",
          },
          { internalType: "address", name: "deployer", type: "address" },
          { internalType: "address", name: "evmContract", type: "address" },
          { internalType: "uint8", name: "szDecimals", type: "uint8" },
          { internalType: "uint8", name: "weiDecimals", type: "uint8" },
          {
            internalType: "int8",
            name: "evmExtraWeiDecimals",
            type: "int8",
          },
        ],
        internalType: "struct PrecompileLib.TokenInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint64", name: "token", type: "uint64" }],
    name: "getTokenSupply",
    outputs: [
      {
        components: [
          { internalType: "uint64", name: "maxSupply", type: "uint64" },
          { internalType: "uint64", name: "totalSupply", type: "uint64" },
          {
            internalType: "uint64",
            name: "circulatingSupply",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "futureEmissions",
            type: "uint64",
          },
          {
            components: [
              { internalType: "address", name: "user", type: "address" },
              { internalType: "uint64", name: "balance", type: "uint64" },
            ],
            internalType: "struct PrecompileLib.UserBalance[]",
            name: "nonCirculatingUserBalances",
            type: "tuple[]",
          },
        ],
        internalType: "struct PrecompileLib.TokenSupply",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "vault", type: "address" },
    ],
    name: "getUserVaultEquity",
    outputs: [
      {
        components: [
          { internalType: "uint64", name: "equity", type: "uint64" },
          {
            internalType: "uint64",
            name: "lockedUntilTimestamp",
            type: "uint64",
          },
        ],
        internalType: "struct PrecompileLib.UserVaultEquity",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getWithdrawable",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
