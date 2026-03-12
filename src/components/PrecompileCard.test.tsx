import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PrecompileCard } from "./PrecompileCard";
import type { PrecompileConfig } from "./PrecompileCard";
import type { PublicClient } from "viem";

// Mock the auto-refresh hook to avoid timers in tests
vi.mock("@/hooks/use-auto-refresh", () => ({
  useAutoRefresh: () => ({
    isActive: false,
    toggle: vi.fn(),
    stop: vi.fn(),
    secondsAgo: null,
    isRefreshing: false,
  }),
  REFRESH_INTERVALS: [
    { value: 5, label: "5s" },
    { value: 10, label: "10s" },
    { value: 30, label: "30s" },
  ],
}));

function createMockClient(returnValue: unknown = BigInt(42)): PublicClient {
  return {
    readContract: vi.fn().mockResolvedValue(returnValue),
  } as unknown as PublicClient;
}

const noInputConfig: PrecompileConfig = {
  functionName: "getL1BlockNumber",
  title: "L1 Block Number",
  description: "Fetch the latest L1 block number.",
  badge: "System",
  inputs: [],
};

const addressInputConfig: PrecompileConfig = {
  functionName: "getWithdrawable",
  title: "Withdrawable",
  description: "Query the withdrawable balance.",
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

const uint64InputConfig: PrecompileConfig = {
  functionName: "getBbo",
  title: "Best Bid & Offer",
  description: "Get the current best bid and ask.",
  badge: "Perps",
  inputs: [
    {
      name: "asset",
      label: "Asset Index",
      placeholder: "e.g. 0",
      type: "uint64",
    },
  ],
};

describe("PrecompileCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders config title and description", () => {
    const client = createMockClient();
    render(<PrecompileCard config={noInputConfig} publicClient={client} />);
    expect(screen.getByText("L1 Block Number")).toBeInTheDocument();
    expect(
      screen.getByText("Fetch the latest L1 block number.")
    ).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("renders input fields for config with inputs", () => {
    const client = createMockClient();
    render(
      <PrecompileCard config={addressInputConfig} publicClient={client} />
    );
    expect(screen.getByLabelText("User Address")).toBeInTheDocument();
  });

  it("query button is enabled for no-input config", () => {
    const client = createMockClient();
    render(<PrecompileCard config={noInputConfig} publicClient={client} />);
    const button = screen.getByRole("button", { name: "Query" });
    expect(button).not.toBeDisabled();
  });

  it("queries successfully with no inputs", async () => {
    const client = createMockClient(BigInt(123456));
    render(<PrecompileCard config={noInputConfig} publicClient={client} />);

    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(screen.getByText("123456")).toBeInTheDocument();
    });

    expect(client.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "getL1BlockNumber",
      })
    );
  });

  it("queries successfully with address input (tests parseArg for address)", async () => {
    const client = createMockClient(BigInt(1000));
    render(
      <PrecompileCard config={addressInputConfig} publicClient={client} />
    );

    const input = screen.getByLabelText("User Address");
    fireEvent.change(input, {
      target: { value: "0x1234567890abcdef1234567890abcdef12345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(screen.getByText("1000")).toBeInTheDocument();
    });

    expect(client.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "getWithdrawable",
        args: ["0x1234567890abcdef1234567890abcdef12345678"],
      })
    );
  });

  it("queries successfully with uint64 input (tests parseArg for uint64 -> BigInt)", async () => {
    const client = createMockClient({
      bid: BigInt(100),
      ask: BigInt(200),
    });
    render(<PrecompileCard config={uint64InputConfig} publicClient={client} />);

    const input = screen.getByLabelText("Asset Index");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(screen.getByText("100")).toBeInTheDocument();
    });

    // uint64 should be parsed as BigInt
    expect(client.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "getBbo",
        args: [BigInt(5)],
      })
    );
  });

  it("displays error when contract call fails", async () => {
    const client = {
      readContract: vi
        .fn()
        .mockRejectedValue(new Error("Contract call reverted with something")),
    } as unknown as PublicClient;

    render(<PrecompileCard config={noInputConfig} publicClient={client} />);
    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(
        screen.getByText("Contract call reverted. Check your inputs.")
      ).toBeInTheDocument();
    });
  });

  it("displays PrecompileLib error name when present", async () => {
    const client = {
      readContract: vi
        .fn()
        .mockRejectedValue(
          new Error(
            "something PrecompileLib__OraclePxPrecompileFailed something"
          )
        ),
    } as unknown as PublicClient;

    render(<PrecompileCard config={noInputConfig} publicClient={client} />);
    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(screen.getByText("OraclePxPrecompileFailed")).toBeInTheDocument();
    });
  });

  it("shows generic error for non-Error exceptions", async () => {
    const client = {
      readContract: vi.fn().mockRejectedValue("string error"),
    } as unknown as PublicClient;

    render(<PrecompileCard config={noInputConfig} publicClient={client} />);
    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(screen.getByText("Query failed")).toBeInTheDocument();
    });
  });

  it("shows validation error after blur on invalid address", async () => {
    const client = createMockClient();
    render(
      <PrecompileCard config={addressInputConfig} publicClient={client} />
    );

    const input = screen.getByLabelText("User Address");
    fireEvent.change(input, { target: { value: "invalid" } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("parseArg handles uint32 as number (via getMarkPx config)", async () => {
    const uint32Config: PrecompileConfig = {
      functionName: "getMarkPx",
      title: "Mark Price",
      description: "Query mark price.",
      badge: "Perps",
      inputs: [
        {
          name: "perpIndex",
          label: "Perp Index",
          placeholder: "e.g. 0",
          type: "uint32",
        },
      ],
    };

    const client = createMockClient(BigInt(50000));
    render(<PrecompileCard config={uint32Config} publicClient={client} />);

    const input = screen.getByLabelText("Perp Index");
    fireEvent.change(input, { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Query" }));

    await waitFor(() => {
      expect(screen.getByText("50000")).toBeInTheDocument();
    });

    // uint32 should be parsed as a Number, not BigInt
    expect(client.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        args: [3],
      })
    );
  });
});
