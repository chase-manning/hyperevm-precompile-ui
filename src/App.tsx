import { useState, useMemo, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/use-theme";
import { makePublicClient } from "@/config/client";
import { PrecompileCard } from "@/components/PrecompileCard";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { precompiles } from "@/config/precompiles";
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  STORAGE_KEYS,
} from "@/lib/local-storage";

function getStoredRpc(): string {
  return safeGetItem(STORAGE_KEYS.CUSTOM_RPC_URL) || "";
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [customRpc, setCustomRpc] = useState(getStoredRpc);

  const handleRpcChange = useCallback((value: string) => {
    setCustomRpc(value);
    if (value.trim()) {
      safeSetItem(STORAGE_KEYS.CUSTOM_RPC_URL, value.trim());
    } else {
      safeRemoveItem(STORAGE_KEYS.CUSTOM_RPC_URL);
    }
  }, []);

  const publicClient = useMemo(
    () => makePublicClient(customRpc.trim() || undefined),
    [customRpc]
  );

  const isCustomRpc = customRpc.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <AppHeader
          theme={theme}
          toggleTheme={toggleTheme}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          isCustomRpc={isCustomRpc}
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
