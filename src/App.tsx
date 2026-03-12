import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Sun, Moon, Github, Settings, RotateCcw } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { makePublicClient, DEFAULT_RPC_URL } from "@/config/client";
import { PrecompileCard } from "@/components/PrecompileCard";
import { precompiles } from "@/config/precompiles";

function getStoredRpc(): string {
  try {
    return localStorage.getItem("customRpcUrl") || "";
  } catch {
    return "";
  }
}

function getUrlParams(): {
  fn: string | null;
  category: string | null;
  inputValues: Record<string, string>;
} {
  const params = new URLSearchParams(window.location.search);
  const fn = params.get("fn");
  const category = params.get("category");

  const inputValues: Record<string, string> = {};
  if (fn) {
    const target = precompiles.find((p) => p.functionName === fn);
    if (target) {
      for (const input of target.inputs) {
        const val = params.get(input.name);
        if (val) {
          inputValues[input.name] = val;
        }
      }
    }
  }

  return { fn, category, inputValues };
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [customRpc, setCustomRpc] = useState(getStoredRpc);
  const [urlParams, setUrlParams] = useState(getUrlParams);
  const hasScrolled = useRef(false);

  // Listen for popstate and programmatic history changes to update URL params
  useEffect(() => {
    // Issue 5: Clean URL after consuming initial params so it doesn't become stale
    if (window.location.search) {
      history.replaceState({}, "", window.location.pathname);
    }

    const handler = () => setUrlParams(getUrlParams());
    window.addEventListener("popstate", handler);

    // Issue 4: Patch pushState/replaceState so programmatic URL changes also update state
    const origPushState = history.pushState.bind(history);
    const origReplaceState = history.replaceState.bind(history);
    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      origPushState(...args);
      handler();
    };
    history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
      origReplaceState(...args);
      handler();
    };

    return () => {
      window.removeEventListener("popstate", handler);
      history.pushState = origPushState;
      history.replaceState = origReplaceState;
    };
  }, []);

  // Ref callback to scroll to target card when it mounts (avoids race condition)
  const targetCardRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && urlParams.fn && !hasScrolled.current) {
        hasScrolled.current = true;
        requestAnimationFrame(() => {
          node.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    },
    [urlParams.fn]
  );

  const handleRpcChange = useCallback((value: string) => {
    setCustomRpc(value);
    try {
      if (value.trim()) {
        localStorage.setItem("customRpcUrl", value.trim());
      } else {
        localStorage.removeItem("customRpcUrl");
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const publicClient = useMemo(
    () => makePublicClient(customRpc.trim() || undefined),
    [customRpc]
  );

  const isCustomRpc = customRpc.trim().length > 0;

  const filteredPrecompiles = useMemo(() => {
    if (urlParams.category) {
      return precompiles.filter(
        (p) => p.badge.toLowerCase() === urlParams.category!.toLowerCase()
      );
    }
    return precompiles;
  }, [urlParams.category]);


  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold tracking-tight">
              Hyperliquid Precompile Explorer
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings((prev) => !prev)}
                className={`rounded-md border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer ${
                  isCustomRpc ? "text-primary border-primary/50" : ""
                }`}
                aria-label="Toggle settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={toggleTheme}
                className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            A lightweight interface for reading on chain data from{" "}
            <a
              href="https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/interacting-with-hypercore"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              Hyperliquid precompiles
            </a>
            . Query oracle prices, positions, balances, and more directly from
            HyperCore, with results guaranteed to match the latest L1 state.
          </p>

          {showSettings && (
            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="custom-rpc"
                  className="text-sm font-medium text-foreground"
                >
                  Custom RPC URL
                </label>
                {isCustomRpc && (
                  <button
                    onClick={() => handleRpcChange("")}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset to default
                  </button>
                )}
              </div>
              <Input
                id="custom-rpc"
                placeholder={DEFAULT_RPC_URL}
                value={customRpc}
                onChange={(e) => handleRpcChange(e.target.value)}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {isCustomRpc
                  ? `Using custom RPC: ${customRpc.trim()}`
                  : `Using default RPC: ${DEFAULT_RPC_URL}`}
              </p>
            </div>
          )}
        </header>

        <Separator className="mb-10" />

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Available Reads
              {urlParams.category && (
                <span className="ml-2 normal-case tracking-normal">
                  — {urlParams.category}
                </span>
              )}
            </h2>
            {urlParams.category && (
              <a
                href="/"
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
              >
                Show all
              </a>
            )}
          </div>
          <div className="grid gap-4">
            {filteredPrecompiles.map((config) => {
              const isTarget = urlParams.fn === config.functionName;
              return (
                <PrecompileCard
                  key={config.functionName}
                  config={config}
                  publicClient={publicClient}
                  initialValues={isTarget ? urlParams.inputValues : undefined}
                  autoExecute={isTarget}
                  targetRef={isTarget ? targetCardRefCallback : undefined}
                />
              );
            })}
          </div>
        </section>

        <Separator className="mt-10 mb-6" />

        <footer className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
          <div>
            Reading from contract{" "}
            <a
              href="https://hyperevmscan.io/address/0x4e4726F2D4F652151Eb80254C2C8859d152382Ce"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">
                0x4e47...82Ce
              </code>
            </a>{" "}
            on HyperEVM
          </div>
          <a
            href="https://github.com/chase-manning/hyperevm-precompile-ui"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            Open source on GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
