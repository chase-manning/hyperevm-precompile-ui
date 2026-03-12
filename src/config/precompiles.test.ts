import { describe, it, expect } from "vitest";
import { precompiles } from "./precompiles";
import { CONTRACT_ABI } from "./contract";

describe("precompile configs", () => {
  const abiFunctionNames = CONTRACT_ABI.filter(
    (entry) => entry.type === "function"
  ).map((entry) => entry.name);

  it("every config functionName matches an ABI function", () => {
    for (const config of precompiles) {
      expect(abiFunctionNames).toContain(config.functionName);
    }
  });

  it("every config has a non-empty title", () => {
    for (const config of precompiles) {
      expect(config.title.length).toBeGreaterThan(0);
    }
  });

  it("every config has a non-empty description", () => {
    for (const config of precompiles) {
      expect(config.description.length).toBeGreaterThan(0);
    }
  });

  it("every config has a badge", () => {
    for (const config of precompiles) {
      expect(config.badge.length).toBeGreaterThan(0);
    }
  });

  it("input types are valid", () => {
    const validTypes = ["address", "uint16", "uint32", "uint64"];
    for (const config of precompiles) {
      for (const input of config.inputs) {
        expect(validTypes).toContain(input.type);
      }
    }
  });

  it("input counts match ABI input counts", () => {
    for (const config of precompiles) {
      const abiEntry = CONTRACT_ABI.find(
        (entry) =>
          entry.type === "function" && entry.name === config.functionName
      );
      expect(abiEntry).toBeDefined();
      if (abiEntry && "inputs" in abiEntry) {
        expect(config.inputs.length).toBe(abiEntry.inputs.length);
      }
    }
  });
});
