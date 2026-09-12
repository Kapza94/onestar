import Link from "next/link";
import { Stamp } from "./stamp";
import { Wordmark } from "./wordmark";

export function TopNav({
  demoMode,
  model,
  hasReport,
  current,
}: {
  demoMode?: boolean;
  model?: string;
  hasReport?: boolean;
  current?: "home" | "searches";
}) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex min-h-14 max-w-[1200px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-6">
        <Wordmark href="/" />
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted">
          <Link href="/#search" className={current === "home" ? "text-acid" : "hover:text-fg"}>
            search
          </Link>
          {hasReport ? (
            <a href="#report" className="hover:text-fg">
              report
            </a>
          ) : null}
          <Link href="/#live" className="hover:text-fg">
            live
          </Link>
          <Link href="/searches" className={current === "searches" ? "text-acid" : "hover:text-fg"}>
            all searches
          </Link>
        </nav>
        <span className="ml-auto hidden sm:inline-flex">
          {demoMode ? <Stamp tone="acid">example mode</Stamp> : <Stamp>{model || "public sources"}</Stamp>}
        </span>
      </div>
    </header>
  );
}
