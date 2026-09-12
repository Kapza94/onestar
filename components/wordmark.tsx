import Link from "next/link";

export function Wordmark({
  className = "",
  href,
  onClick,
}: {
  className?: string;
  href?: string;
  onClick?: () => void;
}) {
  const mark = (
    <>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-acid text-[13px] font-medium text-bg">
        *
      </span>
      <span className="text-[15px] tracking-[-0.04em]">onestar</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`inline-flex items-center gap-2 text-fg ${className}`}>
        {mark}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 text-fg ${className}`}>
      {mark}
    </button>
  );
}
