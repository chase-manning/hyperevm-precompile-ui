import { describe, it, expect } from "vitest";
import { CONTRACT_ABI } from "./contract";

// Extract ABI function names for validation
const abiFunctionNames = CONTRACT_ABI.filter(
  (entry) => entry.type === "function"
).map((entry) => entry.name);

// Import the precompile configs from App.tsx indirectly by listing expected names
// These are the functionNames used in the precompiles array in App.tsx
const expectedFunctionNames = [
  "getL1BlockNumber",
  "getCoreUserExists",
  "getWithdrawable",
  "getOraclePx",
  "getMarkPx",
  "getBbo",
  "getPerpAssetInfo",
  "getPosition",
  "getAccountMarginSummary",
  "getSpotBalance",
  "getSpotInfo",
  "getSpotPx",
  "getTokenInfo",
  "getTokenSupply",
  "getUserVaultEquity",
  "getDelegations",
  "getDelegatorSummary",
];

describe("Precompile configs", () => {
  it("ABI contains all expected function names", () => {
    for (const name of expectedFunctionNames) {
      expect(abiFunctionNames).toContain(name);
    }
  });

  it("every ABI function is represented in the config", () => {
    for (const name of abiFunctionNames) {
      expect(expectedFunctionNames).toContain(name);
    }
  });

  it("ABI has view stateMutability for all functions", () => {
    const functions = CONTRACT_ABI.filter((entry) => entry.type === "function");
    for (const fn of functions) {
      expect(fn.stateMutability).toBe("view");
    }
  });

  it("ABI error entries follow PrecompileLib naming convention", () => {
    const errors = CONTRACT_ABI.filter((entry) => entry.type === "error");
    for (const err of errors) {
      expect(err.name).toMatch(/^PrecompileLib__/);
    }
  });
});
