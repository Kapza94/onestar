import Link from "next/link";
import { Wordmark } from "./wordmark";

const CONTAINER = "mx-auto w-full max-w-[1120px] px-5 md:px-8";

const CTA_CLASS =
  "rounded-md border border-acid px-4 py-2 text-[13px] font-medium text-acid transition-colors hover:bg-acid hover:text-bg";

export function TopNav({
  hasReport,
  current,
  onHome,
  onOpenReport,
}: {
  hasReport?: boolean;
  current?: "home" | "searches";
  onHome?: () => void;
  onOpenReport?: () => void;
}) {
  return (
    <header className="border-b border-line">
      <div className={`${CONTAINER} flex h-16 items-center justify-between gap-4`}>
        {onHome ? <Wordmark onClick={onHome} /> : <Wordmark href="/" />}
        <nav className="hidden items-center gap-8 text-[13px] text-muted md:flex">
          {hasReport && onOpenReport ? (
            <button type="button" onClick={onOpenReport} className="hover:text-fg">
              report
            </button>
          ) : null}
          <Link
            href="/searches"
            className={current === "searches" ? "text-fg" : "hover:text-fg"}
          >
            all searches
          </Link>
        </nav>
        {onHome ? (
          <button type="button" onClick={onHome} className={CTA_CLASS}>
            new search
          </button>
        ) : (
          <Link href="/" className={CTA_CLASS}>
            new search
          </Link>
        )}
      </div>
    </header>
  );
}
