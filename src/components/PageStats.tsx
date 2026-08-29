interface StatItem {
  label: string;
  value: string;
  subtitle?: string;
  accent?: string;
}

const COLS_BY_COUNT: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

export default function PageStats({ items }: { items: StatItem[] }) {
  const smCols = COLS_BY_COUNT[items.length] ?? "sm:grid-cols-4";

  return (
    <div className={`mb-6 grid grid-cols-2 gap-4 ${smCols}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40 transition-shadow hover:shadow-md hover:shadow-slate-200/60"
        >
          <p className="text-xs font-medium tracking-wide text-slate-500">{item.label}</p>
          <p className={`mt-1.5 text-2xl font-semibold tracking-tight ${item.accent ?? "text-slate-900"}`}>{item.value}</p>
          {item.subtitle && <p className="mt-1 text-xs text-slate-400">{item.subtitle}</p>}
        </div>
      ))}
    </div>
  );
}
