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
  referrers: AggregationBucket[];
  browsers: AggregationBucket[];
  operatingSystems: AggregationBucket[];
  deviceTypes: AggregationBucket[];
  countries: AggregationBucket[];
}

export interface AnalyticsResponseDto {
  totalClicks: number;
  detailed: DetailedAnalyticsDto | null;
}