import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { ClicksOverTimeBucket } from "@/types/api";

export function ClickChart({ data }: { data: ClicksOverTimeBucket[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-base text-gray-400">
        No clicks in the last 90 days
      </div>
    );
  }

  return (
    <div className="h-64 w-full" role="img" aria-label="Line chart showing clicks over time for the last 90 days">
      <p className="sr-only">
        Click data: {data.map((d) => `${d.date}: ${d.clicks} clicks`).join(", ")}.
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="clicks"
            name="Clicks"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
