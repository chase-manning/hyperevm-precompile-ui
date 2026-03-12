import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PrecompileCard, parseArg } from "./PrecompileCard";
import type { PrecompileConfig } from "./PrecompileCard";
import type { PublicClient } from "viem";

describe("parseArg", () => {
  it("returns trimmed address for address type", () => {
    expect(parseArg("  0xAbC123  ", "address")).toBe("0xAbC123");
  });

  it("parses uint16 as Number", () => {
    expect(parseArg("42", "uint16")).toBe(42);
  });

  it("parses uint32 as Number", () => {
    expect(parseArg("1000000", "uint32")).toBe(1000000);
  });

  it("parses uint64 as BigInt", () => {
    expect(parseArg("18446744073709551615", "uint64")).toBe(
      BigInt("18446744073709551615")
    );
  });

  it("throws on non-numeric uint value", () => {
    expect(() => parseArg("abc", "uint32")).toThrow(
      "Invalid uint32 value: expected a non-negative integer."
    );
  });

  it("throws on negative-looking uint value", () => {
    expect(() => parseArg("-1", "uint16")).toThrow(
      "Invalid uint16 value: expected a non-negative integer."
    );
  });

  it("throws when uint16 exceeds max", () => {
    expect(() => parseArg("65536", "uint16")).toThrow(
      "Value exceeds maximum for uint16 (max 65535)."
    );
  });

  it("allows uint16 at max boundary", () => {
    expect(parseArg("65535", "uint16")).toBe(65535);
  });

  it("throws when uint32 exceeds max", () => {
    expect(() => parseArg("4294967296", "uint32")).toThrow(
      "Value exceeds maximum for uint32"
    );
  });

  it("allows uint32 at max boundary", () => {
    expect(parseArg("4294967295", "uint32")).toBe(4294967295);
  });

  it("throws when uint64 exceeds max", () => {
    expect(() => parseArg("18446744073709551616", "uint64")).toThrow(
      "Value exceeds maximum for uint64"
    );
  });

  it("throws on empty string for uint types", () => {
    expect(() => parseArg("", "uint32")).toThrow(
      "Invalid uint32 value: expected a non-negative integer."
    );
  });

  it("throws on whitespace-only string for uint types", () => {
    expect(() => parseArg("   ", "uint32")).toThrow(
      "Invalid uint32 value: expected a non-negative integer."
    );
  });

  it("handles zero for uint types", () => {
    expect(parseArg("0", "uint16")).toBe(0);
    expect(parseArg("0", "uint32")).toBe(0);
    expect(parseArg("0", "uint64")).toBe(BigInt(0));
  });

  it("throws on decimal values", () => {
    expect(() => parseArg("1.5", "uint32")).toThrow(
      "Invalid uint32 value: expected a non-negative integer."
    );
  });
});

describe("PrecompileCard", () => {
  const noInputConfig: PrecompileConfig = {
    functionName: "getL1BlockNumber",
    title: "L1 Block Number",
    description: "Fetch the latest L1 block number",
    badge: "System",
    inputs: [],
  };

  const withInputConfig: PrecompileConfig = {
    functionName: "getCoreUserExists",
    title: "Core User Exists",
    description: "Check whether an address exists on HyperCore.",
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

  function makeMockClient(returnValue: unknown = BigInt(12345)) {
    return {
      readContract: vi.fn().mockResolvedValue(returnValue),
    } as unknown as PublicClient;
  }

  it("renders title, description, and badge", () => {
    render(
      <PrecompileCard
        config={noInputConfig}
        publicClient={makeMockClient()}
      />
    );
    expect(screen.getByText("L1 Block Number")).toBeInTheDocument();
    expect(
      screen.getByText("Fetch the latest L1 block number")
    ).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("renders input fields for configs with inputs", () => {
    render(
      <PrecompileCard
        config={withInputConfig}
        publicClient={makeMockClient()}
      />
    );
    expect(screen.getByText("User Address")).toBeInTheDocument();
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
    const btn = screen.getByRole("button", { name: "Query" });
    expect(btn).toBeDisabled();
  });

  it("enables Query button after filling inputs", () => {
    render(
      <PrecompileCard
        config={withInputConfig}
        publicClient={makeMockClient()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("0x..."), {
      target: { value: "0x1234567890abcdef1234567890abcdef12345678" },
    });
    const btn = screen.getByRole("button", { name: "Query" });
    expect(btn).not.toBeDisabled();
  });

  it("calls readContract and displays result on query", async () => {
    const mockClient = makeMockClient(BigInt(99999));
    render(
      <PrecompileCard config={noInputConfig} publicClient={mockClient} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(screen.getByText("99999")).toBeInTheDocument();
    });

    expect(mockClient.readContract).toHaveBeenCalledTimes(1);
  });

  it("displays error on contract call failure", async () => {
    const mockClient = {
      readContract: vi.fn().mockRejectedValue(new Error("reverted")),
    } as unknown as PublicClient;

    render(
      <PrecompileCard config={noInputConfig} publicClient={mockClient} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(
        screen.getByText("Contract call reverted. Check your inputs.")
      ).toBeInTheDocument();
    });
  });

  it("extracts PrecompileLib error name", async () => {
    const mockClient = {
      readContract: vi
        .fn()
        .mockRejectedValue(
          new Error(
            "execution reverted: PrecompileLib__OraclePxPrecompileFailed"
          )
        ),
    } as unknown as PublicClient;

    render(
      <PrecompileCard config={noInputConfig} publicClient={mockClient} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(
        screen.getByText("OraclePxPrecompileFailed")
      ).toBeInTheDocument();
    });
  });

  it("truncates long error messages", async () => {
    const longMsg = "x".repeat(300);
    const mockClient = {
      readContract: vi.fn().mockRejectedValue(new Error(longMsg)),
    } as unknown as PublicClient;

    render(
      <PrecompileCard config={noInputConfig} publicClient={mockClient} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      const errorEl = screen.getByText(/\.\.\.$/);
      expect(errorEl.textContent!.length).toBeLessThanOrEqual(203);
    });
  });

  it("handles non-Error thrown values", async () => {
    const mockClient = {
      readContract: vi.fn().mockRejectedValue("some string error"),
    } as unknown as PublicClient;

    render(
      <PrecompileCard config={noInputConfig} publicClient={mockClient} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(screen.getByText("Query failed")).toBeInTheDocument();
    });
  });

  it("shows loading state while querying", async () => {
    let resolvePromise: (value: unknown) => void;
    const mockClient = {
      readContract: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      ),
    } as unknown as PublicClient;

    render(
      <PrecompileCard config={noInputConfig} publicClient={mockClient} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    expect(screen.getByText("Querying...")).toBeInTheDocument();

    resolvePromise!(BigInt(1));

    await waitFor(() => {
      expect(screen.getByText("Query")).toBeInTheDocument();
    });
  });
});
