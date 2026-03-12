import { useState, useMemo, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { makePublicClient } from "@/config/client";
import { PrecompileCard } from "@/components/PrecompileCard";
import { precompiles } from "@/config/precompiles";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

function getStoredRpc(): string {
  try {
    return localStorage.getItem("customRpcUrl") || "";
  } catch {
    return "";
  }
}

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [customRpc, setCustomRpc] = useState(getStoredRpc);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <AppHeader
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          customRpc={customRpc}
          onRpcChange={handleRpcChange}
        />

        <Separator className="mb-10" />

        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
            Available Reads
          </h2>
          <div className="grid gap-4">
            {precompiles.map((config) => (
              <PrecompileCard
                key={config.functionName}
                config={config}
                publicClient={publicClient}
              />
            ))}
          </div>
        </section>

        <Separator className="mt-10 mb-6" />

        <AppFooter />
      </div>
    </div>
  );
}

export default App;
