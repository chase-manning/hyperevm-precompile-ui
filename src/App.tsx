import { useState, useMemo, useCallback, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Github, Settings, RotateCcw, Search } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { makePublicClient, DEFAULT_RPC_URL } from "@/config/client";
import { PrecompileCard } from "@/components/PrecompileCard";
import { precompiles } from "@/config/precompiles";

const CATEGORIES = [
  "All",
  ...Array.from(new Set(precompiles.map((p) => p.badge))),
] as const;

function getInitialCategory(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    if (category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      return category;
    }
  } catch {
    // URL parsing unavailable
  }
  return "All";
}

function getInitialSearch(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("search") || "";
  } catch {
    return "";
  }
}

function getStoredRpc(): string {
  try {
    return localStorage.getItem("customRpcUrl") || "";
  } catch {
    return "";
  }
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [customRpc, setCustomRpc] = useState(getStoredRpc);
  const [search, setSearch] = useState(getInitialSearch);
  const [activeCategory, setActiveCategory] = useState(getInitialCategory);

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

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory !== "All") params.set("category", activeCategory);
    if (search.trim()) params.set("search", search.trim());
    const qs = params.toString();
    const newUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [activeCategory, search]);

  const filteredPrecompiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return precompiles.filter((p) => {
      if (activeCategory !== "All" && p.badge !== activeCategory) return false;
      if (query) {
        return (
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [search, activeCategory]);

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
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
            Available Reads
          </h2>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className="cursor-pointer"
              >
                <Badge
                  variant={activeCategory === category ? "default" : "outline"}
                >
                  {category}
                </Badge>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Showing {filteredPrecompiles.length} of {precompiles.length}{" "}
            precompile{precompiles.length !== 1 ? "s" : ""}
          </p>

          {filteredPrecompiles.length > 0 ? (
            <div className="grid gap-4">
              {filteredPrecompiles.map((config) => (
                <PrecompileCard
                  key={config.functionName}
                  config={config}
                  publicClient={publicClient}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                No precompiles match your search
                {activeCategory !== "All" ? ` in "${activeCategory}"` : ""}. Try
                a different search term or category.
              </p>
            </div>
          )}
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
