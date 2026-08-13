export function getUtcUsageDate(now: Date = new Date()): Date{
    return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));
}