const millisPerDay = 24 * 60 * 60 * 1000;

// This function used to depend on the current time. Passing the time as a function parameter
// decouples it from the system clock. As a pure function it can now be tested easily.
export function daysUntilChristmas(now) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const christmasDay = new Date(now.getFullYear(), 12 - 1, 25);
  if (today.getTime() > christmasDay.getTime()) {
    christmasDay.setFullYear(now.getFullYear() + 1);
  }
  const diffMillis = christmasDay.getTime() - today.getTime();
  return Math.floor(diffMillis / millisPerDay);
}
