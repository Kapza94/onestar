import Image from "next/image";
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
    <Image
      src="/onestar-logo.png"
      alt="onestar"
      width={665}
      height={156}
      priority
      className="h-8 w-auto"
    />
  );

  if (href) {
    return (
      <Link href={href} aria-label="onestar home" className={`inline-flex items-center ${className}`}>
        {mark}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="onestar"
      className={`inline-flex items-center ${className}`}
    >
      {mark}
    </button>
  );
}
