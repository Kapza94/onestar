export function Stamp({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
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
      className={`inline-flex items-center rounded-[2px] border px-2 py-[2px] font-label text-[11px] font-semibold uppercase tracking-[0.16em] ${color}`}
    >
      {children}
    </span>
  );
}

export function ConfidenceMark({ value }: { value: "high" | "medium" | "low" }) {
  const tone = value === "high" ? "acid" : value === "low" ? "default" : "rage";
  return <Stamp tone={tone}>{value} confidence</Stamp>;
}
