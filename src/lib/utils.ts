import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Note: BigInt values are serialized with an "n" suffix (e.g., "123n") to
// distinguish them from regular strings, since JSON has no native bigint type.
export function serializeResult(data: unknown): string {
  return JSON.stringify(
    data,
    (_key, value) =>
      typeof value === "bigint" ? `${value.toString()}n` : value,
    2
  );
}
