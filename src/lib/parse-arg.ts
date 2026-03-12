import type { InputConfig } from "@/components/PrecompileCard";

const UINT_MAX: Record<string, bigint> = {
  uint16: BigInt(65535),
  uint32: BigInt(4294967295),
  uint64: BigInt("18446744073709551615"),
};

export function parseArg(value: string, type: InputConfig["type"]): unknown {
  const trimmed = value.trim();
  if (type === "address") return trimmed as `0x${string}`;

  if (type === "uint64") {
    const n = BigInt(trimmed);
    if (n < 0n) {
      throw new Error(`Value must be a non-negative integer`);
    }
    const max = UINT_MAX[type];
    if (n > max) {
      throw new Error(
        `Value exceeds maximum for ${type} (max ${max.toString()})`
      );
    }
    return n;
  }

  // uint16, uint32
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`Value must be a non-negative integer`);
  }
  const max = UINT_MAX[type];
  if (max !== undefined && BigInt(n) > max) {
    throw new Error(
      `Value exceeds maximum for ${type} (max ${max.toString()})`
    );
  }
  return n;
}
