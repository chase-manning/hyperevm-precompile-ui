import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { PrecompileCard } from "./PrecompileCard";
import type { PrecompileConfig } from "./PrecompileCard";
import { parseArg } from "@/lib/parse-arg";

afterEach(cleanup);

describe("parseArg", () => {
  it("returns trimmed address string for address type", () => {
    expect(parseArg("  0xAbC123  ", "address")).toBe("0xAbC123");
  });

  it("returns BigInt for uint64 type", () => {
    expect(parseArg("12345", "uint64")).toBe(BigInt(12345));
  });

  it("returns BigInt for large uint64 values", () => {
    expect(parseArg("9007199254740993", "uint64")).toBe(
      BigInt("9007199254740993")
    );
  });

  it("returns number for uint32 type", () => {
    expect(parseArg("42", "uint32")).toBe(42);
  });

  it("returns number for uint16 type", () => {
    expect(parseArg("256", "uint16")).toBe(256);
  });

  it("trims whitespace before parsing", () => {
    expect(parseArg("  100  ", "uint32")).toBe(100);
    expect(parseArg("  999  ", "uint64")).toBe(BigInt(999));
  });

  it("throws for negative uint16 values", () => {
    expect(() => parseArg("-1", "uint16")).toThrow(
      "Value must be a non-negative integer"
    );
  });

  it("throws for negative uint32 values", () => {
    expect(() => parseArg("-1", "uint32")).toThrow(
      "Value must be a non-negative integer"
    );
  });

  it("throws for negative uint64 values", () => {
    expect(() => parseArg("-1", "uint64")).toThrow(
      "Value must be a non-negative integer"
    );
  });

  it("throws for uint16 values exceeding max", () => {
    expect(() => parseArg("65536", "uint16")).toThrow(
      "Value exceeds maximum for uint16"
    );
  });

  it("throws for uint32 values exceeding max", () => {
    expect(() => parseArg("4294967296", "uint32")).toThrow(
      "Value exceeds maximum for uint32"
    );
  });

  it("throws for uint64 values exceeding max", () => {
    expect(() => parseArg("18446744073709551616", "uint64")).toThrow(
      "Value exceeds maximum for uint64"
    );
  });

  it("throws for non-integer uint values", () => {
    expect(() => parseArg("1.5", "uint16")).toThrow(
      "Value must be a non-negative integer"
    );
  });
});

describe("PrecompileCard", () => {
  const noInputConfig: PrecompileConfig = {
    functionName: "getL1BlockNumber",
    title: "L1 Block Number",
    description: "Fetch the latest block number.",
    badge: "System",
    inputs: [],
  };

  const withInputConfig: PrecompileConfig = {
    functionName: "getCoreUserExists",
    title: "Core User Exists",
    description: "Check whether a user exists.",
    badge: "User",
    inputs: [
      {
        name: "user",
        label: "User Address",
        placeholder: "0x...",
        type: "address",
      },
    ],
  };

  function makeMockClient(result: unknown = BigInt(42)) {
    return {
      readContract: vi.fn().mockResolvedValue(result),
    } as never;
  }

  it("renders title, description, and badge", () => {
    render(
      <PrecompileCard config={noInputConfig} publicClient={makeMockClient()} />
    );
    expect(screen.getByText("L1 Block Number")).toBeInTheDocument();
    expect(
      screen.getByText("Fetch the latest block number.")
    ).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("renders input fields from config", () => {
    render(
      <PrecompileCard
        config={withInputConfig}
        publicClient={makeMockClient()}
      />
    );
    expect(screen.getByLabelText("User Address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0x...")).toBeInTheDocument();
  });

  it("disables Query button when required inputs are empty", () => {
    render(
      <PrecompileCard
        config={withInputConfig}
        publicClient={makeMockClient()}
      />
    );
    expect(screen.getByRole("button", { name: "Query" })).toBeDisabled();
  });

  it("enables Query button when all inputs are filled", () => {
    render(
      <PrecompileCard
        config={withInputConfig}
        publicClient={makeMockClient()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("0x..."), {
      target: { value: "0x1234567890abcdef" },
    });
    expect(screen.getByRole("button", { name: "Query" })).toBeEnabled();
  });

  it("enables Query button immediately for no-input configs", () => {
    render(
      <PrecompileCard config={noInputConfig} publicClient={makeMockClient()} />
    );
    expect(screen.getByRole("button", { name: "Query" })).toBeEnabled();
  });

  it("displays result after successful query", async () => {
    const client = makeMockClient(BigInt(12345));
    render(<PrecompileCard config={noInputConfig} publicClient={client} />);

    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(screen.getByText("12345")).toBeInTheDocument();
    });
  });

  it("displays error on contract call failure", async () => {
    const client = {
      readContract: vi.fn().mockRejectedValue(new Error("reverted")),
    } as never;

    render(<PrecompileCard config={noInputConfig} publicClient={client} />);
    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(
        screen.getByText("Contract call reverted. Check your inputs.")
      ).toBeInTheDocument();
    });
  });

  it("extracts PrecompileLib error from revert message", async () => {
    const client = {
      readContract: vi
        .fn()
        .mockRejectedValue(
          new Error("call failed PrecompileLib__OraclePxPrecompileFailed")
        ),
    } as never;

    render(<PrecompileCard config={noInputConfig} publicClient={client} />);
    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(
        screen.getByText("OraclePxPrecompileFailed")
      ).toBeInTheDocument();
    });
  });

  it("shows generic message for non-Error throws", async () => {
    const client = {
      readContract: vi.fn().mockRejectedValue("string error"),
    } as never;

    render(<PrecompileCard config={noInputConfig} publicClient={client} />);
    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(screen.getByText("Query failed")).toBeInTheDocument();
    });
  });
});
