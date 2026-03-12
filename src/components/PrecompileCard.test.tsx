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

  it("allows uint16 at max boundary", () => {
    expect(parseArg("65535", "uint16")).toBe(65535);
  });

  it("throws for uint32 values exceeding max", () => {
    expect(() => parseArg("4294967296", "uint32")).toThrow(
      "Value exceeds maximum for uint32"
    );
  });

  it("allows uint32 at max boundary", () => {
    expect(parseArg("4294967295", "uint32")).toBe(4294967295);
  });

  it("throws for uint64 values exceeding max", () => {
    expect(() => parseArg("18446744073709551616", "uint64")).toThrow(
      "Value exceeds maximum for uint64"
    );
  });

  it("handles zero for uint types", () => {
    expect(parseArg("0", "uint16")).toBe(0);
    expect(parseArg("0", "uint32")).toBe(0);
    expect(parseArg("0", "uint64")).toBe(BigInt(0));
  });

  it("throws on empty string for uint types", () => {
    expect(() => parseArg("", "uint32")).toThrow(
      "Value must be a non-negative integer"
    );
  });

  it("throws on whitespace-only string for uint types", () => {
    expect(() => parseArg("   ", "uint32")).toThrow(
      "Value must be a non-negative integer"
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

  it("enables Query button when no inputs required", () => {
    render(
      <PrecompileCard
        config={noInputConfig}
        publicClient={makeMockClient()}
      />
    );
    const btn = screen.getByRole("button", { name: "Query" });
    expect(btn).not.toBeDisabled();
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
      target: { value: "0x1234567890abcdef1234567890abcdef12345678" },
    });
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

  it("calls readContract and displays result on query", async () => {
    const client = makeMockClient(BigInt(99999));
    render(
      <PrecompileCard config={noInputConfig} publicClient={client} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(screen.getByText("99999")).toBeInTheDocument();
    });

    expect(client.readContract).toHaveBeenCalledTimes(1);
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
      expect(screen.getByText("OraclePxPrecompileFailed")).toBeInTheDocument();
    });
  });

  it("truncates long error messages", async () => {
    const longMsg = "x".repeat(300);
    const client = {
      readContract: vi.fn().mockRejectedValue(new Error(longMsg)),
    } as never;

    render(
      <PrecompileCard config={noInputConfig} publicClient={client} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      const errorEl = screen.getByText(/\.\.\.$/);
      expect(errorEl.textContent!.length).toBeLessThanOrEqual(203);
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

  it("shows loading state while querying", async () => {
    let resolvePromise: (value: unknown) => void;
    const client = {
      readContract: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      ),
    } as never;

    render(
      <PrecompileCard config={noInputConfig} publicClient={client} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    expect(screen.getByText("Querying...")).toBeInTheDocument();

    resolvePromise!(BigInt(1));

    await waitFor(() => {
      expect(screen.getByText("Query")).toBeInTheDocument();
    });
  });
});
