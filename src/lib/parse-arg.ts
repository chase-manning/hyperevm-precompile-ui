import type { InputConfig } from "@/components/PrecompileCard";

export function parseArg(value: string, type: InputConfig["type"]): unknown {
  const trimmed = value.trim();
  if (type === "address") return trimmed as `0x${string}`;
  if (type === "uint64") {
    try {
      return BigInt(trimmed);
    } catch {
      throw new Error(`Invalid uint64 value: "${trimmed}"`);
    }
  }
  const num = Number(trimmed);
  if (Number.isNaN(num)) {
    throw new Error(`Invalid number: "${trimmed}"`);
  }
  return num;
}
