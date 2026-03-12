import { describe, it, expect } from "vitest";
import { precompiles } from "./precompiles";
import { CONTRACT_ABI } from "./contract";

const abiFunctions = CONTRACT_ABI.filter(
  (item) => item.type === "function" && item.stateMutability === "view"
);

const abiFunctionNames = abiFunctions.map((fn) => fn.name);

describe("precompile configs", () => {
  it("has at least one precompile", () => {
    expect(precompiles.length).toBeGreaterThan(0);
  });

  it("every functionName exists in CONTRACT_ABI", () => {
    for (const config of precompiles) {
      expect(abiFunctionNames).toContain(config.functionName);
    }
  });

  it("every ABI view function is covered by a precompile config", () => {
    const configFunctionNames = precompiles.map((c) => c.functionName);
    for (const name of abiFunctionNames) {
      expect(configFunctionNames).toContain(name);
    }
  });

  it("every config has a non-empty title", () => {
    for (const config of precompiles) {
      expect(config.title.trim().length).toBeGreaterThan(0);
    }
  });

  it("every config has a non-empty description", () => {
    for (const config of precompiles) {
      expect(config.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("every config has a non-empty badge", () => {
    for (const config of precompiles) {
      expect(config.badge.trim().length).toBeGreaterThan(0);
    }
  });

  it("every input has a valid type", () => {
    const validTypes = ["address", "uint16", "uint32", "uint64"];
    for (const config of precompiles) {
      for (const input of config.inputs) {
        expect(validTypes).toContain(input.type);
      }
    }
  });

  it("every input has required fields", () => {
    for (const config of precompiles) {
      for (const input of config.inputs) {
        expect(input.name.trim().length).toBeGreaterThan(0);
        expect(input.label.trim().length).toBeGreaterThan(0);
        expect(input.placeholder.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("input count matches ABI parameter count for each function", () => {
    for (const config of precompiles) {
      const abiFunc = abiFunctions.find(
        (fn) => fn.name === config.functionName
      );
      expect(abiFunc).toBeDefined();
      expect(config.inputs.length).toBe(abiFunc!.inputs.length);
    }
  });
});
