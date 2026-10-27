import Link from "next/link";

type Props = {
  label: string;
  href?: string;
  comingSoon?: boolean;
  icon?: React.ReactNode;
};

export function VehicleStartCard({ label, href, comingSoon, icon }: Props) {
  const base =
    "flex h-32 flex-col items-center justify-center gap-2 rounded-xl border text-sm font-medium transition";
  const active =
    "border-zinc-200 bg-white hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-100";
  const disabled =
    "pointer-events-none select-none border-dashed border-zinc-300 bg-transparent text-zinc-400 dark:border-zinc-700 dark:text-zinc-600";

  const inner = (
    <>
      {icon}
      <span>{label}</span>
      {comingSoon && (
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-800">
          Coming soon
        </span>
      )}
    </>
  );

  if (comingSoon || !href) {
    return <div className={`${base} ${disabled}`}>{inner}</div>;
  }
  return (
    <Link href={href} className={`${base} ${active}`}>
      {inner}
    </Link>
  );
}
