import type { InputConfig } from "@/components/PrecompileCard";

const UINT_RANGES: Record<string, { min: bigint; max: bigint }> = {
  uint16: { min: 0n, max: 65535n },
  uint32: { min: 0n, max: 4294967295n },
  uint64: { min: 0n, max: 18446744073709551615n },
};

/**
 * Validate an input value against its expected type.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateInput(
  value: string,
  type: InputConfig["type"]
): string | null {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null; // Empty is not an error (handled by required check)
  }

  if (type === "address") {
    return validateAddress(trimmed);
  }

  return validateUint(trimmed, type);
}

function validateAddress(value: string): string | null {
  if (!value.startsWith("0x")) {
    return "Address must start with 0x";
  }
  if (value.length !== 42) {
    return `Address must be 42 characters (currently ${value.length})`;
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
    return "Address must contain only hexadecimal characters (0-9, a-f)";
  }
  return null;
}

function validateUint(value: string, type: "uint16" | "uint32" | "uint64"): string | null {
  const range = UINT_RANGES[type];

  // Check for non-numeric characters (allow leading/trailing whitespace already trimmed)
  if (!/^-?\d+$/.test(value)) {
    return `Must be a valid integer`;
  }

  let parsed: bigint;
  try {
    parsed = BigInt(value);
  } catch {
    return `Must be a valid integer`;
  }

  if (parsed < range.min) {
    return `${type} cannot be negative`;
  }

  if (parsed > range.max) {
    return `${type} max value is ${range.max.toLocaleString()}`;
  }

  return null;
}

/**
 * Validate a custom RPC URL.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateRpcUrl(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null; // Empty means use default
  }

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return "RPC URL must start with http:// or https://";
  }

  try {
    new URL(trimmed);
  } catch {
    return "RPC URL is not a valid URL";
  }

  return null;
}
