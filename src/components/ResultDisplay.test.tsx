import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { formatValue, isNamedKey, isPrimitive } from "@/lib/result-display-utils";
import { ResultDisplay } from "./ResultDisplay";

// ── isPrimitive ─────────────────────────────────────────────────────

describe("isPrimitive", () => {
  it("returns true for bigint", () => {
    expect(isPrimitive(42n)).toBe(true);
  });

  it("returns true for boolean", () => {
    expect(isPrimitive(true)).toBe(true);
    expect(isPrimitive(false)).toBe(true);
  });

  it("returns true for number", () => {
    expect(isPrimitive(0)).toBe(true);
    expect(isPrimitive(3.14)).toBe(true);
  });

  it("returns true for string", () => {
    expect(isPrimitive("hello")).toBe(true);
  });

  it("returns false for null, undefined, objects, arrays", () => {
    expect(isPrimitive(null)).toBe(false);
    expect(isPrimitive(undefined)).toBe(false);
    expect(isPrimitive({})).toBe(false);
    expect(isPrimitive([])).toBe(false);
  });
});

// ── formatValue ─────────────────────────────────────────────────────

describe("formatValue", () => {
  it("converts bigint to string", () => {
    expect(formatValue(123456789012345678901234567890n)).toBe(
      "123456789012345678901234567890"
    );
  });

  it("converts boolean true to 'true'", () => {
    expect(formatValue(true)).toBe("true");
  });

  it("converts boolean false to 'false'", () => {
    expect(formatValue(false)).toBe("false");
  });

  it("converts number to string", () => {
    expect(formatValue(42)).toBe("42");
    expect(formatValue(0)).toBe("0");
    expect(formatValue(-1.5)).toBe("-1.5");
  });

  it("returns string as-is", () => {
    expect(formatValue("hello")).toBe("hello");
    expect(formatValue("")).toBe("");
  });

  it("falls back to String() for other types", () => {
    expect(formatValue(null)).toBe("null");
    expect(formatValue(undefined)).toBe("undefined");
  });
});

// ── isNamedKey ──────────────────────────────────────────────────────

describe("isNamedKey", () => {
  it("returns true for alphabetic keys", () => {
    expect(isNamedKey("name")).toBe(true);
    expect(isNamedKey("amount")).toBe(true);
  });

  it("returns false for numeric string keys", () => {
    expect(isNamedKey("0")).toBe(false);
    expect(isNamedKey("1")).toBe(false);
    expect(isNamedKey("42")).toBe(false);
  });

  it("returns true for non-numeric alphanumeric keys", () => {
    expect(isNamedKey("field1")).toBe(true);
    expect(isNamedKey("abc")).toBe(true);
  });

  it("returns false for hex-parseable strings", () => {
    // Number("0x123") === 291, so this is numeric
    expect(isNamedKey("0x123")).toBe(false);
  });

  it("returns false for empty string", () => {
    // Number("") === 0, which is not NaN
    expect(isNamedKey("")).toBe(false);
  });
});

// ── ResultDisplay component ─────────────────────────────────────────

describe("ResultDisplay", () => {
  it("renders null for null data", () => {
    const { container } = render(<ResultDisplay data={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders null for undefined data", () => {
    const { container } = render(<ResultDisplay data={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders a primitive string", () => {
    render(<ResultDisplay data="hello world" />);
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("renders a primitive number", () => {
    render(<ResultDisplay data={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders a bigint", () => {
    render(<ResultDisplay data={999n} />);
    expect(screen.getByText("999")).toBeInTheDocument();
  });

  it("renders boolean true", () => {
    render(<ResultDisplay data={true} />);
    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("renders boolean false", () => {
    render(<ResultDisplay data={false} />);
    expect(screen.getByText("false")).toBeInTheDocument();
  });

  it("renders 'Empty' for empty arrays", () => {
    render(<ResultDisplay data={[]} />);
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });

  it("renders a primitive array as comma-separated list", () => {
    render(<ResultDisplay data={[1, 2, 3]} />);
    expect(screen.getByText("[1, 2, 3]")).toBeInTheDocument();
  });

  it("renders a bigint array", () => {
    render(<ResultDisplay data={[10n, 20n]} />);
    expect(screen.getByText("[10, 20]")).toBeInTheDocument();
  });

  it("renders named object keys and filters numeric keys", () => {
    // Simulate a viem struct return: has both numeric and named keys
    const data = { 0: 100n, 1: 200n, bid: 100n, ask: 200n };
    render(<ResultDisplay data={data} />);
    expect(screen.getByText("bid")).toBeInTheDocument();
    expect(screen.getByText("ask")).toBeInTheDocument();
    // numeric keys should be filtered
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("renders nested objects recursively", () => {
    const data = {
      summary: { accountValue: 100n, marginUsed: 50n },
    };
    render(<ResultDisplay data={data} />);
    expect(screen.getByText("summary")).toBeInTheDocument();
    expect(screen.getByText("accountValue")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("marginUsed")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("renders complex arrays with index markers", () => {
    const data = [{ name: "BTC" }, { name: "ETH" }];
    render(<ResultDisplay data={data} />);
    expect(screen.getByText("[0]")).toBeInTheDocument();
    expect(screen.getByText("[1]")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("ETH")).toBeInTheDocument();
  });

  it("returns null for objects with only numeric keys", () => {
    const data = { 0: "a", 1: "b" };
    const { container } = render(<ResultDisplay data={data} />);
    expect(container.innerHTML).toBe("");
  });
});
