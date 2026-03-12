import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultDisplay } from "./ResultDisplay";

// Test the helper functions via component rendering behavior

describe("formatValue (via ResultDisplay)", () => {
  it("renders bigint as string", () => {
    render(<ResultDisplay data={BigInt(12345)} />);
    expect(screen.getByText("12345")).toBeInTheDocument();
  });

  it("renders boolean true", () => {
    render(<ResultDisplay data={true} />);
    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("renders boolean false", () => {
    render(<ResultDisplay data={false} />);
    expect(screen.getByText("false")).toBeInTheDocument();
  });

  it("renders number", () => {
    render(<ResultDisplay data={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders string", () => {
    render(<ResultDisplay data="hello" />);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});

describe("isNamedKey (via ResultDisplay object rendering)", () => {
  it("filters out numeric keys from objects", () => {
    // Objects with numeric keys (like ABI array indices) should be filtered
    const data = { "0": "hidden", name: "visible" };
    render(<ResultDisplay data={data} />);
    expect(screen.getByText("visible")).toBeInTheDocument();
    expect(screen.getByText("name")).toBeInTheDocument();
    // The numeric key's value should not appear as a standalone rendered item
    expect(screen.queryByText("hidden")).not.toBeInTheDocument();
  });

  it("shows named keys", () => {
    const data = { coin: "BTC", leverage: "50" };
    render(<ResultDisplay data={data} />);
    expect(screen.getByText("coin")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("leverage")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
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

  it("renders empty array as 'Empty'", () => {
    render(<ResultDisplay data={[]} />);
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });

  it("renders primitive array inline", () => {
    render(<ResultDisplay data={[BigInt(1), BigInt(2), BigInt(3)]} />);
    expect(screen.getByText("[1, 2, 3]")).toBeInTheDocument();
  });

  it("renders string array inline", () => {
    render(<ResultDisplay data={["a", "b", "c"]} />);
    expect(screen.getByText("[a, b, c]")).toBeInTheDocument();
  });

  it("renders object with named keys as key-value pairs", () => {
    const data = { total: BigInt(100), hold: BigInt(50) };
    render(<ResultDisplay data={data} />);
    expect(screen.getByText("total")).toBeInTheDocument();
    expect(screen.getByText("hold")).toBeInTheDocument();
    // Values appear in both display and CopyButton, so use getAllByText
    expect(screen.getAllByText("100").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("50").length).toBeGreaterThanOrEqual(1);
  });

  it("renders nested objects recursively", () => {
    const data = {
      info: { coin: "BTC", decimals: 8 },
    };
    render(<ResultDisplay data={data} />);
    expect(screen.getByText("info")).toBeInTheDocument();
    expect(screen.getByText("coin")).toBeInTheDocument();
    expect(screen.getByText("decimals")).toBeInTheDocument();
    // Values may appear more than once due to CopyButton
    expect(screen.getAllByText("BTC").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("8").length).toBeGreaterThanOrEqual(1);
  });

  it("returns null for object with only numeric keys", () => {
    const data = { "0": "a", "1": "b" };
    const { container } = render(<ResultDisplay data={data} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders array of objects with index labels", () => {
    const data = [{ name: "Alice" }, { name: "Bob" }];
    render(<ResultDisplay data={data} />);
    expect(screen.getByText("[0]")).toBeInTheDocument();
    expect(screen.getByText("[1]")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});
