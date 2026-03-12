import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { parseArg } from "@/lib/parse-arg";
import { PrecompileCard, type PrecompileConfig } from "./PrecompileCard";

// ── parseArg unit tests ─────────────────────────────────────────────

describe("parseArg", () => {
  it("returns a trimmed address for type 'address'", () => {
    const addr = "  0xAbC123  ";
    expect(parseArg(addr, "address")).toBe("0xAbC123");
  });

  it("returns a BigInt for type 'uint64'", () => {
    expect(parseArg("12345678901234", "uint64")).toBe(12345678901234n);
  });

  it("returns BigInt(0) for '0' with uint64", () => {
    expect(parseArg("0", "uint64")).toBe(0n);
  });

  it("throws for invalid uint64", () => {
    expect(() => parseArg("not_a_number", "uint64")).toThrow(
      'Invalid uint64 value: "not_a_number"'
    );
  });

  it("returns a number for type 'uint16'", () => {
    expect(parseArg("42", "uint16")).toBe(42);
  });

  it("returns a number for type 'uint32'", () => {
    expect(parseArg("100000", "uint32")).toBe(100000);
  });

  it("throws for NaN with uint16/uint32", () => {
    expect(() => parseArg("abc", "uint16")).toThrow('Invalid number: "abc"');
    expect(() => parseArg("abc", "uint32")).toThrow('Invalid number: "abc"');
  });

  it("trims whitespace before parsing numeric types", () => {
    expect(parseArg("  99  ", "uint32")).toBe(99);
  });
});

// ── PrecompileCard component tests ──────────────────────────────────

const noInputConfig: PrecompileConfig = {
  functionName: "getL1BlockNumber",
  title: "L1 Block Number",
  description: "Fetch the latest L1 block number.",
  badge: "System",
  inputs: [],
};

const singleInputConfig: PrecompileConfig = {
  functionName: "getCoreUserExists",
  title: "Core User Exists",
  description: "Check whether a given address exists.",
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

function makeMockClient(returnValue: unknown = 42n) {
  return {
    readContract: vi.fn().mockResolvedValue(returnValue),
  } as never;
}

describe("PrecompileCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders title, description, and badge", () => {
    render(
      <PrecompileCard config={noInputConfig} publicClient={makeMockClient()} />
    );
    expect(screen.getByText("L1 Block Number")).toBeInTheDocument();
    expect(
      screen.getByText("Fetch the latest L1 block number.")
    ).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("renders a Query button", () => {
    render(
      <PrecompileCard config={noInputConfig} publicClient={makeMockClient()} />
    );
    expect(
      screen.getAllByRole("button", { name: /query/i })[0]
    ).toBeInTheDocument();
  });

  it("renders input fields for configs with inputs", () => {
    render(
      <PrecompileCard
        config={singleInputConfig}
        publicClient={makeMockClient()}
      />
    );
    expect(screen.getByLabelText("User Address")).toBeInTheDocument();
  });

  it("queries and displays result for a no-input precompile", async () => {
    const mockClient = makeMockClient(999n);
    render(<PrecompileCard config={noInputConfig} publicClient={mockClient} />);

    fireEvent.click(screen.getAllByRole("button", { name: /query/i })[0]);

    await waitFor(() => {
      expect(screen.getByText("999")).toBeInTheDocument();
    });
  });

  it("queries with user input and displays result", async () => {
    const mockClient = makeMockClient(true);
    render(
      <PrecompileCard config={singleInputConfig} publicClient={mockClient} />
    );

    const input = screen.getByLabelText("User Address");
    fireEvent.change(input, {
      target: { value: "0x1234567890abcdef1234567890abcdef12345678" },
    });

    fireEvent.click(screen.getAllByRole("button", { name: /query/i })[0]);

    await waitFor(() => {
      expect(screen.getByText("true")).toBeInTheDocument();
    });
  });

  it("displays error when contract call fails", async () => {
    const mockClient = {
      readContract: vi.fn().mockRejectedValue(new Error("Network error")),
    } as never;

    render(<PrecompileCard config={noInputConfig} publicClient={mockClient} />);

    fireEvent.click(screen.getAllByRole("button", { name: /query/i })[0]);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("extracts PrecompileLib error name from error message", async () => {
    const mockClient = {
      readContract: vi
        .fn()
        .mockRejectedValue(
          new Error(
            "execution reverted: PrecompileLib__L1BlockNumberPrecompileFailed"
          )
        ),
    } as never;

    render(<PrecompileCard config={noInputConfig} publicClient={mockClient} />);

    fireEvent.click(screen.getAllByRole("button", { name: /query/i })[0]);

    await waitFor(() => {
      expect(
        screen.getByText("L1BlockNumberPrecompileFailed")
      ).toBeInTheDocument();
    });
  });

  it("shows generic revert message for unrecognised revert", async () => {
    const mockClient = {
      readContract: vi.fn().mockRejectedValue(new Error("execution reverted")),
    } as never;

    render(<PrecompileCard config={noInputConfig} publicClient={mockClient} />);

    fireEvent.click(screen.getAllByRole("button", { name: /query/i })[0]);

    await waitFor(() => {
      expect(
        screen.getByText("Contract call reverted. Check your inputs.")
      ).toBeInTheDocument();
    });
  });

  it("shows 'Query failed' for non-Error throws", async () => {
    const mockClient = {
      readContract: vi.fn().mockRejectedValue("string error"),
    } as never;

    render(<PrecompileCard config={noInputConfig} publicClient={mockClient} />);

    fireEvent.click(screen.getAllByRole("button", { name: /query/i })[0]);

    await waitFor(() => {
      expect(screen.getByText("Query failed")).toBeInTheDocument();
    });
  });
});
