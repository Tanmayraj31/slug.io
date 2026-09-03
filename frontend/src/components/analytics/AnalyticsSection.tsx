import { BarChart3 } from "lucide-react";
import type { AnalyticsResponseDto } from "@/types/api";
import { Card } from "@/components/ui/Card";
import { ClickChart } from "./ClickChart";
import { BreakdownPie } from "./BreakdownPie";
import { BreakdownBar } from "./BreakdownBar";
import { ReferrerTable } from "./ReferrerTable";

export function AnalyticsSection({ analytics }: { analytics: AnalyticsResponseDto }) {
  const detailed = analytics.detailed;

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-orange-600" aria-hidden="true" />
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Analytics</h2>
      </div>

      {!detailed ? (
        <div className="rounded-xl bg-gray-50/80 p-8 text-center">
          <div className="gradient-text text-4xl font-extrabold sm:text-5xl">
            {analytics.totalClicks.toLocaleString()}
          </div>
          <p className="mt-2 text-base font-medium text-gray-500">Total clicks</p>
          <p className="mt-4 text-sm text-gray-400">
            Detailed analytics are available on the Pro plan.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="mb-3 text-base font-semibold text-gray-700">
              Clicks over time (last 90 days)
            </h3>
            <ClickChart data={detailed.clicksOverTime} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <BreakdownPie
              title="Devices"
              data={detailed.deviceTypes.map((d) => ({
                label: d.deviceType ?? "Unknown",
                clicks: d.clicks,
              }))}
            />
            <BreakdownBar
              title="Browsers"
              data={detailed.browsers.map((b) => ({
                label: b.browser ?? "Unknown",
                clicks: b.clicks,
              }))}
            />
          </div>

          <BreakdownBar
            title="Top countries"
            data={detailed.countries.map((c) => ({
              label: c.countryCode ?? "Unknown",
              clicks: c.clicks,
            }))}
          />

          <BreakdownBar
            title="Operating systems"
            data={detailed.operatingSystems.map((os) => ({
              label: os.operatingSystem ?? "Unknown",
              clicks: os.clicks,
            }))}
          />

          <ReferrerTable data={detailed.referrers} />
        </div>
      )}
    </Card>
  );
}
