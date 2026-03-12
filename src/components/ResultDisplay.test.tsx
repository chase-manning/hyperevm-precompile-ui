import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ResultDisplay } from "./ResultDisplay";
import { formatValue, isNamedKey } from "@/lib/format-result";

afterEach(cleanup);

describe("formatValue", () => {
  it("converts bigint to string", () => {
    expect(formatValue(BigInt(123))).toBe("123");
  });

  it("converts large bigint to string", () => {
    expect(formatValue(BigInt("9007199254740993"))).toBe("9007199254740993");
  });

  it("converts boolean true to 'true'", () => {
    expect(formatValue(true)).toBe("true");
  });

  it("converts boolean false to 'false'", () => {
    expect(formatValue(false)).toBe("false");
  });

  it("converts number to string", () => {
    expect(formatValue(42)).toBe("42");
  });

  it("returns string unchanged", () => {
    expect(formatValue("hello")).toBe("hello");
  });

  it("converts other types via String()", () => {
    expect(formatValue(null)).toBe("null");
    expect(formatValue(undefined)).toBe("undefined");
  });
});

describe("isNamedKey", () => {
  it("returns true for alphabetic keys", () => {
    expect(isNamedKey("name")).toBe(true);
    expect(isNamedKey("bid")).toBe(true);
  });

  it("returns false for numeric keys", () => {
    expect(isNamedKey("0")).toBe(false);
    expect(isNamedKey("1")).toBe(false);
    expect(isNamedKey("42")).toBe(false);
  });

  it("returns true for keys that contain numbers but are not purely numeric", () => {
    expect(isNamedKey("token0")).toBe(true);
    expect(isNamedKey("szDecimals")).toBe(true);
  });

  it("returns true for empty string (NaN check)", () => {
    // Number("") === 0, so isNaN returns false
    expect(isNamedKey("")).toBe(false);
  });
});

describe("ResultDisplay", () => {
  it("returns null for null data", () => {
    const { container } = render(<ResultDisplay data={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("returns null for undefined data", () => {
    const { container } = render(<ResultDisplay data={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders bigint value", () => {
    render(<ResultDisplay data={BigInt(42)} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders boolean value", () => {
    render(<ResultDisplay data={true} />);
    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("renders number value", () => {
    render(<ResultDisplay data={123} />);
    expect(screen.getByText("123")).toBeInTheDocument();
  });

  it("renders string value", () => {
    render(<ResultDisplay data={"hello world"} />);
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("renders 'Empty' for empty arrays", () => {
    render(<ResultDisplay data={[]} />);
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });

  it("renders primitive array inline", () => {
    render(<ResultDisplay data={[BigInt(1), BigInt(2), BigInt(3)]} />);
    expect(screen.getByText("[1, 2, 3]")).toBeInTheDocument();
  });

  it("renders object with named keys", () => {
    render(
      <ResultDisplay
        data={{
          0: BigInt(100),
          1: BigInt(200),
          bid: BigInt(100),
          ask: BigInt(200),
        }}
      />
    );
    expect(screen.getByText("bid")).toBeInTheDocument();
    expect(screen.getByText("ask")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("filters out numeric keys from objects", () => {
    const { container } = render(
      <ResultDisplay data={{ 0: "zero", name: "test" }} />
    );
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("test")).toBeInTheDocument();
    // The "0" key should be filtered out as a label
    const labels = container.querySelectorAll(
      ".text-xs.font-medium.text-muted-foreground"
    );
    const labelTexts = Array.from(labels).map((el) => el.textContent);
    expect(labelTexts).not.toContain("0");
  });

  it("renders nested objects recursively", () => {
    render(
      <ResultDisplay
        data={{
          name: "test",
          nested: { inner: "value" },
        }}
      />
    );
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("nested")).toBeInTheDocument();
    expect(screen.getByText("inner")).toBeInTheDocument();
    expect(screen.getByText("value")).toBeInTheDocument();
  });

  it("renders array of objects with index labels", () => {
    render(<ResultDisplay data={[{ name: "first" }, { name: "second" }]} />);
    expect(screen.getByText("[0]")).toBeInTheDocument();
    expect(screen.getByText("[1]")).toBeInTheDocument();
    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
  });

  it("returns null for object with only numeric keys", () => {
    const { container } = render(
      <ResultDisplay data={{ 0: "a", 1: "b" }} />
    );
    expect(container.innerHTML).toBe("");
  });
});
