interface ReferrerTableProps {
  data: { referrer: string | null; clicks: number }[];
}

export function ReferrerTable({ data }: ReferrerTableProps) {
  if (data.length === 0) {
    return (
      <div>
        <h3 className="mb-3 text-base font-semibold text-gray-700">Top referrers</h3>
        <div className="flex h-24 items-center justify-center text-sm text-gray-400">
          No data
        </div>
      </div>
    );
  }

  const maxClicks = data[0]?.clicks ?? 1;

  return (
    <div>
      <h3 className="mb-3 text-base font-semibold text-gray-700">Top referrers</h3>
      <table className="w-full">
        <thead className="sr-only">
          <tr>
            <th>Referrer</th>
            <th>Clicks</th>
          </tr>
        </thead>
        <tbody className="space-y-3">
          {data.slice(0, 8).map((item) => {
            const label = item.referrer && item.referrer !== "" ? item.referrer : "Direct";
            const pct = Math.round((item.clicks / maxClicks) * 100);
            return (
              <tr key={item.referrer ?? "direct"}>
                <td colSpan={2}>
                  <div className="mb-1 flex items-center justify-between text-base">
                    <span className="truncate font-medium text-gray-700">{label}</span>
                    <span className="text-gray-500">{item.clicks.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
