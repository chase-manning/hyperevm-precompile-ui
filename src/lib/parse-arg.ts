import type { InputConfig } from "@/components/PrecompileCard";

export function parseArg(value: string, type: InputConfig["type"]): unknown {
  const trimmed = value.trim();
  if (type === "address") return trimmed as `0x${string}`;
  if (type === "uint64") return BigInt(trimmed);
  return Number(trimmed);
}
