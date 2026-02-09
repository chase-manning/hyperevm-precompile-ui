function formatValue(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return value.toString();
  if (typeof value === "string") return value;
  return String(value);
}

function isNamedKey(key: string): boolean {
  return isNaN(Number(key));
}

interface ResultDisplayProps {
  data: unknown;
  depth?: number;
}

export function ResultDisplay({ data, depth = 0 }: ResultDisplayProps) {
  if (data === null || data === undefined) return null;

  if (
    typeof data === "bigint" ||
    typeof data === "boolean" ||
    typeof data === "number" ||
    typeof data === "string"
  ) {
    return (
      <span className="font-mono text-sm break-all">{formatValue(data)}</span>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-sm text-muted-foreground italic">Empty</span>;
    }

    const isPrimitiveArray = data.every(
      (item) =>
        typeof item === "bigint" ||
        typeof item === "boolean" ||
        typeof item === "number" ||
        typeof item === "string"
    );

    if (isPrimitiveArray) {
      return (
        <span className="font-mono text-sm break-all">
          [{data.map(formatValue).join(", ")}]
        </span>
      );
    }

    return (
      <div className={depth > 0 ? "ml-4" : ""}>
        {data.map((item, i) => (
          <div
            key={i}
            className="border border-border rounded-md p-3 mb-2 last:mb-0"
          >
            <div className="text-xs text-muted-foreground mb-1">
              [{i}]
            </div>
            <ResultDisplay data={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>).filter(
      ([key]) => isNamedKey(key)
    );

    if (entries.length === 0) return null;

    return (
      <div className={depth > 0 ? "space-y-1" : "space-y-2"}>
        {entries.map(([key, value]) => {
          const isComplex =
            (typeof value === "object" && value !== null) ||
            Array.isArray(value);

          if (isComplex) {
            return (
              <div key={key}>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {key}
                </div>
                <div className="ml-3">
                  <ResultDisplay data={value} depth={depth + 1} />
                </div>
              </div>
            );
          }

          return (
            <div key={key} className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-muted-foreground shrink-0">
                {key}
              </span>
              <ResultDisplay data={value} depth={depth + 1} />
            </div>
          );
        })}
      </div>
    );
  }

  return <span className="font-mono text-sm">{String(data)}</span>;
}
