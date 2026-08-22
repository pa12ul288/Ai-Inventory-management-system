interface StatItem {
  label: string;
  value: string;
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
    <div className={`mb-6 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${smCols}`}>
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs font-medium text-slate-500">{item.label}</p>
          <p className={`mt-1 text-lg font-semibold ${item.accent ?? "text-slate-900"}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
