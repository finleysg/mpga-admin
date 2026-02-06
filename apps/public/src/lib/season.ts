export function getCurrentSeason(): number {
  const override = process.env.SEASON_YEAR;
  if (override) {
    const year = parseInt(override, 10);
    if (!isNaN(year)) return year;
  }
  return new Date().getFullYear();
}
