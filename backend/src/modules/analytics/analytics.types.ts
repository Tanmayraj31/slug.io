export interface AggregationBucket {
  label: string | null;
  clicks: number;
}

export interface ClicksOverTimeBucket {
  date: string;   // "YYYY-MM-DD"
  clicks: number;
}

export interface DetailedAnalyticsDto {
  clicksOverTime: ClicksOverTimeBucket[];
  referrers: { referrer: string | null; clicks: number }[];
  browsers: { browser: string | null; clicks: number }[];
  operatingSystems: { operatingSystem: string | null; clicks: number }[];
  deviceTypes: { deviceType: string | null; clicks: number }[];
  countries: { countryCode: string | null; clicks: number }[];
}

export interface AnalyticsResponseDto {
  totalClicks: number;
  detailed: DetailedAnalyticsDto | null;
}