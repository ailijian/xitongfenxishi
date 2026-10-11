import type { CardProgress } from "./study";

export function nextStudyClockAt(progress: readonly CardProgress[] = [], now = Date.now()) {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  // The bounded check also catches foreground device-clock changes without an event.
  let next = Math.min(midnight.getTime(), now + 30_000);
  for (const p of progress) {
    for (const at of [p.reviewDueAt ? Date.parse(p.reviewDueAt) : NaN,
      p.firstPassAt ? Date.parse(p.firstPassAt) + 86_400_000 : NaN]) {
      if (at > now) next = Math.min(next, at);
    }
  }
  return next;
}
