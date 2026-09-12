import Link from "next/link";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-baseline gap-2 text-fg ${className}`}>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-[0.92em] w-[0.92em] translate-y-[0.04em] text-rage"
      >
        <path
          fill="currentColor"
          d="M12 2.4l2.04 6.28 6.56.28-5.18 3.96 1.86 6.34L12 15.9 6.72 19.26l1.86-6.34L3.4 8.96l6.56-.28L12 2.4z"
        />
      </svg>
      <span className="font-sans text-[1.05em] font-semibold tracking-[-0.04em]">
        OneStar
      </span>
    </Link>
  );
}
