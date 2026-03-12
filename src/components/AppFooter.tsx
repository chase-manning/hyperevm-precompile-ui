import { Github } from "lucide-react";

export function AppFooter() {
  return (
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
  );
}
