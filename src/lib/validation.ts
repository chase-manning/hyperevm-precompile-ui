import type { InputConfig } from "@/components/PrecompileCard";

const UINT_MAX: Record<"uint16" | "uint32" | "uint64", bigint> = {
  uint16: 65535n,
  uint32: 4294967295n,
  uint64: 18446744073709551615n,
};

/**
 * Validate a user-supplied input string for a given precompile input type.
 * Returns an error message string, or `null` when the value is valid.
 * Empty / blank strings are treated as "not yet filled" rather than invalid.
 */
export function validateInput(
  value: string,
  type: InputConfig["type"]
): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null; // empty is handled by the "all filled" check

  if (type === "address") {
    if (!/^0x/i.test(trimmed)) {
      return "Address must start with 0x";
    }
    if (trimmed.length !== 42) {
      return "Address must be 42 characters long";
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
      return "Address contains invalid characters (only hex allowed)";
    }
    return null;
  }

  // Numeric types: uint16, uint32, uint64
  if (!/^[0-9]+$/.test(trimmed)) {
    return `${type} must be a non-negative integer`;
  }

  try {
    const n = BigInt(trimmed);
    if (n < 0n) {
      return `${type} must be non-negative`;
    }
    const max = UINT_MAX[type];
    if (n > max) {
      return `${type} must be at most ${max.toString()}`;
    }
  } catch {
    return `Invalid number for ${type}`;
  }

  return null;
}

/**
 * Validate a custom RPC URL string.
 * Returns an error message string, or `null` when valid / empty.
 */
export function validateRpcUrl(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  if (!/^https?:\/\//i.test(trimmed)) {
    return "RPC URL must start with http:// or https://";
  }

  try {
    new URL(trimmed);
  } catch {
    return "RPC URL is not a valid URL";
  }

  return null;
}
