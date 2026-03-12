export function formatValue(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return value.toString();
  if (typeof value === "string") return value;
  return String(value);
}

export function isNamedKey(key: string): boolean {
  return isNaN(Number(key));
}
