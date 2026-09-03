import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface BreakdownProps {
  title: string;
  data: { label: string | null; clicks: number }[];
}

const COLORS = [
  "#f97316",
  "#fbbf24",
  "#fb7185",
  "#a78bfa",
  "#34d399",
  "#60a5fa",
  "#f472b6",
  "#94a3b8",
];

export function BreakdownPie({ title, data }: BreakdownProps) {
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
      <div className="h-48 w-full" role="img" aria-label={`Pie chart showing ${title.toLowerCase()} distribution`}>
        <p className="sr-only">
          {data.map((d) => `${d.label}: ${d.clicks} clicks`).join(", ")}.
        </p>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="clicks"
              nameKey="label"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.label ?? index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
