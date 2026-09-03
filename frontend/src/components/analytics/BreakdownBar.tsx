import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface BreakdownProps {
  title: string;
  data: { label: string | null; clicks: number }[];
}

const COLORS = ["#f97316", "#fb923c", "#fbbf24", "#fcd34d", "#fdba74", "#fdba74", "#fde68a"];

export function BreakdownBar({ title, data }: BreakdownProps) {
  if (data.length === 0) {
    return (
      <div>
        <h3 className="mb-3 text-base font-semibold text-gray-700">{title}</h3>
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">
          No data
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-base font-semibold text-gray-700">{title}</h3>
      <div className="h-48 w-full" role="img" aria-label={`Bar chart showing ${title.toLowerCase()}`}>
        <p className="sr-only">
          {data.map((d) => `${d.label}: ${d.clicks} clicks`).join(", ")}.
        </p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              interval={0}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip />
            <Bar dataKey="clicks" name="Clicks" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={entry.label ?? index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
