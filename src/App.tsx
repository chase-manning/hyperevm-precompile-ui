import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const precompiles = [
  {
    title: "Oracle Prices",
    description:
      "Query real time oracle prices for any perpetual or spot asset listed on Hyperliquid.",
    badge: "Perps & Spot",
  },
  {
    title: "Perps Positions",
    description:
      "Look up open perpetual positions for any address, including size, entry price, and leverage.",
    badge: "Perps",
  },
  {
    title: "Spot Balances",
    description:
      "Check spot token balances for any address across all listed assets.",
    badge: "Spot",
  },
  {
    title: "Vault Equity",
    description:
      "Query the total equity held inside any Hyperliquid vault by address.",
    badge: "Vaults",
  },
  {
    title: "Staking Delegations",
    description:
      "View staking delegation amounts and validators for any address on the network.",
    badge: "Staking",
  },
  {
    title: "L1 Block Number",
    description:
      "Fetch the latest HyperCore L1 block number as seen by the EVM at block construction time.",
    badge: "System",
  },
];

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-3xl font-bold tracking-tight">
              Hyperliquid Precompile Explorer
            </h1>
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
        </header>

        <Separator className="mb-10" />

        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
            Available Reads
          </h2>
          <div className="grid gap-4">
            {precompiles.map((precompile) => (
              <Card
                key={precompile.title}
                className="transition-colors hover:border-foreground/20 cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {precompile.title}
                    </CardTitle>
                    <Badge variant="secondary">{precompile.badge}</Badge>
                  </div>
                  <CardDescription>{precompile.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Click to query
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="mt-10 mb-6" />

        <footer className="text-center text-xs text-muted-foreground">
          Reading from precompile address{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">
            0x0000...0800
          </code>{" "}
          on HyperEVM
        </footer>
      </div>
    </div>
  );
}

export default App;
