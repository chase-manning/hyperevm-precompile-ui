import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultDisplay } from "./ResultDisplay";

describe("formatValue (via ResultDisplay)", () => {
  it("formats bigint values", () => {
    render(<ResultDisplay data={BigInt(123456789)} />);
    expect(screen.getByText("123456789")).toBeInTheDocument();
  });

  it("formats boolean true", () => {
    render(<ResultDisplay data={true} />);
    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("formats boolean false", () => {
    render(<ResultDisplay data={false} />);
    expect(screen.getByText("false")).toBeInTheDocument();
  });

  it("formats number values", () => {
    render(<ResultDisplay data={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("formats string values", () => {
    render(<ResultDisplay data="hello world" />);
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("formats zero bigint", () => {
    render(<ResultDisplay data={BigInt(0)} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("formats large bigint values", () => {
    render(<ResultDisplay data={BigInt("18446744073709551615")} />);
    expect(screen.getByText("18446744073709551615")).toBeInTheDocument();
  });
});

describe("isNamedKey (via ResultDisplay)", () => {
  it("renders named keys and filters numeric keys", () => {
    const data = {
      0: BigInt(100),
      1: BigInt(200),
      bid: BigInt(100),
      ask: BigInt(200),
    };

    render(<ResultDisplay data={data} />);
    expect(screen.getByText("bid")).toBeInTheDocument();
    expect(screen.getByText("ask")).toBeInTheDocument();
  });

  it("returns null for object with only numeric keys", () => {
    const data = { 0: "a", 1: "b" };
    const { container } = render(<ResultDisplay data={data} />);
    expect(container.innerHTML).toBe("");
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

  it("renders primitive array as comma-separated values", () => {
    render(<ResultDisplay data={[BigInt(1), BigInt(2), BigInt(3)]} />);
    expect(screen.getByText("[1, 2, 3]")).toBeInTheDocument();
  });

  it("renders mixed primitive array", () => {
    render(<ResultDisplay data={["hello", 42, true]} />);
    expect(screen.getByText("[hello, 42, true]")).toBeInTheDocument();
  });

  it("renders complex array with indexed items", () => {
    const data = [
      { 0: "val1", name: "val1" },
      { 0: "val2", name: "val2" },
    ];
    render(<ResultDisplay data={data} />);
    expect(screen.getByText("[0]")).toBeInTheDocument();
    expect(screen.getByText("[1]")).toBeInTheDocument();
    expect(screen.getByText("val1")).toBeInTheDocument();
    expect(screen.getByText("val2")).toBeInTheDocument();
  });

  it("renders nested objects with named keys", () => {
    const data = {
      coin: "BTC",
      maxLeverage: 50,
      onlyIsolated: false,
    };
    render(<ResultDisplay data={data} />);
    expect(screen.getByText("coin")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("maxLeverage")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("onlyIsolated")).toBeInTheDocument();
    expect(screen.getByText("false")).toBeInTheDocument();
  });

  it("renders complex nested values recursively", () => {
    const data = {
      summary: {
        accountValue: BigInt(1000),
        marginUsed: BigInt(500),
      },
    };
    render(<ResultDisplay data={data} />);
    expect(screen.getByText("summary")).toBeInTheDocument();
    expect(screen.getByText("accountValue")).toBeInTheDocument();
    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("marginUsed")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  it("renders object with array value", () => {
    const data = {
      spots: [BigInt(1), BigInt(2)],
    };
    render(<ResultDisplay data={data} />);
    expect(screen.getByText("spots")).toBeInTheDocument();
    expect(screen.getByText("[1, 2]")).toBeInTheDocument();
  });
});
