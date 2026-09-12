import type { ReactNode } from "react";

export function Stamp({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "rage" | "acid";
}) {
  const color =
    tone === "rage"
      ? "border-rage/40 text-rage"
      : tone === "acid"
        ? "border-acid/40 text-acid"
        : "border-line text-muted";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-[3px] text-[11px] tracking-[0.08em] ${color}`}
    >
      {children}
    </span>
  );
}

export function ConfidenceMark({ value }: { value: "high" | "medium" | "low" }) {
  const tone = value === "high" ? "acid" : value === "low" ? "default" : "rage";
  return <Stamp tone={tone}>{value} confidence</Stamp>;
}
